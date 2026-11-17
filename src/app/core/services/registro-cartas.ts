
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ==========================================
// CU09 - CARTAS DE PRESENTACION RECIBIDAS
// ==========================================

export interface CartaRecibida {
  idCarta: number;
  idSolicitud: number;
  contenido: string;
  estado: string;
  fechaCreacion: string;
  fechaEnvio: string | null;
}

// ==========================================
// CU010 Y CU011 - DOCUMENTOS REGISTRADOS
// ==========================================

export interface DocumentoCarta {
  idDocumento: number;
  idSolicitud: number;
  tipoDocumento: string;
  nombreArchivo: string;
  driveFileId: string;
  urlDocumento: string;
  fechaRegistro: string;
}

// ==========================================
// CU011 - CONVENIO PPP
// ==========================================

export interface ConvenioPpp {
  idConvenio: number;
  idSolicitud: number;
  cargo: string;
  horario: string | null;
  pago: string | null;
  fechaInicio: string;
  fechaFin: string;
}

export interface ConvenioRequest {
  cargo: string;
  horario: string;
  pago: string;
  fechaInicio: string;
  fechaFin: string;
}

// ==========================================
// SERVICIO DE REGISTRO DE CARTAS
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class RegistroCartasService {

  private http = inject(HttpClient);

  // ==========================================
  // CU09 - CONSULTAR CARTAS RECIBIDAS
  // ==========================================

  cartasRecibidas() {

    return this.http.get<CartaRecibida[]>(
      '/api/v1/cartas/recibidas'
    );
  }

  // ==========================================
  // CU010 / CU011 - CONSULTAR DOCUMENTOS
  // ==========================================

  listarDocumentos(idSolicitud: number) {

    return this.http.get<DocumentoCarta[]>(
      `/api/v1/documentos-cartas/solicitud/${idSolicitud}`
    );
  }

  // ==========================================
  // REGISTRAR DOCUMENTO MEDIANTE ENLACE
  // ==========================================

  registrarDocumento(
    idSolicitud: number,
    tipoDocumento: 'ACEPTACION' | 'CONVENIO',
    nombreArchivo: string,
    driveFileId: string
  ) {

    return this.http.post<DocumentoCarta>(
      `/api/v1/documentos-cartas/solicitud/${idSolicitud}`,
      {
        tipoDocumento,
        nombreArchivo,
        driveFileId,
        urlDocumento:
          `https://drive.google.com/file/d/${driveFileId}/view`
      }
    );
  }

  // ==========================================
  // CU010 / CU011 - SUBIR PDF A GOOGLE DRIVE
  // ==========================================

  subirDocumentoPdf(
    idSolicitud: number,
    tipoDocumento: 'ACEPTACION' | 'CONVENIO',
    archivo: File
  ) {

    const formulario = new FormData();

    formulario.append(
      'tipoDocumento',
      tipoDocumento
    );

    formulario.append(
      'archivo',
      archivo,
      archivo.name
    );

    // El navegador configura automaticamente
    // Content-Type y el boundary de FormData.
    return this.http.post<DocumentoCarta>(
      `/api/v1/google/drive/solicitud/${idSolicitud}/subir`,
      formulario
    );
  }

  // ==========================================
  // CU010 - DESCARGAR CARTA DE ACEPTACION
  // DESDE EL BACKEND PROTEGIDO CON JWT
  // ==========================================

  descargarCartaAceptacion(idDocumento: number) {

    return this.http.get(
      `/api/v1/google/drive/documentos/${idDocumento}/pdf`,
      {
        responseType: 'blob'
      }
    );
  }

  // ==========================================
  // CU011 - CONSULTAR CONVENIO
  // ==========================================

  obtenerConvenio(idSolicitud: number) {

    return this.http.get<ConvenioPpp>(
      `/api/v1/convenios/solicitud/${idSolicitud}`
    );
  }

  // ==========================================
  // CU011 - REGISTRAR DATOS DEL CONVENIO
  // ==========================================

  registrarConvenio(
    idSolicitud: number,
    datos: ConvenioRequest
  ) {

    return this.http.post<ConvenioPpp>(
      `/api/v1/convenios/solicitud/${idSolicitud}`,
      datos
    );
  }
}
