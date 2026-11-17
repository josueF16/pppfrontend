import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import {
  SolicitudesService,
  SolicitudPpp
} from '../../core/services/solicitudes';

import {
  RegistroCartasService,
  CartaRecibida,
  DocumentoCarta,
  ConvenioPpp,
  ConvenioRequest
} from '../../core/services/registro-cartas';

@Component({
  selector: 'app-registro-cartas',
  imports: [FormsModule],
  templateUrl: './registro-cartas.html',
  styleUrl: './registro-cartas.css'
})
export class RegistroCartas implements OnInit, OnDestroy {

  private solicitudesService = inject(SolicitudesService);
  private service = inject(RegistroCartasService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('archivoPdfInput')
  private archivoPdfInput?: ElementRef<HTMLInputElement>;

  // ==========================================
  // DATOS DE SOLICITUDES Y CARTAS
  // ==========================================

  solicitudes: SolicitudPpp[] = [];
  cartas: CartaRecibida[] = [];
  documentos: DocumentoCarta[] = [];

  convenio: ConvenioPpp | null = null;

  idSolicitud: number | null = null;

  // ==========================================
  // VISTA PREVIA DE DOCUMENTOS GOOGLE DRIVE
  // ==========================================

  documentoEnVista: number | null = null;
  urlVistaPrevia: SafeResourceUrl | null = null;

  // CU010: la aceptación se consulta con JWT, sin publicar el archivo.
  vistaPreviaCargando = false;

  private urlBlobVistaPrevia: string | null = null;
  private versionVistaPrevia = 0;
  private peticionVistaPrevia: Subscription | null = null;

  // ==========================================
  // DATOS PARA REGISTRAR DOCUMENTOS
  // ==========================================

  tipoDocumento: 'ACEPTACION' | 'CONVENIO' = 'ACEPTACION';

  nombreArchivo = '';

  // Permite pegar un ID o enlace completo de Drive.
  driveFileId = '';

  // ==========================================
  // ARCHIVO PDF SELECCIONADO
  // ==========================================

  archivoPdf: File | null = null;

  private readonly MAX_PDF_BYTES = 5 * 1024 * 1024;

  // ==========================================
  // DATOS DEL CONVENIO PPP
  // ==========================================

  datosConvenio: ConvenioRequest = {
    cargo: '',
    horario: '',
    pago: '',
    fechaInicio: '',
    fechaFin: ''
  };

  // ==========================================
  // ESTADOS DE CARGA
  // ==========================================

  cargando = false;
  cargandoDocumentos = false;
  procesando = false;

  // CU09 - Control de descarga de cartas.
  descargandoCartaId: number | null = null;

  // CU010 - Control de descarga de aceptacion.
  descargandoDocumentoId: number | null = null;

  // ==========================================
  // MENSAJES DEL SISTEMA
  // ==========================================

  error = '';
  mensaje = '';

  // ==========================================
  // INICIALIZACION
  // ==========================================

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarCartas();
  }

  ngOnDestroy(): void {
    // Cancelar peticiones y liberar URL temporal al salir de la pantalla.
    this.cerrarVistaPrevia();
  }

  // ==========================================
  // CONSULTAR SOLICITUDES APROBADAS
  // ==========================================

