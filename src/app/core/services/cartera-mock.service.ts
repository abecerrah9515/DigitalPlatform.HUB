import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
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
} from '../models/cartera.models';

const MOCK_RESUMEN: CarteraResumenDto = {
  facturasPorCobrar: 5_280_000_000,
  facturasVencidas: 840_000_000,
  facturasConfirmadas: 3_120_000_000,
  facturasConDiferencia: 320_000_000,
  moneda: 'COP',
};

const MOCK_NOTIFICACIONES: CarteraNotificacionDto[] = [
  { id: 1, tipo: 'Vencida', cliente: 'Bancolombia', factura: 'F-2024-001', fechaVencimiento: '2026-01-15', diasMora: 45, monto: 120_000_000 },
  { id: 2, tipo: 'Vencida', cliente: 'Grupo Éxito', factura: 'F-2024-002', fechaVencimiento: '2026-02-01', diasMora: 28, monto: 85_000_000 },
  { id: 3, tipo: 'Vencida', cliente: 'Davivienda', factura: 'F-2024-003', fechaVencimiento: '2026-02-20', diasMora: 10, monto: 200_000_000 },
  { id: 4, tipo: 'PorVencer', cliente: 'Claro Colombia', factura: 'F-2024-004', fechaVencimiento: '2026-04-15', diasMora: 0, monto: 95_000_000 },
  { id: 5, tipo: 'PorVencer', cliente: 'EPM', factura: 'F-2024-005', fechaVencimiento: '2026-04-30', diasMora: 0, monto: 150_000_000 },
];

const MOCK_CARTERA_CLIENTES: CarteraClienteDto[] = [
  { cliente: 'Bancolombia', nit: '890.903.938-1', montoTotal: 1_200_000_000, facturasPendientes: 8 },
  { cliente: 'Grupo Éxito', nit: '890.900.609-2', montoTotal: 980_000_000, facturasPendientes: 6 },
  { cliente: 'Davivienda', nit: '860.034.854-4', montoTotal: 1_500_000_000, facturasPendientes: 10 },
  { cliente: 'Claro Colombia', nit: '830.054.234-8', montoTotal: 720_000_000, facturasPendientes: 5 },
  { cliente: 'EPM', nit: '890.904.996-1', montoTotal: 450_000_000, facturasPendientes: 3 },
  { cliente: 'Softtek Colombia', nit: '830.037.483-5', montoTotal: 430_000_000, facturasPendientes: 4 },
];

const MOCK_CARTERA_CATEGORIAS: CarteraClienteDto[] = [
  { cliente: 'Proyectos Banca', nit: 'BAN-001', montoTotal: 520_000_000, facturasPendientes: 12 },
  { cliente: 'Proyectos Retail', nit: 'RET-002', montoTotal: 380_000_000, facturasPendientes: 8 },
  { cliente: 'Proyectos Telecom', nit: 'TEL-003', montoTotal: 290_000_000, facturasPendientes: 6 },
  { cliente: 'Proyectos Energía', nit: 'ENE-004', montoTotal: 180_000_000, facturasPendientes: 4 },
  { cliente: 'Proyectos Salud', nit: 'SAL-005', montoTotal: 95_000_000, facturasPendientes: 3 },
];

const MOCK_PROYECCION_PAGOS: ProyeccionPagoDto[] = [
  { razonSocial: 'Bancolombia S.A.', monto: 340_000_000, facturasPendientes: 3 },
  { razonSocial: 'Davivienda S.A.', monto: 510_000_000, facturasPendientes: 2 },
  { razonSocial: 'Grupo Éxito S.A.S.', monto: 85_000_000, facturasPendientes: 1 },
  { razonSocial: 'Claro Colombia S.A.', monto: 95_000_000, facturasPendientes: 1 },
  { razonSocial: 'EPM S.A.', monto: 150_000_000, facturasPendientes: 1 },
  { razonSocial: 'Softtek Colombia S.A.S.', monto: 75_000_000, facturasPendientes: 1 },
];

