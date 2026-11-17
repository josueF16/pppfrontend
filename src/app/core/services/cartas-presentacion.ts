
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SolicitudPpp } from './solicitudes';

export interface CartaPresentacionPpp {
  idCarta: number;
  idSolicitud: number;
  contenido: string | null;
  estado: 'BORRADOR' | 'ENVIADA' | 'CANCELADA';
  fechaCreacion: string;
  fechaEnvio: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartasPresentacionService {

  private http = inject(HttpClient);
  private api = '/api/v1/cartas';

  solicitudesAprobadas() {
    return this.http.get<SolicitudPpp[]>(
      `${this.api}/solicitudes-aprobadas`
    );
  }

  crear(idSolicitud: number, modelo: string) {
    return this.http.post<CartaPresentacionPpp>(
      `${this.api}/solicitud/${idSolicitud}`,
      { modelo }
    );
  }

  obtener(idCarta: number) {
    return this.http.get<CartaPresentacionPpp>(
      `${this.api}/${idCarta}`
    );
  }

  guardar(idCarta: number, contenido: string) {
    return this.http.put<CartaPresentacionPpp>(
      `${this.api}/${idCarta}`,
      { contenido }
    );
  }

  enviar(idCarta: number) {
    return this.http.post<CartaPresentacionPpp>(
      `${this.api}/${idCarta}/enviar`,
      {}
    );
  }

  cancelar(idCarta: number) {
    return this.http.post<CartaPresentacionPpp>(
      `${this.api}/${idCarta}/cancelar`,
      {}
    );
  }
}
