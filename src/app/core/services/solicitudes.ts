
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SolicitudPpp {
  idSolicitud: number;
  idUsuario: number;
  idEmpresa: number;
  fechaSolicitud: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  comentario: string | null;
  fechaRevision: string | null;
}

export interface DetalleSolicitudPpp {
  idSolicitud: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  empresa: string;
  estado: string;
  comentario: string | null;
  fechaSolicitud: string;
  fechaRevision: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {


detalle(idSolicitud: number) {
  return this.http.get<DetalleSolicitudPpp>(
    `${this.api}/${idSolicitud}`
  );
}


  private http = inject(HttpClient);
  private api = '/api/v1/solicitudes';

  registrar(idEmpresa: number) {
    return this.http.post<SolicitudPpp>(
      this.api,
      { idEmpresa }
    );
  }

  misSolicitudes() {
    return this.http.get<SolicitudPpp[]>(
      `${this.api}/mias`
    );
  }

  listar() {
    return this.http.get<SolicitudPpp[]>(this.api);
  }

  validar(
    idSolicitud: number,
    estado: 'APROBADA' | 'RECHAZADA',
    comentario: string
  ) {
    return this.http.patch<SolicitudPpp>(
      `${this.api}/${idSolicitud}/validar`,
      { estado, comentario }
    );
  }
}