const MOCK_FACTURAS: FacturaDto[] = [
  { id: 1, factura: 'F-2024-001', consecutivo: 'CONS-001', cliente: 'BAN-001', razonSocial: 'Bancolombia S.A.', nit: '890.903.938-1', fechaEmision: '2025-12-01', fechaVencimiento: '2026-01-15', monto: 120_000_000, retencion: 3_600_000, estado: 'Vencida', diasMora: 45 },
  { id: 2, factura: 'F-2024-002', consecutivo: 'CONS-002', cliente: 'EXT-002', razonSocial: 'Grupo Éxito S.A.S.', nit: '890.900.609-2', fechaEmision: '2025-12-15', fechaVencimiento: '2026-02-01', monto: 85_000_000, retencion: 2_550_000, estado: 'Vencida', diasMora: 28 },
  { id: 3, factura: 'F-2024-003', consecutivo: 'CONS-003', cliente: 'DAV-003', razonSocial: 'Davivienda S.A.', nit: '860.034.854-4', fechaEmision: '2026-01-10', fechaVencimiento: '2026-02-20', monto: 200_000_000, retencion: 6_000_000, estado: 'Vencida', diasMora: 10 },
  { id: 4, factura: 'F-2024-004', consecutivo: 'CONS-004', cliente: 'CLR-004', razonSocial: 'Claro Colombia S.A.', nit: '830.054.234-8', fechaEmision: '2026-02-01', fechaVencimiento: '2026-04-15', monto: 95_000_000, retencion: 0, estado: 'Pendiente', diasMora: 0 },
  { id: 5, factura: 'F-2024-005', consecutivo: 'CONS-005', cliente: 'EPM-005', razonSocial: 'EPM S.A.', nit: '890.904.996-1', fechaEmision: '2026-02-15', fechaVencimiento: '2026-04-30', monto: 150_000_000, retencion: 0, estado: 'Pendiente', diasMora: 0 },
  { id: 6, factura: 'F-2024-006', consecutivo: 'CONS-006', cliente: 'BAN-001', razonSocial: 'Bancolombia S.A.', nit: '890.903.938-1', fechaEmision: '2026-03-01', fechaVencimiento: '2026-05-15', monto: 220_000_000, retencion: 6_600_000, estado: 'Pendiente', diasMora: 0 },
  { id: 7, factura: 'F-2024-007', consecutivo: 'CONS-007', cliente: 'STK-006', razonSocial: 'Softtek Colombia S.A.S.', nit: '830.037.483-5', fechaEmision: '2025-11-20', fechaVencimiento: '2026-01-05', monto: 75_000_000, retencion: 0, estado: 'Vencida', diasMora: 55 },
  { id: 8, factura: 'F-2024-008', consecutivo: 'CONS-008', cliente: 'DAV-003', razonSocial: 'Davivienda S.A.', nit: '860.034.854-4', fechaEmision: '2026-03-10', fechaVencimiento: '2026-05-25', monto: 310_000_000, retencion: 9_300_000, estado: 'Pendiente', diasMora: 0 },
  { id: 9, factura: 'F-2024-009', consecutivo: 'CONS-009', cliente: 'EXT-002', razonSocial: 'Grupo Éxito S.A.S.', nit: '890.900.609-2', fechaEmision: '2026-01-05', fechaVencimiento: '2026-03-01', monto: 140_000_000, retencion: 4_200_000, estado: 'Vencida', diasMora: 40 },
  { id: 10, factura: 'F-2024-010', consecutivo: 'CONS-010', cliente: 'CLR-004', razonSocial: 'Claro Colombia S.A.', nit: '830.054.234-8', fechaEmision: '2026-03-20', fechaVencimiento: '2026-06-01', monto: 180_000_000, retencion: 0, estado: 'Pendiente', diasMora: 0 },
];

const MOCK_COMENTARIOS: Record<number, ComentarioDto[]> = {
  1: [
    { id: 1, autor: 'William Avella', fecha: '2026-02-20T10:30:00', texto: 'Cliente informa que pagará la próxima semana.' },
    { id: 2, autor: 'Carlos Méndez', fecha: '2026-03-01T14:00:00', texto: 'Se acordó nuevo plazo hasta el 15 de abril.', nuevaFechaCompromiso: '2026-04-15' },
  ],
  2: [
    { id: 3, autor: 'María Torres', fecha: '2026-02-25T09:15:00', texto: 'Factura en revisión por el área de cuentas por pagar.' },
  ],
  3: [
    { id: 4, autor: 'William Avella', fecha: '2026-03-05T11:00:00', texto: 'Se envió recordatorio al cliente.', nuevaFechaCompromiso: '2026-03-30' },
    { id: 5, autor: 'Andrés Ruiz', fecha: '2026-03-10T16:30:00', texto: 'Cliente confirmó pago para final de mes.' },
  ],
};

