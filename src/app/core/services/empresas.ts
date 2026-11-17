
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface EmpresaPpp {
  idEmpresa: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  contacto: string;
  reglamento: string;
  recomendada: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {

  private http = inject(HttpClient);
  private api = '/api/v1/empresas';

  listar() {
    return this.http.get<EmpresaPpp[]>(this.api);
  }

  recomendadas() {
    return this.http.get<EmpresaPpp[]>(
      `${this.api}/recomendadas`
    );
  }

  archivadas() {
    return this.http.get<EmpresaPpp[]>(
      `${this.api}/archivadas`
    );
  }

  obtener(id: number) {
    return this.http.get<EmpresaPpp>(
      `${this.api}/${id}`
    );
  }

  archivar(id: number) {
    return this.http.post<void>(
      `${this.api}/${id}/archivar`, {}
    );
  }

  desarchivar(id: number) {
    return this.http.delete<void>(
      `${this.api}/${id}/archivar`
    );
  }
}
