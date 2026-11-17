
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  CartasPresentacionService,
  CartaPresentacionPpp
} from '../../core/services/cartas-presentacion';

import { SolicitudPpp } from '../../core/services/solicitudes';

@Component({
  selector: 'app-cartas-presentacion',
  imports: [FormsModule],
  templateUrl: './cartas-presentacion.html',
  styleUrl: './cartas-presentacion.css'
})
export class CartasPresentacion implements OnInit, OnDestroy {

  private service = inject(CartasPresentacionService);
  private router = inject(Router);

  // ==========================================
  // DATOS DE SOLICITUDES
  // ==========================================

  solicitudes: SolicitudPpp[] = [];
  idSolicitud: number | null = null;

  // ==========================================
  // DATOS DE CARTAS
  // ==========================================

  carta: CartaPresentacionPpp | null = null;
  idCartaConsultar: number | null = null;

  contenido = '';

  // ==========================================
  // NOTIFICACIONES
  // ==========================================

  error = '';
  mensaje = '';

  private temporizadorNotificacion:
    ReturnType<typeof setTimeout> | null = null;

  // ==========================================
  // ESTADOS DE PROCESAMIENTO
  // ==========================================

  cargando = false;
  procesando = false;

  // ==========================================
  // MODELO DE CARTA PARA PRUEBAS
  // ==========================================

  modelo = `CARTA DE PRESENTACION - MODELO DE PRUEBA

Fecha: {{FECHA}}

Por medio de la presente, se presenta al estudiante
{{NOMBRES}} {{APELLIDOS}}, identificado con
DNI {{DNI}}, para realizar sus practicas
preprofesionales en la empresa {{EMPRESA}}.

Correo del estudiante: {{CORREO}}.`;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    if (this.temporizadorNotificacion !== null) {
      clearTimeout(this.temporizadorNotificacion);
      this.temporizadorNotificacion = null;
    }
  }

  // ==========================================
  // CARGAR SOLICITUDES APROBADAS
  // ==========================================

  cargarSolicitudes(): void {
    this.cargando = true;

    this.service.solicitudesAprobadas().subscribe({
      next: datos => {
        this.solicitudes = datos;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // CREAR BORRADOR DE CARTA
  // ==========================================

  crearCarta(): void {
    if (this.idSolicitud === null || this.procesando) {
      return;
    }

    this.limpiarMensajes();
    this.procesando = true;

    this.service.crear(this.idSolicitud, this.modelo)
      .subscribe({
        next: carta => {
          this.carta = carta;
          this.contenido = carta.contenido ?? '';
          this.idCartaConsultar = carta.idCarta;
          this.procesando = false;

          this.notificarExito(
            'Borrador creado correctamente.'
          );
        },
        error: err => {
          this.procesando = false;
          this.mostrarError(err);
        }
      });
  }

  // ==========================================
  // CONSULTAR CARTA EXISTENTE
  // ==========================================

  consultarCarta(): void {
    if (this.idCartaConsultar === null) {
      return;
    }

    this.limpiarMensajes();

    this.service.obtener(this.idCartaConsultar).subscribe({
      next: carta => {
        this.carta = carta;
        this.contenido = carta.contenido ?? '';
      },
      error: err => {
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // GUARDAR CAMBIOS DEL BORRADOR
  // ==========================================

  guardarCarta(): void {
    if (
      !this.carta ||
      this.carta.estado !== 'BORRADOR' ||
      !this.contenido.trim() ||
      this.procesando
    ) {
      return;
    }

    this.limpiarMensajes();
    this.procesando = true;

    this.service.guardar(
      this.carta.idCarta,
      this.contenido
    ).subscribe({
      next: carta => {
        this.carta = carta;
        this.contenido = carta.contenido ?? '';
        this.procesando = false;

        this.notificarExito(
          'Cambios guardados correctamente.'
        );
      },
      error: err => {
        this.procesando = false;
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // ENVIAR CARTA DE PRESENTACION
  // ==========================================

  enviarCarta(): void {
    if (
      !this.carta ||
      this.carta.estado !== 'BORRADOR' ||
      this.procesando
    ) {
      return;
    }

    if (!confirm(
      '¿Confirmas el envío de esta carta dentro del sistema?'
    )) {
      return;
    }

    this.limpiarMensajes();
    this.procesando = true;

    this.service.enviar(this.carta.idCarta).subscribe({
      next: carta => {
        this.carta = carta;
        this.contenido = carta.contenido ?? '';
        this.procesando = false;

        this.notificarExito(
          'Carta marcada como enviada.'
        );
      },
      error: err => {
        this.procesando = false;
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // CANCELAR BORRADOR
  // ==========================================

  cancelarCarta(): void {
    if (
      !this.carta ||
      this.carta.estado !== 'BORRADOR' ||
      this.procesando
    ) {
      return;
    }

    if (!confirm('¿Cancelar este borrador?')) {
      return;
    }

    this.limpiarMensajes();
    this.procesando = true;

    this.service.cancelar(this.carta.idCarta).subscribe({
      next: carta => {
        this.carta = carta;
        this.procesando = false;

        this.notificarExito(
          'Borrador cancelado.'
        );
      },
      error: err => {
        this.procesando = false;
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // SISTEMA DE NOTIFICACIONES FLOTANTES
  // ==========================================

  limpiarMensajes(): void {
    if (this.temporizadorNotificacion !== null) {
      clearTimeout(this.temporizadorNotificacion);
      this.temporizadorNotificacion = null;
    }

    this.error = '';
    this.mensaje = '';
  }

  cerrarNotificacion(): void {
    this.limpiarMensajes();
  }

  notificarExito(texto: string): void {
    this.limpiarMensajes();

    this.mensaje = texto;
    this.programarCierre();
  }

  notificarError(texto: string): void {
    this.limpiarMensajes();

    this.error = texto;
    this.programarCierre();
  }

  private programarCierre(): void {
    this.temporizadorNotificacion = setTimeout(() => {
      this.limpiarMensajes();
    }, 5000);
  }

  // ==========================================
  // MANEJO DE ERRORES HTTP
  // ==========================================

  mostrarError(err: any): void {
    const texto = err.status === 401
      ? 'La sesión expiró. Inicia sesión nuevamente.'
      : err.status === 403
      ? 'No tienes permisos para esta operación.'
      : err.status === 409
      ? 'La solicitud ya tiene una carta o no permite esta operación.'
      : 'No se pudo completar la operación.';

    this.notificarError(texto);
  }

  // ==========================================
  // VOLVER AL PANEL PRINCIPAL
  // ==========================================

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
