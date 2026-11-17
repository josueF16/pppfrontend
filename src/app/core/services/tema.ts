
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  modoOscuro = signal(false);

  inicializar(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const temaGuardado = localStorage.getItem('ppp-tema');

    this.modoOscuro.set(temaGuardado === 'oscuro');
    this.aplicarTema();
  }

  alternar(): void {
    this.modoOscuro.update(actual => !actual);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        'ppp-tema',
        this.modoOscuro() ? 'oscuro' : 'claro'
      );

      this.aplicarTema();
    }
  }

  private aplicarTema(): void {
    this.document.documentElement.classList.toggle(
      'tema-oscuro',
      this.modoOscuro()
    );
  }
}
