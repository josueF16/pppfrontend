import {ApplicationConfig,provideBrowserGlobalErrorListeners,provideZoneChangeDetection} from '@angular/core';

import { provideRouter } from '@angular/router';
import {provideHttpClient,withInterceptors} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { inject, provideAppInitializer } from '@angular/core';
import { TemaService } from './core/services/tema';

export const appConfig: ApplicationConfig = {
  providers: [

provideAppInitializer(() =>
  inject(TemaService).inicializar()
),

    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({
      eventCoalescing: true
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