const MOCK_NOTIFICACIONES_ENVIADAS: NotificacionEnviadaDto[] = [
  { id: 1, factura: 'F-2024-001', cliente: 'Bancolombia', fechaEnvio: '2026-02-01', tipo: 'Recordatorio', estado: 'Enviado' },
  { id: 2, factura: 'F-2024-002', cliente: 'Grupo Éxito', fechaEnvio: '2026-02-10', tipo: 'Alerta Vencimiento', estado: 'Enviado' },
  { id: 3, factura: 'F-2024-003', cliente: 'Davivienda', fechaEnvio: '2026-02-25', tipo: 'Recordatorio', estado: 'Leído' },
  { id: 4, factura: 'F-2024-007', cliente: 'Softtek Colombia', fechaEnvio: '2026-01-20', tipo: 'Alerta Vencimiento', estado: 'Enviado' },
  { id: 5, factura: 'F-2024-009', cliente: 'Grupo Éxito', fechaEnvio: '2026-03-10', tipo: 'Recordatorio', estado: 'Pendiente' },
];

const MOCK_PROGRAMACION_PAGOS: ProgramacionPagoDto[] = [
  { id: 1, factura: 'F001-2026', cliente: 'Bancolombia S.A.', monto: 120000000, fechaVencimiento: '2026-01-15', fechaCompromiso: '2026-04-15', dias: 90, categoria: '61-90 dias', semanaFormateada: '1 al 7 ene', importeMonedaLocal: 120000000 },
  { id: 2, factura: 'F002-2026', cliente: 'Grupo Éxito S.A.S.', monto: 85000000, fechaVencimiento: '2026-02-01', fechaCompromiso: '2026-04-01', dias: 59, categoria: '31-60 dias', semanaFormateada: '1 al 7 feb', importeMonedaLocal: 85000000 },
  { id: 3, factura: 'F003-2026', cliente: 'Davivienda S.A.', monto: 200000000, fechaVencimiento: '2026-02-20', fechaCompromiso: '2026-03-30', dias: 38, categoria: '31-60 dias', semanaFormateada: '15 al 21 feb', importeMonedaLocal: 200000000 },
  { id: 4, factura: 'F004-2026', cliente: 'Claro Colombia S.A.', monto: 95000000, fechaVencimiento: '2026-04-15', fechaCompromiso: '2026-04-10', dias: -5, categoria: 'En Tiempo', semanaFormateada: '8 al 14 abr', importeMonedaLocal: 95000000 },
  { id: 5, factura: 'F005-2026', cliente: 'EPM S.A.', monto: 150000000, fechaVencimiento: '2026-04-30', fechaCompromiso: '2026-05-05', dias: 5, categoria: '0-15 dias', semanaFormateada: '22 al 28 abr', importeMonedaLocal: 150000000 },
  { id: 6, factura: 'F006-2026', cliente: 'Softtek Colombia S.A.S.', monto: 75000000, fechaVencimiento: '2026-01-05', fechaCompromiso: '2026-03-15', dias: 69, categoria: '61-90 dias', semanaFormateada: '1 al 7 ene', importeMonedaLocal: 75000000 },
  { id: 7, factura: 'F007-2026', cliente: 'Davivienda S.A.', monto: 310000000, fechaVencimiento: '2026-05-20', fechaCompromiso: '2026-05-25', dias: 5, categoria: '0-15 dias', semanaFormateada: '15 al 21 may', importeMonedaLocal: 310000000 },
  { id: 8, factura: 'F008-2026', cliente: 'Bancolombia S.A.', monto: 220000000, fechaVencimiento: '2026-05-15', fechaCompromiso: '2026-06-01', dias: 17, categoria: '16-30 dias', semanaFormateada: '8 al 14 may', importeMonedaLocal: 220000000 },
  { id: 9, factura: 'F009-2026', cliente: 'Grupo Éxito S.A.S.', monto: 140000000, fechaVencimiento: '2026-03-01', fechaCompromiso: '2026-04-20', dias: 50, categoria: '31-60 dias', semanaFormateada: '1 al 7 mar', importeMonedaLocal: 140000000 },
  { id: 10, factura: 'F010-2026', cliente: 'Claro Colombia S.A.', monto: 180000000, fechaVencimiento: '2026-06-01', fechaCompromiso: '2026-06-15', dias: 14, categoria: '0-15 dias', semanaFormateada: '22 al 28 may', importeMonedaLocal: 180000000 },
  { id: 11, factura: 'F011-2026', cliente: 'EPM S.A.', monto: 98000000, fechaVencimiento: '2026-06-10', fechaCompromiso: '2026-08-20', dias: 71, categoria: '61-90 dias', semanaFormateada: '8 al 14 jun', importeMonedaLocal: 98000000 },
  { id: 12, factura: 'F012-2026', cliente: 'Bancolombia S.A.', monto: 450000000, fechaVencimiento: '2026-07-01', fechaCompromiso: '2026-10-15', dias: 106, categoria: '91-120 dias', semanaFormateada: '1 al 7 jul', importeMonedaLocal: 450000000 },
];

