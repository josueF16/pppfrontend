
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  EmpresasService,
  EmpresaPpp
} from '../../core/services/empresas';

import {
  SolicitudesService,
  SolicitudPpp
} from '../../core/services/solicitudes';

@Component({
  selector: 'app-solicitudes-estudiante',
  imports: [FormsModule],
  templateUrl: './solicitudes-estudiante.html',
  styleUrl: './solicitudes-estudiante.css'
})
export class SolicitudesEstudiante implements OnInit {

  private empresasService = inject(EmpresasService);
  private solicitudesService = inject(SolicitudesService);
  private router = inject(Router);

  empresas: EmpresaPpp[] = [];
  solicitudes: SolicitudPpp[] = [];

  idEmpresa: number | null = null;

  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarEmpresas();
    this.cargarSolicitudes();
  }

  cargarEmpresas(): void {
    this.empresasService.listar().subscribe({
      next: datos => this.empresas = datos,
      error: () => {
        this.error = 'No se pudieron cargar las empresas.';
      }
    });
  }

  cargarSolicitudes(): void {
    this.cargando = true;

    this.solicitudesService.misSolicitudes().subscribe({
      next: datos => {
        this.solicitudes = datos;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudieron cargar las solicitudes.';
      }
    });
  }

  registrar(): void {
    if (this.idEmpresa === null || this.guardando) {
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardando = true;

    this.solicitudesService.registrar(this.idEmpresa)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.idEmpresa = null;
          this.mensaje = 'Solicitud registrada correctamente.';
          this.cargarSolicitudes();
        },
        error: err => {
          this.guardando = false;
          this.error = err.status === 401
            ? 'La sesión expiró. Inicia sesión nuevamente.'
            : 'No se pudo registrar la solicitud.';
        }
      });
  }

  nombreEmpresa(id: number): string {
    return this.empresas.find(
      e => e.idEmpresa === id
    )?.nombre ?? `Empresa ${id}`;
  }

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
