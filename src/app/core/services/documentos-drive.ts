
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DocumentoDrivePpp {
  idSolicitud: number;
  driveFileId: string;
  urlDocumento: string;
  urlVistaPrevia: string;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosDriveService {

  private http = inject(HttpClient);
  private api = '/api/v1/documentos-drive';

  obtener(idSolicitud: number) {
    return this.http.get<DocumentoDrivePpp>(
      `${this.api}/solicitud/${idSolicitud}`
    );
  }

  guardar(idSolicitud: number, driveFileId: string) {
    return this.http.post<DocumentoDrivePpp>(
      `${this.api}/solicitud/${idSolicitud}`,
      {
        driveFileId,
        urlDocumento:
          `https://drive.google.com/file/d/${driveFileId}/view`,
        urlVistaPrevia:
          `https://drive.google.com/file/d/${driveFileId}/preview`
      }
    );
  }

  vistaPrevia(idSolicitud: number) {
    return this.http.get<{ urlVistaPrevia: string }>(
      `${this.api}/solicitud/${idSolicitud}/vista-previa`
    );
  }
}
