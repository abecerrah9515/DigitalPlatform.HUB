export interface FiltrosParams {
  Moneda?: string;
  Año?: number[];
  Mes?: number[];
  Cliente?: string[];
  CodProyecto?: string[];
  Vertical?: string[];
  Area?: string[];
  Pais?: string[];
}

export interface FiltrosValoresDto {
  clientes: string[] | null;
  proyectos: string[] | null;
  verticales: string[] | null;
  areas: string[] | null;
  paises: string[] | null;
  años: number[] | null;
  meses: number[] | null;
}

export interface SegmentoDto {
  nombre: string | null;
  ingreso: number;
  porcentajeContribucion: number;
}

export interface BarraApiladaPeriodoDto {
  año: number;
  mes: number;
  segmentos: SegmentoDto[] | null;
}

export interface BarrasApiladasItemDto {
  periodo: string | null;
  segmento: string | null;
  ingreso: number;
  porcentajeContribucion: number;
  variacionPeriodoAnterior: number;
}

export interface BarrasApiladasResponseDto {
  agrupadoPor: string | null;
  items: BarrasApiladasItemDto[] | null;
}

export interface PlanVsRealPeriodoDto {
  periodo: string | null;
  ingresoPlaneado: number;
  ingresoReal: number;
}

export interface PlanVsRealTablaRowDto {
  mes: string | null;
  plan: number;
  real: number;
  variacionPct: number;
  estado: string | null;
}

export interface PlanVsRealResponseDto {
  periodos: PlanVsRealPeriodoDto[] | null;
  tablaResumen: PlanVsRealTablaRowDto[] | null;
}

export interface TendenciaPuntoDto {
  periodo: string | null;
  ingresoReal: number;
  ingresoPlaneado: number;
  variacion: number;
  pctCumplimiento: number;
}

export interface TendenciaResponseDto {
  puntos: TendenciaPuntoDto[] | null;
}

export interface ClienteHorasDto {
  cliente: string | null;
  horas: number;
  pctParticipacion: number;
}

export interface TopClientesHorasResponseDto {
  clientes: ClienteHorasDto[] | null;
}

export interface AreaHorasDto {
  area: string | null;
  horas: number;
  cantidadProyectos: number;
  pctParticipacion: number;
}

export interface TreemapAreaResponseDto {
  areas: AreaHorasDto[] | null;
}

export interface BurbujaClienteDto {
  cliente: string | null;
  area: string | null;
  tarifaEntrega: number;
  gmPct: number;
  ingreso: number;
}

export interface ScatterBurbujaResponseDto {
  clientes: BurbujaClienteDto[] | null;
  tarifaPromedio: number;
}

export interface HeatmapCeldaDto {
  cliente: string | null;
  periodo: string | null;
  gmPct: number;
  ingreso: number;
  costo: number;
}

export interface HeatmapGmResponseDto {
  celdas: HeatmapCeldaDto[] | null;
}

export interface GraficoBarrasApiladasDto {
  vistaActual: string | null;
  periodos: BarraApiladaPeriodoDto[] | null;
}

export interface TablaPlanVsRealDto {
  mes: string | null;
  plan: number;
  real: number;
  deltaPorcentaje: number;
}

export interface PeriodoPlanVsRealDto {
  año: number;
  mes: number;
  ingresoReal: number;
  ingresoPlaneado: number;
}

export interface GraficoPlanVsRealDto {
  periodos: PeriodoPlanVsRealDto[] | null;
  tablaResumen: TablaPlanVsRealDto[] | null;
}
