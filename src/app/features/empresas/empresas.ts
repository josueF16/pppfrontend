
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  EmpresasService,
  EmpresaPpp
} from '../../core/services/empresas';

type Vista = 'todas' | 'recomendadas' | 'archivadas';

@Component({
  selector: 'app-empresas',
  imports: [],
  templateUrl: './empresas.html',
  styleUrl: './empresas.css'
})
export class Empresas implements OnInit {

  private service = inject(EmpresasService);
  private router = inject(Router);

  empresas: EmpresaPpp[] = [];
  detalle: EmpresaPpp | null = null;

  vista: Vista = 'todas';
  cargando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargar('todas');
  }

  cargar(vista: Vista): void {
    this.vista = vista;
    this.cargando = true;
    this.error = '';
    this.mensaje = '';
    this.detalle = null;

    const peticion =
      vista === 'recomendadas'
        ? this.service.recomendadas()
        : vista === 'archivadas'
          ? this.service.archivadas()
          : this.service.listar();

    peticion.subscribe({
      next: datos => {
        this.empresas = datos;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.status === 401
          ? 'Tu sesión expiró. Inicia sesión nuevamente.'
          : 'No se pudieron consultar las empresas.';
      }
    });
  }

  verDetalles(id: number): void {
    this.error = '';

    this.service.obtener(id).subscribe({
      next: empresa => {
        this.detalle = empresa;
      },
      error: () => {
        this.error = 'No se pudo consultar la empresa.';
      }
    });
  }

  archivar(id: number): void {
    this.error = '';

    this.service.archivar(id).subscribe({
      next: () => {
        this.cargar(this.vista);
      },
      error: () => {
        this.error = 'No se pudo archivar la empresa.';
      }
    });
  }

  desarchivar(id: number): void {
    this.error = '';

    this.service.desarchivar(id).subscribe({
      next: () => {
        this.cargar(this.vista);
      },
      error: () => {
        this.error = 'No se pudo quitar la empresa.';
      }
    });
  }

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
