
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ==========================================
// CU08 - DATOS DE SUPERVISORES
// ==========================================

export interface SupervisorPpp {
  idSupervisor: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  tipo: 'ACADEMICO' | 'EMPRESARIAL';
  estado: string;
}

// ==========================================
// RF78 - REGISTRAR SUPERVISOR
// ==========================================

export interface NuevoSupervisor {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tipo: 'ACADEMICO' | 'EMPRESARIAL';
}

// ==========================================
// RF79 - ASIGNACION DE SUPERVISORES
// ==========================================

export interface AsignacionSupervisor {
  idAsignacion: number;
  idSolicitud: number;
  idSupervisorAcademico: number | null;
  idSupervisorEmpresarial: number | null;
  fechaAsignacion: string;
}

export interface AsignacionRequest {
  idSolicitud: number;
  idSupervisorAcademico: number | null;
  idSupervisorEmpresarial: number | null;
}

// ==========================================
// SERVICIO HTTP DE SUPERVISORES
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class SupervisoresService {

  private http = inject(HttpClient);

  private readonly api = '/api/v1/supervisores';

  // RF75 - LISTAR SUPERVISORES

  listar() {
    return this.http.get<SupervisorPpp[]>(
      this.api
    );
  }

  // RF76 - CONSULTAR UN SUPERVISOR

  obtener(id: number) {
    return this.http.get<SupervisorPpp>(
      `${this.api}/${id}`
    );
  }

  // RF78 - REGISTRAR SUPERVISOR

  registrar(datos: NuevoSupervisor) {
    return this.http.post<SupervisorPpp>(
      this.api,
      datos
    );
  }

  // RF79 - ASIGNAR SUPERVISORES

  asignar(datos: AsignacionRequest) {
    return this.http.put<AsignacionSupervisor>(
      `${this.api}/asignaciones`,
      datos
    );
  }

  // CONSULTAR ASIGNACION EXISTENTE

  consultarAsignacion(idSolicitud: number) {
    return this.http.get<AsignacionSupervisor>(
      `${this.api}/asignaciones/solicitud/${idSolicitud}`
    );
  }
}
