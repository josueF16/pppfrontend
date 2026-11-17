
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private auth = inject(AuthService);
  private router = inject(Router);

  correo = '';
  clave = '';
  error = '';
  cargando = false;

  ingresar(): void {
    this.error = '';
    this.cargando = true;

    this.auth.login(this.correo.trim(), this.clave)
      .subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigateByUrl('/inicio');
        },
        error: (err) => {
          this.cargando = false;

          if (err.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
          } else if (err.status === 0) {
            this.error = 'No se pudo conectar con el backend.';
          } else {
            this.error = 'Ocurrió un error al iniciar sesión.';
          }
        }
      });
  }
}
