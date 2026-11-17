
import {
  Injectable,
  inject,
  signal,
  computed
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  estado: string;
}

export interface LoginResponse {
  token: string;
  tipoToken: string;
  expiresIn: number;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = '/api/v1/auth';

  private readonly claveToken = 'ppp_token';
  private readonly claveUsuario = 'ppp_usuario';

  // ======================================
  // CONTROL GLOBAL DE SESIÓN
  // ======================================

  readonly segundosRestantes = signal<number | null>(null);

  readonly avisoExpiracion = computed(() => {
    const segundos = this.segundosRestantes();

    return segundos !== null &&
      segundos > 0 &&
      segundos <= 120;
  });

  private expiracionMs: number | null = null;

  private intervaloSesion:
    ReturnType<typeof setInterval> | null = null;

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  constructor() {
    this.iniciarControlSesion();
  }

  // ======================================
  // INICIAR SESIÓN
  // ======================================

  login(correo: string, clave: string) {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { correo, clave }
    ).pipe(
      tap(respuesta => {

        sessionStorage.setItem(
          this.claveToken,
          respuesta.token
        );

        sessionStorage.setItem(
          this.claveUsuario,
          JSON.stringify(respuesta.usuario)
        );

        // Inicia el control con el JWT nuevo.
        this.iniciarControlSesion();

      })
    );
  }

  // ======================================
  // OBTENER USUARIO
  // ======================================

  obtenerUsuario(): Usuario | null {

    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const datos = sessionStorage.getItem(
      this.claveUsuario
    );

    if (!datos) {
      return null;
    }

    try {
      return JSON.parse(datos) as Usuario;
    } catch {
      return null;
    }
  }

  // ======================================
  // VERIFICAR AUTENTICACIÓN REAL
  // ======================================

  estaAutenticado(): boolean {

    if (typeof sessionStorage === 'undefined') {
      return false;
    }

    const token = sessionStorage.getItem(
      this.claveToken
    );

    if (!token) {
      return false;
    }

    const expiracion = this.obtenerExpiracionJwt(token);

    if (
      expiracion === null ||
      expiracion <= Date.now()
    ) {
      this.cerrarSesion();
      return false;
    }

    return true;
  }

  // ======================================
  // LEER EXPIRACIÓN DEL JWT
  // ======================================

  private obtenerExpiracionJwt(
    token: string
  ): number | null {

    try {

      const partes = token.split('.');

      if (partes.length !== 3) {
        return null;
      }

      const base64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const base64Normalizado = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      );

      const datos = JSON.parse(
        atob(base64Normalizado)
      ) as { exp?: unknown };

      if (
        typeof datos.exp !== 'number' ||
        !Number.isFinite(datos.exp) ||
        datos.exp <= 0
      ) {
        return null;
      }

      // exp está expresado en segundos Unix.
      return datos.exp * 1000;

    } catch {
      return null;
    }
  }

  // ======================================
  // INICIAR CONTROL DE SESIÓN
  // ======================================

  private iniciarControlSesion(): void {

    this.detenerTemporizador();

    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const token = sessionStorage.getItem(
      this.claveToken
    );

    if (!token) {
      this.expiracionMs = null;
      this.segundosRestantes.set(null);
      return;
    }

    this.expiracionMs = this.obtenerExpiracionJwt(token);

    if (this.expiracionMs === null) {
      this.cerrarSesion();
      return;
    }

    // Actualización inmediata.
    this.actualizarTiempo();

    if (
      this.expiracionMs <= Date.now()
    ) {
      return;
    }

    // Un solo temporizador para el servicio.
    this.intervaloSesion = setInterval(() => {
      this.actualizarTiempo();
    }, 1000);
  }

  // ======================================
  // ACTUALIZAR TIEMPO RESTANTE
  // ======================================

  private actualizarTiempo(): void {

    if (this.expiracionMs === null) {
      return;
    }

    const diferencia =
      this.expiracionMs - Date.now();

    const segundos = Math.max(
      0,
      Math.ceil(diferencia / 1000)
    );

    this.segundosRestantes.set(segundos);

    if (diferencia <= 0) {
      this.finalizarSesionVencida();
    }
  }

  // ======================================
  // FORMATO DEL CONTADOR
  // ======================================

  get tiempoRestante(): string {

    const total = this.segundosRestantes();

    if (total === null) {
      return '--:--';
    }

    const horas = Math.floor(total / 3600);

    const minutos = Math.floor(
      (total % 3600) / 60
    );

    const segundos = total % 60;

    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');

    if (horas > 0) {
      const hh = String(horas).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
  }

  // ======================================
  // SESIÓN VENCIDA
  // ======================================

  private finalizarSesionVencida(): void {

    this.cerrarSesion();

    // El usuario debe autenticarse nuevamente.
    this.router.navigateByUrl('/login');
  }

  // ======================================
  // DETENER TEMPORIZADOR
  // ======================================

  private detenerTemporizador(): void {

    if (this.intervaloSesion !== null) {
      clearInterval(this.intervaloSesion);
      this.intervaloSesion = null;
    }
  }

  // ======================================
  // CERRAR SESIÓN
  // ======================================

  cerrarSesion(): void {

    this.detenerTemporizador();

    this.expiracionMs = null;
    this.segundosRestantes.set(null);

    if (typeof sessionStorage !== 'undefined') {

      sessionStorage.removeItem(
        this.claveToken
      );

      sessionStorage.removeItem(
        this.claveUsuario
      );

    }
  }
}