const MOCK_SEGUIMIENTO_URGENTE: SeguimientoUrgenteDto[] = [
  {
    cliente: 'BAN-001',
    razonSocial: 'Bancolombia S.A.',
    facturas: MOCK_FACTURAS.filter(f => f.cliente === 'BAN-001' && f.estado === 'Vencida'),
  },
  {
    cliente: 'EXT-002',
    razonSocial: 'Grupo Éxito S.A.S.',
    facturas: MOCK_FACTURAS.filter(f => f.cliente === 'EXT-002' && f.estado === 'Vencida'),
  },
  {
    cliente: 'STK-006',
    razonSocial: 'Softtek Colombia S.A.S.',
    facturas: MOCK_FACTURAS.filter(f => f.cliente === 'STK-006' && f.estado === 'Vencida'),
  },
];

const MOCK_SUBPROYECTOS_RESUMEN: SubProyectoResumenDto[] = [
  { totalProyectos: 45, proyectosActivos: 32, pendientesDocumentacion: 8 },
  { totalProyectos: 28, proyectosActivos: 20, pendientesDocumentacion: 5 },
];

const MOCK_SUBPROYECTOS: SubProyectoDto[] = [
  { id: 1, nombre: 'Transformación Digital Banca', codigo: 'TD-BAN-001', empresa: 'Bancolombia', cliente: 'Bancolombia', estado: 'Activo', valor: 2_500_000_000 },
  { id: 2, nombre: 'Plataforma Ecommerce Éxito', codigo: 'EC-EXT-002', empresa: 'Grupo Éxito', cliente: 'Grupo Éxito', estado: 'Activo', valor: 1_800_000_000 },
  { id: 3, nombre: 'Core Bancario Davivienda', codigo: 'CB-DAV-003', empresa: 'Davivienda', cliente: 'Davivienda', estado: 'Activo', valor: 3_200_000_000 },
  { id: 4, nombre: 'Red 5G Claro', codigo: '5G-CLR-004', empresa: 'Claro Colombia', cliente: 'Claro Colombia', estado: 'Pendiente', valor: 4_100_000_000 },
  { id: 5, nombre: 'Smart Grid EPM', codigo: 'SG-EPM-005', empresa: 'EPM', cliente: 'EPM', estado: 'Activo', valor: 1_500_000_000 },
  { id: 6, nombre: 'Mantenimiento Infraestructura', codigo: 'MI-STK-006', empresa: 'Softtek Colombia', cliente: 'Softtek Colombia', estado: 'Activo', valor: 950_000_000 },
];

