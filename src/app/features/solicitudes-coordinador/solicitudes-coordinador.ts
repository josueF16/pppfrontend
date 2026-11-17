
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  SolicitudesService,
  SolicitudPpp,
  DetalleSolicitudPpp
} from '../../core/services/solicitudes';

@Component({
  selector: 'app-solicitudes-coordinador',
  imports: [FormsModule],
  templateUrl: './solicitudes-coordinador.html',
  styleUrl: './solicitudes-coordinador.css'
})
export class SolicitudesCoordinador implements OnInit {

  private service = inject(SolicitudesService);
  private router = inject(Router);

  solicitudes: SolicitudPpp[] = [];
  seleccionada: SolicitudPpp | null = null;
  detalle: DetalleSolicitudPpp | null = null;

  comentario = '';
  cargando = false;
  procesando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.service.listar().subscribe({
      next: datos => {
        this.solicitudes = datos;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.status === 401
          ? 'La sesión ha expirado.'
          : 'No se pudieron cargar las solicitudes.';
      }
    });
  }

  seleccionar(solicitud: SolicitudPpp): void {
    this.seleccionada = solicitud;
    this.detalle = null;
    this.comentario = solicitud.comentario ?? '';
    this.error = '';
    this.mensaje = '';

    this.service.detalle(solicitud.idSolicitud).subscribe({
      next: datos => {
        this.detalle = datos;
      },
      error: () => {
        this.error = 'No se pudo consultar el detalle.';
      }
    });
  }

  validar(estado: 'APROBADA' | 'RECHAZADA'): void {
    if (!this.seleccionada ||
        this.seleccionada.estado !== 'PENDIENTE' ||
        this.procesando) {
      return;
    }

    if (estado === 'RECHAZADA' && !this.comentario.trim()) {
      this.error = 'Ingrese un comentario para rechazar.';
      return;
    }

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.service.validar(
      this.seleccionada.idSolicitud,
      estado,
      this.comentario
    ).subscribe({
      next: () => {
        this.procesando = false;
        this.mensaje = `Solicitud ${estado.toLowerCase()} correctamente.`;
        this.seleccionada = null;
        this.detalle = null;
        this.comentario = '';
        this.cargar();
      },
      error: err => {
        this.procesando = false;
        this.error = err.status === 409
          ? 'Esta solicitud ya fue revisada.'
          : err.status === 403
            ? 'No tienes permisos para validar.'
            : err.status === 401
              ? 'La sesión ha expirado.'
              : 'No se pudo actualizar la solicitud.';
      }
    });
  }

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
