import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  CarteraFiltrosParams,
  FacturacionFilterParams,
  CarteraResumenDto,
  CarteraNotificacionDto,
  CarteraClienteDto,
  ProyeccionPagoDto,
  FacturaDto,
  ComentarioDto,
  NotificacionEnviadaDto,
  ProgramacionPagoDto,
  SeguimientoUrgenteDto,
  SubProyectoResumenDto,
  SubProyectoDto,
  DirectorioEmpresaDto,
  NotificacionBRMDto,
  ClienteDetalleDto,
  NotaClienteDto,
  ContactoClienteDto,
  FechaReprogramadaDto,
  DocumentoClienteDto,
  ClienteUpdateDto,
  DepartamentoFinanzasDto,
  TasaCambioDto,
} from '../models/cartera.models';

@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Cartera`;

  private buildParams(filters: CarteraFiltrosParams | FacturacionFilterParams): HttpParams {
    let params = new HttpParams();
    const entries = Object.entries(filters) as [string, string | number | string[] | number[] | undefined][];
    for (const [key, value] of entries) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach(v => (params = params.append(key, String(v))));
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  getResumen(filters: CarteraFiltrosParams = {}): Observable<CarteraResumenDto> {
    return this.http
      .get<ApiResponse<CarteraResumenDto>>(`${this.base}/resumen`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getNotificaciones(): Observable<CarteraNotificacionDto[]> {
    return this.http
      .get<ApiResponse<CarteraNotificacionDto[]>>(`${this.base}/notificaciones`)
      .pipe(map(r => r.data));
  }

  getCarteraPorCliente(filters: CarteraFiltrosParams = {}): Observable<CarteraClienteDto[]> {
    return this.http
      .get<ApiResponse<CarteraClienteDto[]>>(`${this.base}/cartera-por-cliente`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getProyeccionPagos(filters: CarteraFiltrosParams = {}): Observable<ProyeccionPagoDto[]> {
    return this.http
      .get<ApiResponse<ProyeccionPagoDto[]>>(`${this.base}/proyeccion-pagos`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getSeguimientoUrgente(cliente?: string): Observable<SeguimientoUrgenteDto[]> {
    let params = new HttpParams();
    if (cliente) params = params.set('cliente', cliente);
    return this.http
      .get<ApiResponse<SeguimientoUrgenteDto[]>>(`${this.base}/seguimiento-urgente`, { params })
      .pipe(map(r => r.data));
  }

  getHistoricoFacturas(cliente?: string): Observable<FacturaDto[]> {
    let params = new HttpParams();
    if (cliente) params = params.set('cliente', cliente);
    return this.http
      .get<ApiResponse<FacturaDto[]>>(`${this.base}/historico-facturas`, { params })
      .pipe(map(r => r.data));
  }

  getProgramacionPagos(cliente?: string): Observable<ProgramacionPagoDto[]> {
    let params = new HttpParams();
    if (cliente) params = params.set('cliente', cliente);
    return this.http
      .get<ApiResponse<ProgramacionPagoDto[]>>(`${this.base}/programacion-pagos`, { params })
      .pipe(map(r => r.data));
  }

  exportarProgramacionPagos(cliente?: string): Observable<Blob> {
    let params = new HttpParams();
    if (cliente) params = params.set('cliente', cliente);
    return this.http.get(`${this.base}/exportar-programacion`, {
      params,
      responseType: 'blob',
    });
  }

  enviarAlerta(tipo: 'Vencidas' | 'Diferencias', cliente: string): Observable<{ enviado: boolean }> {
    return this.http
      .post<ApiResponse<{ enviado: boolean }>>(`${this.base}/enviar-alerta`, { tipo, cliente })
      .pipe(map(r => r.data));
  }

  getCarteraPorCategoria(filters: CarteraFiltrosParams = {}): Observable<CarteraClienteDto[]> {
    return this.http
      .get<ApiResponse<CarteraClienteDto[]>>(`${this.base}/cartera-por-categoria`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getFacturas(filters: FacturacionFilterParams = {}): Observable<FacturaDto[]> {
    return this.http
      .get<ApiResponse<FacturaDto[]>>(`${this.base}/facturas`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getDepartamentos(): Observable<DepartamentoFinanzasDto[]> {
    return this.http
      .get<ApiResponse<DepartamentoFinanzasDto[]>>(`${environment.apiUrl}/api/DepartamentosFinanzas`)
      .pipe(map(r => r.data));
  }

  getTasaCambio(moneda: string): Observable<TasaCambioDto> {
    return this.http
      .get<ApiResponse<TasaCambioDto>>(`${this.base}/tasa-cambio`, { params: { moneda } })
      .pipe(map(r => r.data));
  }

  descargarReporteFacturas(filters: FacturacionFilterParams = {}): Observable<Blob> {
    return this.http.get(`${this.base}/facturas/descargar`, {
      params: this.buildParams(filters),
      responseType: 'blob',
    });
  }

  agregarComentario(facturaId: number, comentario: { texto: string; nuevaFechaCompromiso?: string }): Observable<ComentarioDto> {
    return this.http
      .post<ApiResponse<ComentarioDto>>(`${this.base}/facturas/${facturaId}/comentarios`, comentario)
      .pipe(map(r => { if (!r.success) throw new Error(r.message ?? 'Error desconocido'); return r.data; }));
  }

  getComentarios(facturaId: number): Observable<ComentarioDto[]> {
    return this.http
      .get<ApiResponse<ComentarioDto[]>>(`${this.base}/facturas/${facturaId}/comentarios`)
      .pipe(map(r => r.data));
  }

  getNotificacionesEnviadas(filters: { estado?: string; cliente?: string } = {}): Observable<NotificacionEnviadaDto[]> {
    let params = new HttpParams();
    const entries = Object.entries(filters) as [string, string | undefined][];
    for (const [key, value] of entries) {
      if (value !== undefined && value !== null) {
        params = params.set(key, value);
      }
    }
    return this.http
      .get<ApiResponse<NotificacionEnviadaDto[]>>(`${this.base}/notificaciones-enviadas`, { params })
      .pipe(map(r => r.data));
  }

  enviarRecordatorio(facturasIds: number[]): Observable<{ enviado: boolean }> {
    return this.http
      .post<ApiResponse<{ enviado: boolean }>>(`${this.base}/enviar-recordatorio`, { facturasIds })
      .pipe(map(r => r.data));
  }

  getClientes(busqueda?: string): Observable<ClienteDetalleDto[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http
      .get<ApiResponse<ClienteDetalleDto[]>>(`${this.base}/clientes`, { params })
      .pipe(map(r => r.data));
  }

  getClienteById(id: number): Observable<ClienteDetalleDto> {
    return this.http
      .get<ApiResponse<ClienteDetalleDto>>(`${this.base}/clientes/${id}`)
      .pipe(map(r => r.data));
  }

  agregarNotaCliente(clienteId: number, texto: string): Observable<NotaClienteDto> {
    return this.http
      .post<ApiResponse<NotaClienteDto>>(`${this.base}/clientes/${clienteId}/notas`, { texto })
      .pipe(map(r => r.data));
  }

  agregarContacto(clienteId: number, contacto: Omit<ContactoClienteDto, 'id'>): Observable<ContactoClienteDto> {
    return this.http
      .post<ApiResponse<ContactoClienteDto>>(`${this.base}/clientes/${clienteId}/contactos`, contacto)
      .pipe(map(r => r.data));
  }

  actualizarContacto(clienteId: number, contactoId: number, contacto: Omit<ContactoClienteDto, 'id'>): Observable<ContactoClienteDto> {
    return this.http
      .put<ApiResponse<ContactoClienteDto>>(`${this.base}/clientes/${clienteId}/contactos/${contactoId}`, contacto)
      .pipe(map(r => r.data));
  }

  eliminarContacto(clienteId: number, contactoId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/clientes/${clienteId}/contactos/${contactoId}`)
      .pipe(map(r => r.data));
  }

  getSubProyectosResumen(): Observable<SubProyectoResumenDto> {
    return this.http
      .get<ApiResponse<SubProyectoResumenDto>>(`${this.base}/subproyectos/resumen`)
      .pipe(map(r => r.data));
  }

  getSubProyectosLista(): Observable<SubProyectoDto[]> {
    return this.http
      .get<ApiResponse<SubProyectoDto[]>>(`${this.base}/subproyectos`)
      .pipe(map(r => r.data));
  }

  getDirectorioEmpresa(empresa: string): Observable<DirectorioEmpresaDto[]> {
    return this.http
      .get<ApiResponse<DirectorioEmpresaDto[]>>(`${this.base}/directorio/${empresa}`)
      .pipe(map(r => r.data));
  }

  getEmpresas(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.base}/empresas`)
      .pipe(map(r => r.data));
  }

  uploadDirectorio(empresa: string, file: File): Observable<{ procesado: boolean }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http
      .post<ApiResponse<{ procesado: boolean }>>(`${this.base}/directorio/${empresa}/upload`, fd)
      .pipe(map(r => r.data));
  }

  uploadCorreos(file: File): Observable<{ procesado: boolean }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http
      .post<ApiResponse<{ procesado: boolean }>>(`${this.base}/cargar-correos`, fd)
      .pipe(map(r => r.data));
  }

  getFechasReprogramadas(): Observable<FechaReprogramadaDto[]> {
    return this.http
      .get<ApiResponse<FechaReprogramadaDto[]>>(`${this.base}/fechas-reprogramadas`)
      .pipe(map(r => r.data));
  }

  enviarNotificacionBRM(notificacion: NotificacionBRMDto): Observable<{ enviado: boolean; recordatorioCada3Dias: boolean }> {
    return this.http
      .post<ApiResponse<{ enviado: boolean; recordatorioCada3Dias: boolean }>>(`${this.base}/notificar-brm`, notificacion)
      .pipe(map(r => r.data));
  }

  getDocumentos(clienteId: number): Observable<DocumentoClienteDto[]> {
    return this.http
      .get<ApiResponse<DocumentoClienteDto[]>>(`${this.base}/clientes/${clienteId}/documentos`)
      .pipe(map(r => r.data));
  }

  actualizarCliente(id: number, data: ClienteUpdateDto): Observable<ClienteDetalleDto> {
    return this.http
      .put<ApiResponse<ClienteDetalleDto>>(`${this.base}/clientes/${id}`, data)
      .pipe(map(r => r.data));
  }
}
