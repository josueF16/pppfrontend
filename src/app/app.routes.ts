
import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AuthService } from './core/services/auth';
import { Login } from './features/auth/login/login';
import { Inicio } from './features/inicio/inicio';
import { Requisitos } from './features/requisitos/requisitos';
import { Empresas } from './features/empresas/empresas';
import { SolicitudesEstudiante } from './features/solicitudes-estudiante/solicitudes-estudiante';
import { SolicitudesCoordinador } from './features/solicitudes-coordinador/solicitudes-coordinador';
import { DocumentosDrive } from './features/documentos-drive/documentos-drive';
import { CartasPresentacion } from './features/cartas-presentacion/cartas-presentacion';
import { RegistroCartas } from './features/registro-cartas/registro-cartas';
import { Supervisores } from './features/supervisores/supervisores';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'inicio',
    component: Inicio,
    canActivate: [() => {
      const auth = inject(AuthService);
      const router = inject(Router);

      return auth.estaAutenticado()
        ? true
        : router.parseUrl('/login');
    }]
  },
  {
  path: 'requisitos',
  component: Requisitos,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.estaAutenticado()
      ? true
      : router.parseUrl('/login');
  }]
  },
  {
  path: 'empresas',
  component: Empresas,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.estaAutenticado()
      && auth.obtenerUsuario()?.rol === 'ESTUDIANTE'
      ? true
      : router.parseUrl('/inicio');
  }]
  },

{
  path: 'solicitudes',
  component: SolicitudesEstudiante,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.estaAutenticado()
      && auth.obtenerUsuario()?.rol === 'ESTUDIANTE'
      ? true
      : router.parseUrl('/inicio');
  }]
},

{
  path: 'validar-solicitudes',
  component: SolicitudesCoordinador,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.parseUrl('/login');
    }

    return auth.obtenerUsuario()?.rol === 'COORDINADOR_PPP'
      ? true
      : router.parseUrl('/inicio');
  }]
},

{
  path: 'cartas-presentacion',
  component: CartasPresentacion,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.parseUrl('/login');
    }

    return auth.obtenerUsuario()?.rol === 'SECRETARIA'
      ? true
      : router.parseUrl('/inicio');
  }]
},



{
  path: 'documentos-drive',
  component: DocumentosDrive,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.parseUrl('/login');
    }

    return auth.obtenerUsuario()?.rol === 'COORDINADOR_PPP'
      ? true
      : router.parseUrl('/inicio');
  }]
},

{
  path: 'registro-cartas',
  component: RegistroCartas,
  canActivate: [() => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.parseUrl('/login');
    }

    return auth.obtenerUsuario()?.rol === 'ESTUDIANTE'
      ? true
      : router.parseUrl('/inicio');
  }]
},


{
  path: 'supervisores',
  component: Supervisores,
  canActivate: [() => {

    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.parseUrl('/login');
    }

    return auth.obtenerUsuario()?.rol === 'COORDINADOR_PPP'
      ? true
      : router.parseUrl('/inicio');
  }]
},



  {
    path: '**',
    redirectTo: 'login'
  }
];
