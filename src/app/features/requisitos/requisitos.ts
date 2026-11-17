
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import {
  RequisitosService,
  RequisitoPpp
} from '../../core/services/requisitos';

@Component({
  selector: 'app-requisitos',
  imports: [],
  templateUrl: './requisitos.html',
  styleUrl: './requisitos.css'
})
export class Requisitos implements OnInit {

  private auth = inject(AuthService);
  private service = inject(RequisitosService);
  private router = inject(Router);

  requisitos: RequisitoPpp[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    const usuario = this.auth.obtenerUsuario();

    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.service.listarPorEstudiante(usuario.idUsuario)
      .subscribe({
        next: (datos) => {
          this.requisitos = datos;
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          this.error = err.status === 401
            ? 'Tu sesión expiró. Inicia sesión nuevamente.'
            : 'No se pudieron cargar los requisitos.';
        }
      });
  }

  volver(): void {
    this.router.navigateByUrl('/inicio');
  }
}