  cargarSolicitudes(): void {

    this.cargando = true;

    this.solicitudesService.misSolicitudes().subscribe({

      next: datos => {

        this.solicitudes = datos.filter(
          s => s.estado === 'APROBADA'
        );

        this.cargando = false;
      },

      error: err => {

        this.cargando = false;
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // CU09 - CONSULTAR CARTAS RECIBIDAS
  // ==========================================

  cargarCartas(): void {

    this.service.cartasRecibidas().subscribe({

      next: datos => {

        // Mostrar solo cartas enviadas.
        // El backend debe comprobar el propietario.
        this.cartas = datos.filter(
          carta => carta.estado === 'ENVIADA'
        );
      },

      error: err => {
        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // CU09 - DESCARGAR CARTA DE PRESENTACION
  // ==========================================

  async descargarCarta(carta: CartaRecibida): Promise<void> {

    // Evitar descargas simultaneas.
    if (this.descargandoCartaId !== null) {
      return;
    }

    // Solo permitir cartas enviadas con contenido.
    if (
      carta.estado !== 'ENVIADA' ||
      !carta.contenido?.trim()
    ) {

      this.error =
        'Solo se pueden descargar cartas enviadas con contenido.';

      this.mensaje = '';
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.descargandoCartaId = carta.idCarta;

    try {

      // Cargar jsPDF solo cuando sea necesario.
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // ======================================
      // DIMENSIONES DEL DOCUMENTO
      // ======================================

      const anchoPagina = pdf.internal.pageSize.getWidth();
      const altoPagina = pdf.internal.pageSize.getHeight();

      const margen = 20;
      const anchoTexto = anchoPagina - (margen * 2);

      let posicionY = 20;

      // ======================================
      // ENCABEZADO DEL PDF
      // ======================================

      pdf.setTextColor(0, 51, 102);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);

      pdf.text(
        'SISTEMA DE GESTION PPP',
        anchoPagina / 2,
        posicionY,
        { align: 'center' }
      );

      posicionY += 9;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      pdf.text(
        'Universidad Peruana Union',
        anchoPagina / 2,
        posicionY,
        { align: 'center' }
      );

      posicionY += 9;

      // ======================================
      // ADVERTENCIA DE DOCUMENTO DE PRUEBA
      // ======================================

      pdf.setTextColor(160, 48, 48);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);

      pdf.text(
        'COPIA DE PRUEBA - SIN VALIDEZ OFICIAL',
        anchoPagina / 2,
        posicionY,
        { align: 'center' }
      );

      posicionY += 7;

      // Linea de separacion.
      pdf.setDrawColor(190, 205, 220);

      pdf.line(
        margen,
        posicionY,
        anchoPagina - margen,
        posicionY
      );

      posicionY += 10;

      // ======================================
      // INFORMACION DE LA CARTA
      // ======================================

      pdf.setTextColor(30, 45, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);

      pdf.text(
        `Carta N. ${carta.idCarta}`,
        margen,
        posicionY
      );

      posicionY += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      pdf.text(
        `Solicitud N. ${carta.idSolicitud}`,
        margen,
        posicionY
      );

      posicionY += 6;

      pdf.text(
        `Estado: ${carta.estado}`,
        margen,
        posicionY
      );

      posicionY += 6;

      pdf.text(
        `Fecha de envio: ${carta.fechaEnvio ?? 'No registrada'}`,
        margen,
        posicionY
      );

      posicionY += 12;

      // ======================================
      // CONTENIDO ORIGINAL DE LA CARTA
      // ======================================

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(25, 40, 60);

      const alturaLinea = 6;

      // Respetar los saltos de linea.
      const parrafos = carta.contenido.split(/\r?\n/);

      for (const parrafo of parrafos) {

        const lineas: string[] = parrafo.trim()
          ? pdf.splitTextToSize(parrafo, anchoTexto)
          : [''];

        for (const linea of lineas) {

          // Crear otra pagina cuando sea necesario.
          if (posicionY + alturaLinea > altoPagina - margen) {

            pdf.addPage();
            posicionY = margen;
          }

          if (linea) {

            pdf.text(
              linea,
              margen,
              posicionY
            );
          }

          posicionY += alturaLinea;
        }
      }

      // ======================================
      // GUARDAR ARCHIVO
      // ======================================

      const nombrePDF =
        `carta_presentacion_${carta.idCarta}_prueba.pdf`;

      pdf.save(nombrePDF);

      this.mensaje =
        `Se generó la descarga de la carta N.º ${carta.idCarta}.`;

    } catch (err) {

      console.error(
        'Error al generar el PDF de prueba.',
        err
      );

      this.error =
        'No se pudo generar el PDF. Verifica que jsPDF esté instalado.';

    } finally {

      this.descargandoCartaId = null;
    }
  }

  // ==========================================
  // SELECCIONAR SOLICITUD
  // ==========================================

  seleccionarSolicitud(): void {

    this.documentos = [];
    this.convenio = null;

    // Cerrar cualquier vista previa anterior.
    this.cerrarVistaPrevia();

    // Limpiar el PDF seleccionado anteriormente.
    this.limpiarPdfSeleccionado();

    this.error = '';
    this.mensaje = '';

    this.nombreArchivo = '';
    this.driveFileId = '';

    this.cargandoDocumentos = false;

    if (this.idSolicitud === null) {
      return;
    }

    this.cargarDocumentos();
    this.cargarConvenio();
  }

  // ==========================================
  // CONSULTAR DOCUMENTOS REGISTRADOS
  // ==========================================

  cargarDocumentos(): void {

    if (this.idSolicitud === null) {
      return;
    }

    const solicitudActual = this.idSolicitud;

    this.cargandoDocumentos = true;

    this.service.listarDocumentos(solicitudActual)
      .subscribe({

        next: datos => {

          if (this.idSolicitud !== solicitudActual) {
            return;
          }

          this.documentos = datos;
          this.cargandoDocumentos = false;

          // Si desaparecio el documento abierto,
          // cerrar su vista previa.
          if (
            this.documentoEnVista !== null &&
            !datos.some(
              doc => doc.idDocumento === this.documentoEnVista
            )
          ) {
            this.cerrarVistaPrevia();
          }
        },

        error: err => {

          if (this.idSolicitud !== solicitudActual) {
            return;
          }

          this.cargandoDocumentos = false;
          this.cerrarVistaPrevia();
          this.mostrarError(err);
        }
      });
  }

  // ==========================================
  // CU010 - VISTA PREVIA AUTENTICADA
  // ==========================================

  mostrarVistaPrevia(doc: DocumentoCarta): void {

    // Impedir abrir un documento de otra solicitud desde la interfaz.
    // El backend tambien verifica el propietario mediante el JWT.
    if (
      this.idSolicitud === null ||
      doc.idSolicitud !== this.idSolicitud
    ) {
      this.cerrarVistaPrevia();
      this.error =
        'El documento no pertenece a la solicitud seleccionada.';
      this.mensaje = '';
      return;
    }

    // Si el mismo documento esta abierto (o cargando), cerrarlo.
    if (this.documentoEnVista === doc.idDocumento) {
      this.cerrarVistaPrevia();
      return;
    }

    // Cancelar una vista anterior para evitar mostrar respuestas antiguas.
    this.cerrarVistaPrevia();
    this.error = '';
    this.mensaje = '';

    // Cartas de aceptacion: recuperar el PDF desde el backend con JWT.
    if (doc.tipoDocumento === 'ACEPTACION') {

      const solicitudActual = this.idSolicitud;
      const versionActual = this.versionVistaPrevia;

      this.documentoEnVista = doc.idDocumento;
      this.vistaPreviaCargando = true;

      this.peticionVistaPrevia = this.service
        .descargarCartaAceptacion(doc.idDocumento)
        .subscribe({

          next: archivo => {
            if (
              this.versionVistaPrevia !== versionActual ||
              this.idSolicitud !== solicitudActual ||
              this.documentoEnVista !== doc.idDocumento
            ) {
              return;
            }

            this.vistaPreviaCargando = false;
            this.peticionVistaPrevia = null;

            // El endpoint Java responde application/pdf con un PDF validado.
            if (
              archivo.size === 0 ||
              (archivo.type !== '' &&
                !archivo.type.toLowerCase().startsWith('application/pdf'))
            ) {
              this.cerrarVistaPrevia();
              this.error = 'No se recibió un PDF válido para visualizar.';
              return;
            }

            // URL de un blob local: no requiere acceso público a Drive.
            const blobPdf = new Blob([archivo], {
              type: 'application/pdf'
            });
            const urlTemporal = URL.createObjectURL(blobPdf);

            this.urlBlobVistaPrevia = urlTemporal;
            this.urlVistaPrevia =
              this.sanitizer.bypassSecurityTrustResourceUrl(urlTemporal);
          },

          error: err => {
            if (
              this.versionVistaPrevia !== versionActual ||
              this.idSolicitud !== solicitudActual ||
              this.documentoEnVista !== doc.idDocumento
            ) {
              return;
            }

            this.cerrarVistaPrevia();
            this.mostrarError(err);
          }
        });

      return;
    }

    // Otros documentos: mantener el visor de Google Drive existente.
    const id = (doc.driveFileId ?? '').trim();
    const formatoId = /^[A-Za-z0-9_-]{10,200}$/;

    if (!formatoId.test(id)) {
      this.error =
        'El documento tiene un ID de Google Drive inválido.';
      return;
    }

    const url = `https://drive.google.com/file/d/${id}/preview`;

    this.urlVistaPrevia =
      this.sanitizer.bypassSecurityTrustResourceUrl(url);

    this.documentoEnVista = doc.idDocumento;
  }

  // ==========================================
  // CERRAR VISTA PREVIA Y LIBERAR RECURSOS
  // ==========================================

  cerrarVistaPrevia(): void {
    // Invalidar respuestas antiguas aunque ya esten en camino.
    this.versionVistaPrevia++;

    // Angular HttpClient permite cancelar la solicitud al desuscribirse.
    this.peticionVistaPrevia?.unsubscribe();
    this.peticionVistaPrevia = null;

    this.documentoEnVista = null;
    this.urlVistaPrevia = null;
    this.vistaPreviaCargando = false;

    if (this.urlBlobVistaPrevia !== null) {
      URL.revokeObjectURL(this.urlBlobVistaPrevia);
      this.urlBlobVistaPrevia = null;
    }
  }

  // ==========================================
  // CONSULTAR CONVENIO
  // ==========================================

  cargarConvenio(): void {

    if (this.idSolicitud === null) {
      return;
    }

    const solicitudActual = this.idSolicitud;

    this.service.obtenerConvenio(solicitudActual)
      .subscribe({

        next: datos => {

          if (this.idSolicitud !== solicitudActual) {
            return;
          }

          this.convenio = datos;
        },

        error: err => {

          if (this.idSolicitud !== solicitudActual) {
            return;
          }

          if (err.status !== 404) {
            this.mostrarError(err);
          }
        }
      });
  }

  // ==========================================
  // EXTRAER ID DE GOOGLE DRIVE
  // ==========================================

  extraerIdDrive(valor: string): string | null {

    const texto = valor.trim();

    const formatoId = /^[A-Za-z0-9_-]{10,200}$/;

    // Aceptar un ID ingresado manualmente.
    if (formatoId.test(texto)) {
      return texto;
    }

    try {

      const url = new URL(texto);
      const host = url.hostname.toLowerCase();

      // Aceptar solo Drive y Docs por HTTPS.
      if (
        url.protocol !== 'https:' ||
        ![
          'drive.google.com',
          'docs.google.com'
        ].includes(host)
      ) {
        return null;
      }

      // drive.google.com/file/d/ID/view
      // docs.google.com/document/d/ID/edit
      const coincidencia = url.pathname.match(
        /\/d\/([A-Za-z0-9_-]{10,200})(?:\/|$)/
      );

      if (coincidencia) {
        return coincidencia[1];
      }

      // drive.google.com/open?id=ID
      if (
        host === 'drive.google.com' &&
        ['/open', '/uc'].includes(url.pathname)
      ) {

        const id = url.searchParams.get('id');

        if (id && formatoId.test(id)) {
          return id;
        }
      }

      return null;

    } catch {
      return null;
    }
  }

  // ==========================================
  // SELECCIONAR PDF DESDE WINDOWS
  // ==========================================

  seleccionarPdf(evento: Event): void {

    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    this.archivoPdf = null;

    this.error = '';
    this.mensaje = '';

    if (!archivo) {
      return;
    }

    // Validar extension y tipo MIME.
    const extensionValida =
      archivo.name.toLowerCase().endsWith('.pdf');

    const tipoValido =
      archivo.type === '' ||
      archivo.type === 'application/pdf';

    if (!extensionValida || !tipoValido) {

      this.error =
        'Selecciona un archivo PDF válido.';

      input.value = '';
      return;
    }

    // Validar tamaño maximo de 5 MB.
    if (
      archivo.size <= 0 ||
      archivo.size > this.MAX_PDF_BYTES
    ) {

      this.error =
        'El archivo PDF debe tener contenido y no superar 5 MB.';

      input.value = '';
      return;
    }

    // Archivo validado inicialmente en Angular.
    // El backend realizara su propia validacion.
    this.archivoPdf = archivo;
  }

  // ==========================================
  // LIMPIAR EL PDF SELECCIONADO
  // ==========================================

  limpiarPdfSeleccionado(): void {

    this.archivoPdf = null;

    if (this.archivoPdfInput) {
      this.archivoPdfInput.nativeElement.value = '';
    }
  }

  // ==========================================
  // SUBIR PDF DIRECTAMENTE A GOOGLE DRIVE
  // ==========================================

  subirPdfGoogleDrive(): void {

    if (
      this.idSolicitud === null ||
      this.procesando
    ) {
      return;
    }

    const archivo = this.archivoPdf;

    if (!archivo) {

      this.error =
        'Primero selecciona un archivo PDF.';

      this.mensaje = '';
      return;
    }

    // Evitar registros duplicados desde Angular.
    const yaExiste = this.documentos.some(
      documento =>
        documento.tipoDocumento === this.tipoDocumento
    );

    if (yaExiste) {

      this.error =
        'Ya existe un documento de este tipo para la solicitud.';

      this.mensaje = '';
      return;
    }

    const solicitudActual = this.idSolicitud;

    this.error = '';
    this.mensaje = '';
    this.procesando = true;

    this.service.subirDocumentoPdf(
      solicitudActual,
      this.tipoDocumento,
      archivo
    ).subscribe({

      next: () => {

        this.procesando = false;

        // No alterar la vista si el estudiante
        // cambio de solicitud durante la subida.
        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        // Limpiar archivo seleccionado y formulario.
        this.limpiarPdfSeleccionado();

        this.mensaje =
          'PDF subido a Google Drive y registrado correctamente.';

        this.cargarDocumentos();
      },

      error: err => {

        this.procesando = false;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // REGISTRAR CARTA DE ACEPTACION O CONVENIO
  // MEDIANTE ENLACE DE GOOGLE DRIVE
  // ==========================================

  registrarDocumento(): void {

    if (
      this.idSolicitud === null ||
      this.procesando
    ) {
      return;
    }

    const id = this.extraerIdDrive(
      this.driveFileId
    );

    const nombre = this.nombreArchivo.trim();

    if (!nombre || nombre.length > 200) {

      this.error =
        'Ingresa un nombre de archivo válido.';

      this.mensaje = '';
      return;
    }

    if (!id) {

      this.error =
        'Pega un enlace válido de Google Drive.';

      this.mensaje = '';
      return;
    }

    const yaExiste = this.documentos.some(
      documento =>
        documento.tipoDocumento === this.tipoDocumento
    );

    if (yaExiste) {

      this.error =
        'Ya existe un documento de este tipo para la solicitud.';

      this.mensaje = '';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.procesando = true;

    const solicitudActual = this.idSolicitud;

    this.service.registrarDocumento(
      solicitudActual,
      this.tipoDocumento,
      nombre,
      id
    ).subscribe({

      next: () => {

        this.procesando = false;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.nombreArchivo = '';
        this.driveFileId = '';

        this.mensaje =
          'Documento registrado correctamente.';

        this.cargarDocumentos();
      },

      error: err => {

        this.procesando = false;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // REGISTRAR DATOS DEL CONVENIO
  // ==========================================

  registrarConvenio(): void {

    if (
      this.idSolicitud === null ||
      this.convenio ||
      this.procesando
    ) {
      return;
    }

    const datos = this.datosConvenio;

    if (
      !datos.cargo.trim() ||
      !datos.fechaInicio ||
      !datos.fechaFin
    ) {

      this.error =
        'Completa el cargo y las fechas del convenio.';

      return;
    }

    if (datos.fechaFin < datos.fechaInicio) {

      this.error =
        'La fecha final no puede ser anterior a la inicial.';

      return;
    }

    this.error = '';
    this.mensaje = '';
    this.procesando = true;

    const solicitudActual = this.idSolicitud;

    this.service.registrarConvenio(
      solicitudActual,
      datos
    ).subscribe({

      next: convenio => {

        this.procesando = false;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.convenio = convenio;

        this.mensaje =
          'Convenio registrado correctamente.';
      },

      error: err => {

        this.procesando = false;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // MANEJAR ERRORES HTTP
  // ==========================================

  mostrarError(err: any): void {

    this.error =
      err.status === 401
        ? 'La sesión expiró. Inicia sesión nuevamente.'
        : err.status === 403
        ? 'No tienes permisos para acceder a esta solicitud.'
        : err.status === 409
        ? 'Este registro ya existe o la operación no está permitida.'
        : err.status === 413
        ? 'El PDF supera el tamaño máximo permitido.'
        : err.status === 400
        ? 'El archivo o los datos enviados no son válidos.'
        : err.status === 502
        ? 'No se pudo completar la operación con Google Drive.'
        : 'No se pudo completar la operación.';

    this.mensaje = '';
  }

  // ==========================================
  // CU010 - DESCARGAR CARTA DE ACEPTACION
  // ==========================================

  descargarCartaAceptacion(doc: DocumentoCarta): void {

    // ======================================
    // 1. VERIFICAR SOLICITUD
    // ======================================

    if (
      this.idSolicitud === null ||
      doc.idSolicitud !== this.idSolicitud
    ) {

      this.error =
        'El documento no pertenece a la solicitud seleccionada.';

      this.mensaje = '';
      return;
    }

    // ======================================
    // 2. VERIFICAR TIPO DE DOCUMENTO
    // ======================================

    if (doc.tipoDocumento !== 'ACEPTACION') {

      this.error =
        'Selecciona una carta de aceptación.';

      this.mensaje = '';
      return;
    }

    // ======================================
    // 3. EVITAR DESCARGAS SIMULTANEAS
    // ======================================

    if (this.descargandoDocumentoId !== null) {
      return;
    }

    const solicitudActual = this.idSolicitud;

    this.error = '';
    this.mensaje = '';

    this.descargandoDocumentoId = doc.idDocumento;

    // ======================================
    // 4. SOLICITAR PDF AL BACKEND
    // ======================================

    this.service.descargarCartaAceptacion(
      doc.idDocumento
    ).subscribe({

      next: archivo => {

        this.descargandoDocumentoId = null;

        // ==================================
        // 5. VALIDAR ARCHIVO RECIBIDO
        // ==================================

        if (archivo.size === 0) {

          this.error =
            'El archivo descargado está vacío.';

          return;
        }

        // ==================================
        // 6. PREPARAR NOMBRE DEL ARCHIVO
        // ==================================

        let nombre = (doc.nombreArchivo || '')
          .replace(/[\\/\x00-\x1F\x7F]/g, '_')
          .trim();

        if (!nombre) {

          nombre =
            `carta_aceptacion_${doc.idDocumento}.pdf`;
        }

        if (!nombre.toLowerCase().endsWith('.pdf')) {
          nombre += '.pdf';
        }

        // ==================================
        // 7. CREAR ENLACE TEMPORAL
        // ==================================

        const urlTemporal = URL.createObjectURL(
          archivo
        );

        const enlace = document.createElement('a');

        enlace.href = urlTemporal;
        enlace.download = nombre;

        document.body.appendChild(enlace);

        // ==================================
        // 8. INICIAR DESCARGA
        // ==================================

        enlace.click();
        enlace.remove();

        // Liberar el recurso temporal.
        window.setTimeout(
          () => URL.revokeObjectURL(urlTemporal),
          1000
        );

        // ==================================
        // 9. MOSTRAR CONFIRMACION
        // ==================================

        if (this.idSolicitud === solicitudActual) {

          this.mensaje =
            'Descarga de carta de aceptación iniciada.';
        }
      },

      error: err => {

        this.descargandoDocumentoId = null;

        if (this.idSolicitud !== solicitudActual) {
          return;
        }

        this.mostrarError(err);
      }
    });
  }

  // ==========================================
  // VOLVER AL INICIO
  // ==========================================

  volver(): void {

    this.cerrarVistaPrevia();
    this.router.navigateByUrl('/inicio');
  }
}