const MOCK_DIRECTORIO: DirectorioEmpresaDto[] = [
  { contacto: 'Luis Fernando Gómez', cargo: 'Director Financiero', email: 'luis.gomez@bancolombia.com.co', telefono: '+57 604 123 4567' },
  { contacto: 'Ana María Restrepo', cargo: 'Tesorera', email: 'ana.restrepo@bancolombia.com.co', telefono: '+57 604 123 4568' },
  { contacto: 'Carlos Arturo Pérez', cargo: 'Contador General', email: 'carlos.perez@bancolombia.com.co', telefono: '+57 604 123 4569' },
];

const MOCK_FECHAS_REPROGRAMADAS: FechaReprogramadaDto[] = [
  {
    factura: 'F-2024-001',
    cliente: 'Bancolombia',
    nuevaFechaCompromiso: '2026-04-15',
    texto: 'Se acordó nuevo plazo hasta el 15 de abril.',
    autor: 'Carlos Méndez',
    fecha: '2026-03-01T14:00:00',
  },
  {
    factura: 'F-2024-003',
    cliente: 'Davivienda',
    nuevaFechaCompromiso: '2026-03-30',
    texto: 'Se envió recordatorio al cliente.',
    autor: 'William Avella',
    fecha: '2026-03-05T11:00:00',
  },
  {
    factura: 'F-2024-005',
    cliente: 'EPM',
    nuevaFechaCompromiso: '2026-05-15',
    texto: 'Cliente solicitó extensión de plazo por flujo de caja.',
    autor: 'María Torres',
    fecha: '2026-04-10T09:00:00',
  },
];

const MOCK_EMPRESAS: string[] = [
  'Softtek Colombia S.A.S.',
  'Softtek México S.A. de C.V.',
  'Softtek Brasil Ltda.',
  'Softtek Argentina S.A.',
];

function makeCliente(
  id: number, nombre: string, nit: string, grupo: string,
  notas: NotaClienteDto[], contactos: ContactoClienteDto[],
): ClienteDetalleDto {
  return {
    id,
    nombre,
    nit,
    grupo,
    direccion: 'Cra 43A # 5A-113',
    ciudad: 'Medellín',
    region: 'Antioquia',
    pais: 'Colombia',
    codigoPostal: '050010',
    telefono: '+57 604 000 0000',
    emailContabilidad: `contabilidad@${nombre.toLowerCase().replace(/\s+/g, '')}.com.co`,
    condicionesPago: 'Neto 60 días',
    grupoCuenta: 'Grupo 1',
    origenCapital: 'Nacional',
    sectorIndustrial: 'Servicios Financieros',
    contactoContabilidad: 'Contador General',
    contactoTesoreria: 'Tesorero',
    contactoFinanzas: 'CFO',
    contactoOperacion: 'Gerente de Operaciones',
    contactoComercial: 'Gerente Comercial',
    contactoCompras: 'Jefe de Compras',
    notas,
    contactos,
  };
}

