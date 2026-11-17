
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { TemaService } from '../../core/services/tema';

@Component({
  selector: 'app-inicio',
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  private auth = inject(AuthService);
  private router = inject(Router);
  private tema = inject(TemaService);

  usuario = this.auth.obtenerUsuario();

  // ======================================
  // CONTADOR CENTRALIZADO
  // ======================================

  get segundosRestantes(): number | null {
    return this.auth.segundosRestantes();
  }

  get tiempoRestante(): string {
    return this.auth.tiempoRestante;
  }

  get avisoExpiracion(): boolean {
    return this.auth.avisoExpiracion();
  }

  // ======================================
  // MODO OSCURO
  // ======================================

  get modoOscuro(): boolean {
    return this.tema.modoOscuro();
  }

  alternarTema(): void {
    this.tema.alternar();
  }

  // ======================================
  // MÓDULOS DEL ESTUDIANTE
  // ======================================

  verRequisitos(): void {
    this.router.navigateByUrl('/requisitos');
  }

  verEmpresas(): void {
    this.router.navigateByUrl('/empresas');
  }

  verSolicitudes(): void {
    this.router.navigateByUrl('/solicitudes');
  }

  verRegistroCartas(): void {
    this.router.navigateByUrl('/registro-cartas');
  }

  // ======================================
  // MÓDULOS DEL COORDINADOR
  // ======================================

  verValidacionSolicitudes(): void {
    this.router.navigateByUrl('/validar-solicitudes');
  }

  verDocumentosDrive(): void {
    this.router.navigateByUrl('/documentos-drive');
  }

  // ======================================
  // MÓDULO DE SECRETARÍA
  // ======================================

  verCartasPresentacion(): void {
    this.router.navigateByUrl('/cartas-presentacion');
  }

  // ======================================
  // CERRAR SESIÓN
  // ======================================

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }


  // ==========================================
  // CU012 - ASIGNACIÓN DE SUPERVISORES
  // ==========================================

  verSupervisores(): void {
    this.router.navigateByUrl('/supervisores');
  }

} // Esta llave cierra la clase Inicio
