export interface TasaCambioDto {
  moneda: string;
  tasa: number;
}

export interface CarteraFiltrosParams {
  Moneda?: string;
  Cliente?: string[];
}

export interface FacturacionFilterParams {
  Cliente?: string;
  NIT?: string;
  Estado?: string;
}

export interface CarteraResumenDto {
  facturasPorCobrar: number;
  facturasVencidas: number;
  facturasConfirmadas: number;
  facturasConDiferencia: number;
  moneda: string;
}

export interface CarteraNotificacionDto {
  id: number;
  tipo: 'Vencida' | 'PorVencer';
  cliente: string;
  factura: string;
  fechaVencimiento: string;
  diasMora: number;
  monto: number;
}

export interface CarteraClienteDto {
  cliente: string;
  razonSocial?: string;
  nit: string;
  montoTotal: number;
  facturasPendientes: number;
}

export interface ProyeccionPagoDto {
  razonSocial: string;
  monto: number;
  facturasPendientes: number;
}

export interface FacturaDto {
  id: number;
  factura: string;
  consecutivo: string;
  cliente: string;
  razonSocial?: string;
  nit: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  retencion: number;
  estado: string;
  diasMora: number;
}

export interface ComentarioDto {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
  nuevaFechaCompromiso?: string;
}

export interface DepartamentoFinanzasDto {
  id: number;
  nombre: string;
}

export interface NotificacionEnviadaDto {
  id: number;
  factura: string;
  cliente: string;
  fechaEnvio: string;
  tipo: string;
  estado: string;
}

export interface ProgramacionPagoDto {
  id: number;
  factura: string;
  cliente: string;
  monto: number;
  fechaVencimiento: string;
  fechaCompromiso: string;
  dias: number;
  categoria: string;
  semanaFormateada: string;
  importeMonedaLocal: number;
}

export interface SeguimientoUrgenteDto {
  cliente: string;
  razonSocial?: string;
  facturas: FacturaDto[];
}

export interface SubProyectoResumenDto {
  totalProyectos: number;
  proyectosActivos: number;
  pendientesDocumentacion: number;
}

export interface SubProyectoDto {
  id: number;
  nombre: string;
  codigo: string;
  empresa: string;
  cliente: string;
  nit?: string;
  estado: string;
  valor: number;
}

export interface DirectorioEmpresaDto {
  contacto: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface NotificacionBRMDto {
  correoCliente: string;
  correoBRM: string;
  asunto: string;
  sharepointLink: string;
  mensaje: string;
}

export interface ClienteDetalleDto {
  id: number;
  nombre: string;
  nit: string;
  grupo: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  codigoPostal: string;
  telefono: string;
  emailContabilidad: string;
  condicionesPago: string;
  grupoCuenta: string;
  origenCapital: string;
  sectorIndustrial: string;
  contactoContabilidad: string;
  contactoTesoreria: string;
  contactoFinanzas: string;
  contactoOperacion: string;
  contactoComercial: string;
  contactoCompras: string;
  notas: NotaClienteDto[];
  contactos: ContactoClienteDto[];
}

export interface NotaClienteDto {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
}

export interface FechaReprogramadaDto {
  factura: string;
  cliente: string;
  nuevaFechaCompromiso: string;
  texto: string;
  autor: string;
  fecha: string;
}

export interface ContactoClienteDto {
  id: number;
  nombre: string;
  cargo: string;
  departamento: string;
  email: string;
  telefono: string;
}

export interface DocumentoClienteDto {
  id: number;
  nombre: string;
  tipo: string;
  fechaCarga: string;
  url?: string;
}

export interface ClienteUpdateDto {
  nombre: string;
  nit: string;
  grupo: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  telefono: string;
  emailContabilidad: string;
  contactoContabilidad: string;
  contactoTesoreria: string;
  contactoFinanzas: string;
  contactoOperacion: string;
  contactoComercial: string;
  contactoCompras: string;
}