const MOCK_CLIENTES: ClienteDetalleDto[] = [
  makeCliente(1, 'Bancolombia', '890.903.938-1', 'Financiero', [
    { id: 1, autor: 'William Avella', fecha: '2026-01-15T09:00:00', texto: 'Cliente con excelente historial de pago.' },
    { id: 2, autor: 'María Torres', fecha: '2026-02-20T14:30:00', texto: 'Solicitaron ampliación de línea de crédito.' },
  ], [
    { id: 1, nombre: 'Luis Fernando Gómez', cargo: 'Director Financiero', departamento: 'Finanzas', email: 'luis.gomez@bancolombia.com.co', telefono: '+57 604 123 4567' },
    { id: 2, nombre: 'Ana María Restrepo', cargo: 'Tesorera', departamento: 'Tesorería', email: 'ana.restrepo@bancolombia.com.co', telefono: '+57 604 123 4568' },
  ]),
  makeCliente(2, 'Grupo Éxito', '890.900.609-2', 'Retail', [
    { id: 3, autor: 'Carlos Méndez', fecha: '2026-03-01T11:00:00', texto: 'Facturación mensual consolidada.' },
  ], [
    { id: 3, nombre: 'Pedro Ramírez', cargo: 'Contador General', departamento: 'Contabilidad', email: 'pedro.ramirez@grupoexito.com.co', telefono: '+57 604 987 6543' },
  ]),
  makeCliente(3, 'Davivienda', '860.034.854-4', 'Financiero', [], [
    { id: 4, nombre: 'Mónica Rojas', cargo: 'VP Finanzas', departamento: 'Finanzas', email: 'monica.rojas@davivienda.com', telefono: '+57 601 234 5678' },
  ]),
  makeCliente(4, 'Claro Colombia', '830.054.234-8', 'Telecomunicaciones', [
    { id: 4, autor: 'Andrés Ruiz', fecha: '2026-02-10T08:45:00', texto: 'Requieren facturación electrónica con radicado.' },
    { id: 5, autor: 'William Avella', fecha: '2026-03-15T10:00:00', texto: 'Se actualizó el contacto de tesorería.' },
  ], [
    { id: 5, nombre: 'Jorge Londoño', cargo: 'Director de Compras', departamento: 'Compras', email: 'jorge.londono@claro.com.co', telefono: '+57 601 456 7890' },
    { id: 6, nombre: 'Laura Jiménez', cargo: 'Analista de Cuentas por Pagar', departamento: 'Contabilidad', email: 'laura.jimenez@claro.com.co', telefono: '+57 601 456 7891' },
  ]),
  makeCliente(5, 'EPM', '890.904.996-1', 'Servicios Públicos', [
    { id: 6, autor: 'María Torres', fecha: '2026-01-05T07:30:00', texto: 'Contrato marco firmado por 3 años.' },
  ], [
    { id: 7, nombre: 'Santiago Uribe', cargo: 'Gerente de Abastecimiento', departamento: 'Abastecimiento', email: 'santiago.uribe@epm.com.co', telefono: '+57 604 789 0123' },
  ]),
  makeCliente(6, 'Softtek Colombia', '830.037.483-5', 'Tecnología', [
    { id: 7, autor: 'William Avella', fecha: '2026-03-20T12:00:00', texto: 'Proyecto interno de consolidación financiera.' },
    { id: 8, autor: 'Andrés Ruiz', fecha: '2026-03-25T16:15:00', texto: 'Pendiente revisión de gastos del mes.' },
  ], [
    { id: 8, nombre: 'Felipe Arango', cargo: 'Controller', departamento: 'Finanzas', email: 'felipe.arango@softtek.com', telefono: '+57 604 321 0987' },
  ]),
];

@Injectable({ providedIn: 'root' })
export class CarteraMockService {
  getResumen(_filters: CarteraFiltrosParams = {}): Observable<CarteraResumenDto> {
    return of(MOCK_RESUMEN).pipe(delay(300));
  }

  getNotificaciones(): Observable<CarteraNotificacionDto[]> {
    return of(MOCK_NOTIFICACIONES).pipe(delay(300));
  }

  getCarteraPorCliente(_filters: CarteraFiltrosParams = {}): Observable<CarteraClienteDto[]> {
    return of(MOCK_CARTERA_CLIENTES).pipe(delay(300));
  }

  getCarteraPorCategoria(_filters: CarteraFiltrosParams = {}): Observable<CarteraClienteDto[]> {
    return of(MOCK_CARTERA_CATEGORIAS).pipe(delay(300));
  }

  getProyeccionPagos(_filters: CarteraFiltrosParams = {}): Observable<ProyeccionPagoDto[]> {
    return of(MOCK_PROYECCION_PAGOS).pipe(delay(300));
  }

  getSeguimientoUrgente(_cliente?: string): Observable<SeguimientoUrgenteDto[]> {
    return of(MOCK_SEGUIMIENTO_URGENTE).pipe(delay(300));
  }

  getHistoricoFacturas(_cliente?: string): Observable<FacturaDto[]> {
    const facturas = _cliente
      ? MOCK_FACTURAS.filter(f => f.cliente === _cliente || f.razonSocial?.includes(_cliente))
      : MOCK_FACTURAS;
    return of(facturas).pipe(delay(300));
  }

  getProgramacionPagos(_cliente?: string): Observable<ProgramacionPagoDto[]> {
    return of(MOCK_PROGRAMACION_PAGOS).pipe(delay(300));
  }

  enviarAlerta(_tipo: 'Vencidas' | 'Diferencias', _cliente: string): Observable<{ enviado: boolean }> {
    return of({ enviado: true }).pipe(delay(500));
  }

