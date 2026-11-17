
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  SupervisoresService,
  SupervisorPpp,
  NuevoSupervisor,
  AsignacionSupervisor
} from '../../core/services/supervisores';

import {
  SolicitudesService,
  SolicitudPpp
} from '../../core/services/solicitudes';

@Component({
  selector: 'app-supervisores',
  imports: [FormsModule],
  templateUrl: './supervisores.html',
  styleUrl: './supervisores.css'
})
export class Supervisores implements OnInit {

  private service = inject(SupervisoresService);
  private solicitudesService = inject(SolicitudesService);
  private router = inject(Router);

  supervisores: SupervisorPpp[] = [];
  solicitudes: SolicitudPpp[] = [];

  cargando = false;
  procesando = false;

  error = '';
  mensaje = '';

  // ======================================
  // FORMULARIO DE SUPERVISORES
  // ======================================

  nuevo: NuevoSupervisor = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    tipo: 'ACADEMICO'
  };

  // ======================================
  // FORMULARIO DE ASIGNACION
  // ======================================

  idSolicitud: number | null = null;

  idAcademico: number | null = null;
  idEmpresarial: number | null = null;

  asignacion: AsignacionSupervisor | null = null;

  // ======================================
  // INICIALIZACION
  // ======================================

  ngOnInit(): void {
    this.cargarSupervisores();
    this.cargarSolicitudes();
  }

  // ======================================
  // RF75 - LISTAR SUPERVISORES
  // ======================================

  cargarSupervisores(): void {

    this.cargando = true;

    this.service.listar().subscribe({

      next: datos => {
        this.supervisores = datos;
        this.cargando = false;
      },

      error: err => {
        this.cargando = false;
        this.mostrarError(err);
      }
    });
  }

  // ======================================
  // CONSULTAR SOLICITUDES APROBADAS
  // ======================================

  cargarSolicitudes(): void {

    this.solicitudesService.listar().subscribe({

      next: datos => {
        this.solicitudes = datos.filter(
          s => s.estado === 'APROBADA'
        );
      },

      error: err => {
        this.mostrarError(err);
      }
    });
  }

  // ======================================
  // RF78 - REGISTRAR SUPERVISOR
  // ======================================

  registrarSupervisor(): void {

    if (this.procesando) {
      return;
    }

    if (
      !this.nuevo.nombres.trim() ||
      !this.nuevo.apellidos.trim() ||
      !this.nuevo.correo.trim()
    ) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.procesando = true;

    this.service.registrar(this.nuevo).subscribe({

      next: () => {

        this.procesando = false;

        this.mensaje =
          'Supervisor registrado correctamente.';

        this.nuevo = {
          nombres: '',
          apellidos: '',
          correo: '',
          telefono: '',
          tipo: 'ACADEMICO'
        };

        this.cargarSupervisores();
      },

      error: err => {

        this.procesando = false;
        this.mostrarError(err);
      }
    });
  }

  // ======================================
  // FILTRAR SUPERVISORES DISPONIBLES
  // ======================================

  supervisoresPorTipo(
    tipo: 'ACADEMICO' | 'EMPRESARIAL'
  ): SupervisorPpp[] {

    return this.supervisores.filter(
      s => s.tipo === tipo && s.estado === 'ACTIVO'
    );
  }

  // ======================================
  // CARGAR ASIGNACION EXISTENTE
  // ======================================

  seleccionarSolicitud(): void {

    this.asignacion = null;
    this.idAcademico = null;
    this.idEmpresarial = null;

    this.error = '';
    this.mensaje = '';

    if (this.idSolicitud === null) {
      return;
    }

    const idActual = this.idSolicitud;

    this.service.consultarAsignacion(idActual)
      .subscribe({

        next: datos => {

          if (this.idSolicitud !== idActual) {
            return;
          }

          this.asignacion = datos;

          this.idAcademico =
            datos.idSupervisorAcademico;

          this.idEmpresarial =
            datos.idSupervisorEmpresarial;
        },

        error: err => {

          if (this.idSolicitud !== idActual) {
            return;
          }

          if (err.status !== 404) {
            this.mostrarError(err);
          }
        }
      });
  }

  // ======================================
  // RF79 - ASIGNAR SUPERVISORES
  // ======================================

  asignarSupervisores(): void {

    if (
      this.procesando ||
      this.idSolicitud === null
    ) {
      return;
    }

    if (
      this.idAcademico === null &&
      this.idEmpresarial === null
    ) {
      this.error =
        'Selecciona al menos un supervisor.';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.procesando = true;

    const idActual = this.idSolicitud;

    this.service.asignar({
      idSolicitud: idActual,
      idSupervisorAcademico: this.idAcademico,
      idSupervisorEmpresarial: this.idEmpresarial
    }).subscribe({

      next: datos => {

        this.procesando = false;

        if (this.idSolicitud !== idActual) {
          return;
        }

        this.asignacion = datos;

        this.mensaje =
          'Supervisores asignados correctamente.';
      },

      error: err => {

        this.procesando = false;
        this.mostrarError(err);
      }
    });
  }

  // ======================================
  // MANEJO DE ERRORES
  // ======================================

  mostrarError(err: any): void {

    this.mensaje = '';

    switch (err.status) {

      case 400:
        this.error =
          'Datos inválidos. Revisa la información ingresada.';
        break;

      case 401:
        this.error =
          'La sesión expiró. Inicia sesión nuevamente.';
        break;

      case 403:
        this.error =
          'No tienes permisos de coordinador PPP.';
        break;

      case 404:
        this.error =
          'No se encontró el registro solicitado.';
        break;

      case 409:
        this.error =
          'Existe un conflicto con el registro o la asignación.';
        break;

      default:
        this.error =
          'No se pudo completar la operación.';
    }
  }

  // ======================================
  // REGRESAR AL PANEL
  // ======================================

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
