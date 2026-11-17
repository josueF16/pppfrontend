
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  // ======================================
  // CONTROL GLOBAL DE AUTENTICACIÓN
  // ======================================

  // Inicializa AuthService desde la raíz.
  // Su temporizador permanece funcionando
  // mientras el usuario cambia de módulo.
  readonly auth = inject(AuthService);

}
