
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  SolicitudesService,
  SolicitudPpp
} from '../../core/services/solicitudes';

import {
  DocumentosDriveService,
  DocumentoDrivePpp
} from '../../core/services/documentos-drive';

@Component({
  selector: 'app-documentos-drive',
  imports: [FormsModule],
  templateUrl: './documentos-drive.html',
  styleUrl: './documentos-drive.css'
})
export class DocumentosDrive implements OnInit {

  private solicitudesService = inject(SolicitudesService);
  private documentosService = inject(DocumentosDriveService);
  private router = inject(Router);

  solicitudes: SolicitudPpp[] = [];
  seleccionada: SolicitudPpp | null = null;
  documento: DocumentoDrivePpp | null = null;

  driveFileId = '';
  urlVistaPrevia = '';

  cargando = false;
  consultando = false;
  guardando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;

    this.solicitudesService.listar().subscribe({
      next: datos => {
        this.solicitudes = datos.filter(
          s => s.estado === 'APROBADA'
        );
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las solicitudes.';
        this.cargando = false;
      }
    });
  }

  seleccionar(solicitud: SolicitudPpp): void {
    this.seleccionada = solicitud;
    this.documento = null;
    this.driveFileId = '';
    this.urlVistaPrevia = '';
    this.error = '';
    this.mensaje = '';
    this.consultando = true;

    this.documentosService.obtener(solicitud.idSolicitud)
      .subscribe({
        next: documento => {
          this.documento = documento;
          this.consultando = false;
        },
        error: err => {
          this.consultando = false;

          if (err.status !== 404) {
            this.error = 'No se pudo consultar el documento.';
          }
        }
      });
  }

  guardar(): void {
    if (!this.seleccionada || this.documento ||
        this.guardando) {
      return;
    }

    const id = this.driveFileId.trim();

    if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
      this.error = 'Ingresa un ID válido de Google Drive.';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardando = true;

    this.documentosService.guardar(
      this.seleccionada.idSolicitud, id
    ).subscribe({
      next: documento => {
        this.documento = documento;
        this.guardando = false;
        this.driveFileId = '';
        this.mensaje = 'Documento vinculado correctamente.';
      },
      error: err => {
        this.guardando = false;
        this.error = err.status === 409
          ? 'La solicitud ya tiene un documento vinculado.'
          : 'No se pudo registrar el documento.';
      }
    });
  }

  obtenerVistaPrevia(): void {
    if (!this.seleccionada || !this.documento) {
      return;
    }

    this.documentosService.vistaPrevia(
      this.seleccionada.idSolicitud
    ).subscribe({
      next: datos => {
        this.urlVistaPrevia = datos.urlVistaPrevia;
      },
      error: () => {
        this.error = 'No se pudo obtener la vista previa.';
      }
    });
  }

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