  getFacturas(_filters: FacturacionFilterParams = {}): Observable<FacturaDto[]> {
    let result = MOCK_FACTURAS;
    if (_filters.Cliente) result = result.filter(f => f.cliente === _filters.Cliente);
    if (_filters.Estado) result = result.filter(f => f.estado === _filters.Estado);
    if (_filters.NIT) result = result.filter(f => f.nit === _filters.NIT);
    return of(result).pipe(delay(300));
  }

  descargarReporteFacturas(_filters: FacturacionFilterParams = {}): Observable<Blob> {
    return of(new Blob(['mock'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).pipe(delay(500));
  }

  agregarComentario(_facturaId: number, _comentario: { texto: string; nuevaFechaCompromiso?: string }): Observable<ComentarioDto> {
    return of({
      id: Date.now(),
      autor: 'Usuario Mock',
      fecha: new Date().toISOString(),
      texto: _comentario.texto,
      nuevaFechaCompromiso: _comentario.nuevaFechaCompromiso,
    }).pipe(delay(400));
  }

  getComentarios(facturaId: number): Observable<ComentarioDto[]> {
    return of(MOCK_COMENTARIOS[facturaId] || []).pipe(delay(300));
  }

  getNotificacionesEnviadas(_filters: { estado?: string; cliente?: string } = {}): Observable<NotificacionEnviadaDto[]> {
    let result = MOCK_NOTIFICACIONES_ENVIADAS;
    if (_filters.cliente) result = result.filter(n => n.cliente === _filters.cliente);
    if (_filters.estado) result = result.filter(n => n.estado === _filters.estado);
    return of(result).pipe(delay(300));
  }

  enviarRecordatorio(_facturasIds: number[]): Observable<{ enviado: boolean }> {
    return of({ enviado: true }).pipe(delay(500));
  }

  getClientes(_busqueda?: string): Observable<ClienteDetalleDto[]> {
    let result = MOCK_CLIENTES;
    if (_busqueda) result = result.filter(c => c.nombre.toLowerCase().includes(_busqueda.toLowerCase()));
    return of(result).pipe(delay(300));
  }

  getClienteById(id: number): Observable<ClienteDetalleDto> {
    const cliente = MOCK_CLIENTES.find(c => c.id === id) || MOCK_CLIENTES[0];
    return of(cliente).pipe(delay(300));
  }

  agregarNotaCliente(_clienteId: number, _texto: string): Observable<NotaClienteDto> {
    return of({
      id: Date.now(),
      autor: 'Usuario Mock',
      fecha: new Date().toISOString(),
      texto: _texto,
    }).pipe(delay(400));
  }

  agregarContacto(_clienteId: number, contacto: Omit<ContactoClienteDto, 'id'>): Observable<ContactoClienteDto> {
    return of({ id: Date.now(), ...contacto }).pipe(delay(400));
  }

  getSubProyectosResumen(): Observable<SubProyectoResumenDto> {
    return of(MOCK_SUBPROYECTOS_RESUMEN[0]).pipe(delay(300));
  }

  getSubProyectosLista(): Observable<SubProyectoDto[]> {
    return of(MOCK_SUBPROYECTOS).pipe(delay(300));
  }

  getDirectorioEmpresa(_empresa: string): Observable<DirectorioEmpresaDto[]> {
    return of(MOCK_DIRECTORIO).pipe(delay(300));
  }

  getEmpresas(): Observable<string[]> {
    return of(MOCK_EMPRESAS).pipe(delay(300));
  }

  getFechasReprogramadas(): Observable<FechaReprogramadaDto[]> {
    return of(MOCK_FECHAS_REPROGRAMADAS).pipe(delay(300));
  }

  uploadDirectorio(_empresa: string, _file: File): Observable<{ procesado: boolean }> {
    return of({ procesado: true }).pipe(delay(800));
  }

  enviarNotificacionBRM(_notificacion: NotificacionBRMDto): Observable<{ enviado: boolean; recordatorioCada3Dias: boolean }> {
    return of({ enviado: true, recordatorioCada3Dias: true }).pipe(delay(500));
  }
}
