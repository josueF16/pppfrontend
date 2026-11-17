
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RequisitoPpp {
  idRequisito: number;
  nombre: string;
  descripcion: string;
  estado: 'CUMPLE' | 'PENDIENTE';
}

@Injectable({
  providedIn: 'root'
})
export class RequisitosService {

  private http = inject(HttpClient);

  listarPorEstudiante(idUsuario: number) {
    return this.http.get<RequisitoPpp[]>(
      `/api/v1/requisitos/estudiante/${idUsuario}`
    );
  }
}
