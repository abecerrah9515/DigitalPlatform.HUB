import {
  FiltrosValoresDto,
  BarrasApiladasResponseDto,
  PlanVsRealResponseDto,
  TendenciaResponseDto,
  TopClientesHorasResponseDto,
  TreemapAreaResponseDto,
  ScatterBurbujaResponseDto,
  HeatmapGmResponseDto,
} from '../models/graficas.models';
import { KpisDto } from '../models/kpis.models';
import { PagedResult } from '../models/api.models';
import { ConsolidacionHistorialDto, ConsolidacionEstadoDto } from '../models/consolidacion.models';

export const MOCK_KPIS: KpisDto = {
  ingresoTotalReal: { valor: 2_847_320, unidad: 'USD', semaforo: 'verde', tendencia: 'up', badgeTexto: '+6.2% vs plan', subtitulo: 'Acumulado 2025' },
  margenGM: { valor: 27.4, unidad: '%', semaforo: 'amarillo', tendencia: 'down', badgeTexto: '-1.3pp vs plan', subtitulo: 'GM consolidado' },
  horasEntregadas: { valor: 52_140, unidad: 'hrs', semaforo: 'verde', tendencia: 'up', badgeTexto: '+4.1% vs plan', subtitulo: 'Horas totales' },
  tarifaEntregaPromedio: { valor: 54.6, unidad: 'USD/hr', semaforo: 'verde', tendencia: 'up', badgeTexto: '+$2.1 vs plan', subtitulo: 'Tarifa promedio' },
  cumplimientoIngresosPlan: { valor: 93.8, unidad: '%', semaforo: 'amarillo', tendencia: 'up', badgeTexto: '-6.2pp vs meta', subtitulo: 'Cumplimiento plan' },
};

export const MOCK_FILTROS_VALORES: FiltrosValoresDto = {
  clientes: ['Bancolombia', 'Grupo Éxito', 'Davivienda', 'Claro Colombia', 'EPM', 'ETB', 'Suramericana', 'Nutresa'],
  proyectos: ['PRY-001', 'PRY-002', 'PRY-003', 'PRY-004', 'PRY-005', 'PRY-006', 'PRY-007', 'PRY-008', 'PRY-009', 'PRY-010'],
  verticales: ['Financial Services', 'Retail & Consumer', 'Telco & Media', 'Energy & Utilities', 'Manufacturing'],
  areas: ['Desarrollo Backend', 'QA & Testing', 'DevOps', 'Analytics & BI', 'Arquitectura', 'UX Design'],
  paises: ['Colombia', 'México'],
  años: [2024, 2025],
  meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const MOCK_BARRAS_APILADAS: BarrasApiladasResponseDto = {
  agrupadoPor: 'Vertical',
  items: [
    { periodo: 'Ene 25', segmento: 'Financial Services',  ingreso: 580_000, porcentajeContribucion: 38, variacionPeriodoAnterior: 5.2 },
    { periodo: 'Ene 25', segmento: 'Retail & Consumer',   ingreso: 320_000, porcentajeContribucion: 21, variacionPeriodoAnterior: -2.1 },
    { periodo: 'Ene 25', segmento: 'Telco & Media',       ingreso: 280_000, porcentajeContribucion: 18, variacionPeriodoAnterior: 3.8 },
    { periodo: 'Ene 25', segmento: 'Energy & Utilities',  ingreso: 210_000, porcentajeContribucion: 14, variacionPeriodoAnterior: 1.4 },
    { periodo: 'Ene 25', segmento: 'Manufacturing',       ingreso: 140_000, porcentajeContribucion: 9,  variacionPeriodoAnterior: -0.5 },
    { periodo: 'Feb 25', segmento: 'Financial Services',  ingreso: 610_000, porcentajeContribucion: 39, variacionPeriodoAnterior: 5.2 },
    { periodo: 'Feb 25', segmento: 'Retail & Consumer',   ingreso: 300_000, porcentajeContribucion: 19, variacionPeriodoAnterior: -6.3 },
    { periodo: 'Feb 25', segmento: 'Telco & Media',       ingreso: 295_000, porcentajeContribucion: 19, variacionPeriodoAnterior: 5.4 },
    { periodo: 'Feb 25', segmento: 'Energy & Utilities',  ingreso: 225_000, porcentajeContribucion: 14, variacionPeriodoAnterior: 7.1 },
    { periodo: 'Feb 25', segmento: 'Manufacturing',       ingreso: 145_000, porcentajeContribucion: 9,  variacionPeriodoAnterior: 3.6 },
    { periodo: 'Mar 25', segmento: 'Financial Services',  ingreso: 640_000, porcentajeContribucion: 40, variacionPeriodoAnterior: 4.9 },
    { periodo: 'Mar 25', segmento: 'Retail & Consumer',   ingreso: 310_000, porcentajeContribucion: 19, variacionPeriodoAnterior: 3.3 },
    { periodo: 'Mar 25', segmento: 'Telco & Media',       ingreso: 270_000, porcentajeContribucion: 17, variacionPeriodoAnterior: -8.5 },
    { periodo: 'Mar 25', segmento: 'Energy & Utilities',  ingreso: 235_000, porcentajeContribucion: 15, variacionPeriodoAnterior: 4.4 },
    { periodo: 'Mar 25', segmento: 'Manufacturing',       ingreso: 145_000, porcentajeContribucion: 9,  variacionPeriodoAnterior: 0 },
    { periodo: 'Abr 25', segmento: 'Financial Services',  ingreso: 595_000, porcentajeContribucion: 38, variacionPeriodoAnterior: -7.0 },
    { periodo: 'Abr 25', segmento: 'Telco & Media',       ingreso: 285_000, porcentajeContribucion: 18, variacionPeriodoAnterior: 5.6 },
    { periodo: 'Abr 25', segmento: 'Energy & Utilities',  ingreso: 220_000, porcentajeContribucion: 14, variacionPeriodoAnterior: -6.4 },
    { periodo: 'Abr 25', segmento: 'Manufacturing',       ingreso: 140_000, porcentajeContribucion: 9,  variacionPeriodoAnterior: -3.4 },
      // MAYO
    { periodo: 'May 25', segmento: 'Financial Services', ingreso: 660000, porcentajeContribucion: 41, variacionPeriodoAnterior: 3.0 },
    { periodo: 'May 25', segmento: 'Retail & Consumer',  ingreso: 320000, porcentajeContribucion: 20, variacionPeriodoAnterior: -4.5 },
    { periodo: 'May 25', segmento: 'Telco & Media',      ingreso: 300000, porcentajeContribucion: 18, variacionPeriodoAnterior: 5.3 },
    { periodo: 'May 25', segmento: 'Energy & Utilities', ingreso: 240000, porcentajeContribucion: 14, variacionPeriodoAnterior: 9.0 },
    { periodo: 'May 25', segmento: 'Manufacturing',      ingreso: 150000, porcentajeContribucion: 9,  variacionPeriodoAnterior: 7.1 },

    // JUNIO
    { periodo: 'Jun 25', segmento: 'Financial Services', ingreso: 680000, porcentajeContribucion: 42, variacionPeriodoAnterior: 3.5 },
    { periodo: 'Jun 25', segmento: 'Retail & Consumer',  ingreso: 310000, porcentajeContribucion: 19, variacionPeriodoAnterior: -3.1 },
    { periodo: 'Jun 25', segmento: 'Telco & Media',      ingreso: 315000, porcentajeContribucion: 19, variacionPeriodoAnterior: 5.0 },
    { periodo: 'Jun 25', segmento: 'Energy & Utilities', ingreso: 250000, porcentajeContribucion: 15, variacionPeriodoAnterior: 4.2 },
    { periodo: 'Jun 25', segmento: 'Manufacturing',      ingreso: 155000, porcentajeContribucion: 9,  variacionPeriodoAnterior: 3.3 },

    // JULIO
    { periodo: 'Jul 25', segmento: 'Financial Services', ingreso: 700000, porcentajeContribucion: 42, variacionPeriodoAnterior: 2.9 },
    { periodo: 'Jul 25', segmento: 'Retail & Consumer',  ingreso: 305000, porcentajeContribucion: 18, variacionPeriodoAnterior: -1.6 },
    { periodo: 'Jul 25', segmento: 'Telco & Media',      ingreso: 320000, porcentajeContribucion: 19, variacionPeriodoAnterior: 1.6 },
    { periodo: 'Jul 25', segmento: 'Energy & Utilities', ingreso: 260000, porcentajeContribucion: 15, variacionPeriodoAnterior: 4.0 },
    { periodo: 'Jul 25', segmento: 'Manufacturing',      ingreso: 160000, porcentajeContribucion: 9,  variacionPeriodoAnterior: 3.2 },

    // AGOSTO
    { periodo: 'Ago 25', segmento: 'Financial Services', ingreso: 690000, porcentajeContribucion: 41, variacionPeriodoAnterior: -1.4 },
    { periodo: 'Ago 25', segmento: 'Retail & Consumer',  ingreso: 320000, porcentajeContribucion: 19, variacionPeriodoAnterior: 4.9 },
    { periodo: 'Ago 25', segmento: 'Telco & Media',      ingreso: 310000, porcentajeContribucion: 18, variacionPeriodoAnterior: -3.1 },
    { periodo: 'Ago 25', segmento: 'Energy & Utilities', ingreso: 270000, porcentajeContribucion: 16, variacionPeriodoAnterior: 3.8 },
    { periodo: 'Ago 25', segmento: 'Manufacturing',      ingreso: 170000, porcentajeContribucion: 10, variacionPeriodoAnterior: 6.3 },

    // SEPTIEMBRE
    { periodo: 'Sep 25', segmento: 'Financial Services', ingreso: 710000, porcentajeContribucion: 42, variacionPeriodoAnterior: 2.9 },
    { periodo: 'Sep 25', segmento: 'Retail & Consumer',  ingreso: 330000, porcentajeContribucion: 19, variacionPeriodoAnterior: 3.1 },
    { periodo: 'Sep 25', segmento: 'Telco & Media',      ingreso: 325000, porcentajeContribucion: 19, variacionPeriodoAnterior: 4.8 },
    { periodo: 'Sep 25', segmento: 'Energy & Utilities', ingreso: 275000, porcentajeContribucion: 16, variacionPeriodoAnterior: 1.8 },
    { periodo: 'Sep 25', segmento: 'Manufacturing',      ingreso: 175000, porcentajeContribucion: 10, variacionPeriodoAnterior: 2.9 },

    // OCTUBRE
    { periodo: 'Oct 25', segmento: 'Financial Services', ingreso: 730000, porcentajeContribucion: 43, variacionPeriodoAnterior: 2.8 },
    { periodo: 'Oct 25', segmento: 'Retail & Consumer',  ingreso: 340000, porcentajeContribucion: 20, variacionPeriodoAnterior: 3.0 },
    { periodo: 'Oct 25', segmento: 'Telco & Media',      ingreso: 330000, porcentajeContribucion: 19, variacionPeriodoAnterior: 1.5 },
    { periodo: 'Oct 25', segmento: 'Energy & Utilities', ingreso: 280000, porcentajeContribucion: 16, variacionPeriodoAnterior: 1.8 },
    { periodo: 'Oct 25', segmento: 'Manufacturing',      ingreso: 180000, porcentajeContribucion: 10, variacionPeriodoAnterior: 2.8 },

    // NOVIEMBRE
    { periodo: 'Nov 25', segmento: 'Financial Services', ingreso: 750000, porcentajeContribucion: 44, variacionPeriodoAnterior: 2.7 },
    { periodo: 'Nov 25', segmento: 'Retail & Consumer',  ingreso: 350000, porcentajeContribucion: 20, variacionPeriodoAnterior: 2.9 },
    { periodo: 'Nov 25', segmento: 'Telco & Media',      ingreso: 335000, porcentajeContribucion: 19, variacionPeriodoAnterior: 1.5 },
    { periodo: 'Nov 25', segmento: 'Energy & Utilities', ingreso: 290000, porcentajeContribucion: 16, variacionPeriodoAnterior: 3.5 },
    { periodo: 'Nov 25', segmento: 'Manufacturing',      ingreso: 185000, porcentajeContribucion: 10, variacionPeriodoAnterior: 2.7 },

    // DICIEMBRE
    { periodo: 'Dic 25', segmento: 'Financial Services', ingreso: 770000, porcentajeContribucion: 44, variacionPeriodoAnterior: 2.6 },
    { periodo: 'Dic 25', segmento: 'Retail & Consumer',  ingreso: 360000, porcentajeContribucion: 21, variacionPeriodoAnterior: 2.8 },
    { periodo: 'Dic 25', segmento: 'Telco & Media',      ingreso: 340000, porcentajeContribucion: 19, variacionPeriodoAnterior: 1.5 },
    { periodo: 'Dic 25', segmento: 'Energy & Utilities', ingreso: 300000, porcentajeContribucion: 16, variacionPeriodoAnterior: 3.4 },
    { periodo: 'Dic 25', segmento: 'Manufacturing',      ingreso: 190000, porcentajeContribucion: 10, variacionPeriodoAnterior: 2.7 },

  ],
};

export const MOCK_PLAN_VS_REAL: PlanVsRealResponseDto = {
  periodos: [
    { periodo: 'Ene 2025', ingresoPlaneado: 1_480_000, ingresoReal: 1_530_000 },
    { periodo: 'Feb 2025', ingresoPlaneado: 1_520_000, ingresoReal: 1_575_000 },
    { periodo: 'Mar 2025', ingresoPlaneado: 1_600_000, ingresoReal: 1_600_000 },
    { periodo: 'Abr 2025', ingresoPlaneado: 1_650_000, ingresoReal: 1_575_000 },
    { periodo: 'May 2025', ingresoPlaneado: 1_700_000, ingresoReal: 1_620_000 },
    { periodo: 'Jun 2025', ingresoPlaneado: 1_750_000, ingresoReal: 1_685_000 },
  ],
  tablaResumen: [
    { mes: 'Ene 2025', plan: 1_480_000, real: 1_530_000, variacionPct: 3.4,  estado: 'Verde' },
    { mes: 'Feb 2025', plan: 1_520_000, real: 1_575_000, variacionPct: 3.6,  estado: 'Verde' },
    { mes: 'Mar 2025', plan: 1_600_000, real: 1_600_000, variacionPct: 0,    estado: 'Verde' },
    { mes: 'Abr 2025', plan: 1_650_000, real: 1_575_000, variacionPct: -4.5, estado: 'Amarillo' },
    { mes: 'May 2025', plan: 1_700_000, real: 1_620_000, variacionPct: -4.7, estado: 'Amarillo' },
    { mes: 'Jun 2025', plan: 1_750_000, real: 1_685_000, variacionPct: -3.7, estado: 'Amarillo' },
  ],
};

export const MOCK_TENDENCIA: TendenciaResponseDto = {
  puntos: [
    { periodo: 'Jul 2024', ingresoReal: 1_280_000, ingresoPlaneado: 1_300_000, variacion: -1.5, pctCumplimiento: 98.5 },
    { periodo: 'Ago 2024', ingresoReal: 1_350_000, ingresoPlaneado: 1_320_000, variacion: 2.3,  pctCumplimiento: 102.3 },
    { periodo: 'Sep 2024', ingresoReal: 1_310_000, ingresoPlaneado: 1_380_000, variacion: -5.1, pctCumplimiento: 94.9 },
    { periodo: 'Oct 2024', ingresoReal: 1_420_000, ingresoPlaneado: 1_400_000, variacion: 1.4,  pctCumplimiento: 101.4 },
    { periodo: 'Nov 2024', ingresoReal: 1_460_000, ingresoPlaneado: 1_450_000, variacion: 0.7,  pctCumplimiento: 100.7 },
    { periodo: 'Dic 2024', ingresoReal: 1_390_000, ingresoPlaneado: 1_480_000, variacion: -6.1, pctCumplimiento: 93.9 },
    { periodo: 'Ene 2025', ingresoReal: 1_530_000, ingresoPlaneado: 1_480_000, variacion: 3.4,  pctCumplimiento: 103.4 },
    { periodo: 'Feb 2025', ingresoReal: 1_575_000, ingresoPlaneado: 1_520_000, variacion: 3.6,  pctCumplimiento: 103.6 },
    { periodo: 'Mar 2025', ingresoReal: 1_600_000, ingresoPlaneado: 1_600_000, variacion: 0,    pctCumplimiento: 100 },
    { periodo: 'Abr 2025', ingresoReal: 1_575_000, ingresoPlaneado: 1_650_000, variacion: -4.5, pctCumplimiento: 95.5 },
    { periodo: 'May 2025', ingresoReal: 1_620_000, ingresoPlaneado: 1_700_000, variacion: -4.7, pctCumplimiento: 95.3 },
    { periodo: 'Jun 2025', ingresoReal: 1_685_000, ingresoPlaneado: 1_750_000, variacion: -3.7, pctCumplimiento: 96.3 },
  ],
};

export const MOCK_TOP_CLIENTES: TopClientesHorasResponseDto = {
  clientes: [
    { cliente: 'Bancolombia',     horas: 11_240, pctParticipacion: 21.6 },
    { cliente: 'Davivienda',      horas: 8_350,  pctParticipacion: 16.0 },
    { cliente: 'Claro Colombia',  horas: 6_820,  pctParticipacion: 13.1 },
    { cliente: 'EPM',             horas: 5_940,  pctParticipacion: 11.4 },
    { cliente: 'Grupo Éxito',     horas: 5_110,  pctParticipacion: 9.8  },
    { cliente: 'Suramericana',    horas: 4_380,  pctParticipacion: 8.4  },
    { cliente: 'ETB',             horas: 3_920,  pctParticipacion: 7.5  },
    { cliente: 'Nutresa',         horas: 3_460,  pctParticipacion: 6.6  },
    { cliente: 'Cementos Argos',  horas: 2_180,  pctParticipacion: 4.2  },
    { cliente: 'Avianca',         horas: 740,    pctParticipacion: 1.4  },
  ],
};

export const MOCK_TREEMAP: TreemapAreaResponseDto = {
  areas: [
    { area: 'Desarrollo Backend', horas: 18_240, cantidadProyectos: 12, pctParticipacion: 35.0 },
    { area: 'QA & Testing',       horas: 10_430, cantidadProyectos: 10, pctParticipacion: 20.0 },
    { area: 'DevOps',             horas: 8_340,  cantidadProyectos: 8,  pctParticipacion: 16.0 },
    { area: 'Analytics & BI',     horas: 7_300,  cantidadProyectos: 6,  pctParticipacion: 14.0 },
    { area: 'Arquitectura',       horas: 5_200,  cantidadProyectos: 5,  pctParticipacion: 10.0 },
    { area: 'UX Design',          horas: 2_630,  cantidadProyectos: 4,  pctParticipacion: 5.0  },
  ],
};

export const MOCK_SCATTER: ScatterBurbujaResponseDto = {
  tarifaPromedio: 54.6,
  clientes: [
    { cliente: 'Bancolombia',    area: 'Financial Services', tarifaEntrega: 72, gmPct: 34, ingreso: 810_000 },
    { cliente: 'Davivienda',     area: 'Financial Services', tarifaEntrega: 68, gmPct: 31, ingreso: 568_000 },
    { cliente: 'Claro Colombia', area: 'Telco & Media',      tarifaEntrega: 55, gmPct: 25, ingreso: 375_000 },
    { cliente: 'EPM',            area: 'Energy & Utilities', tarifaEntrega: 60, gmPct: 29, ingreso: 356_400 },
    { cliente: 'Grupo Éxito',    area: 'Retail & Consumer',  tarifaEntrega: 47, gmPct: 21, ingreso: 240_170 },
    { cliente: 'Suramericana',   area: 'Financial Services', tarifaEntrega: 65, gmPct: 28, ingreso: 284_700 },
    { cliente: 'ETB',            area: 'Telco & Media',      tarifaEntrega: 43, gmPct: 18, ingreso: 168_560 },
    { cliente: 'Nutresa',        area: 'Manufacturing',      tarifaEntrega: 50, gmPct: 23, ingreso: 173_000 },
    { cliente: 'Cementos Argos', area: 'Manufacturing',      tarifaEntrega: 38, gmPct: 14, ingreso: 82_840  },
    { cliente: 'Avianca',        area: 'Retail & Consumer',  tarifaEntrega: 35, gmPct: 11, ingreso: 25_900  },
  ],
};

export const MOCK_HEATMAP: HeatmapGmResponseDto = {
  celdas: [
    { cliente: 'Bancolombia',    periodo: 'Ene 2025', gmPct: 35.2, ingreso: 135_000, costo: 87_480 },
    { cliente: 'Bancolombia',    periodo: 'Feb 2025', gmPct: 33.8, ingreso: 140_000, costo: 92_680 },
    { cliente: 'Bancolombia',    periodo: 'Mar 2025', gmPct: 34.5, ingreso: 138_000, costo: 90_390 },
    { cliente: 'Bancolombia',    periodo: 'Abr 2025', gmPct: 32.1, ingreso: 130_000, costo: 88_270 },
    { cliente: 'Bancolombia',    periodo: 'May 2025', gmPct: 36.0, ingreso: 145_000, costo: 92_800 },
    { cliente: 'Bancolombia',    periodo: 'Jun 2025', gmPct: 34.9, ingreso: 142_000, costo: 92_442 },
    { cliente: 'Davivienda',     periodo: 'Ene 2025', gmPct: 30.1, ingreso: 95_000,  costo: 66_405 },
    { cliente: 'Davivienda',     periodo: 'Feb 2025', gmPct: 31.5, ingreso: 98_000,  costo: 67_130 },
    { cliente: 'Davivienda',     periodo: 'Mar 2025', gmPct: 29.8, ingreso: 92_000,  costo: 64_584 },
    { cliente: 'Davivienda',     periodo: 'Abr 2025', gmPct: 28.3, ingreso: 88_000,  costo: 63_096 },
    { cliente: 'Davivienda',     periodo: 'May 2025', gmPct: 32.0, ingreso: 100_000, costo: 68_000 },
    { cliente: 'Davivienda',     periodo: 'Jun 2025', gmPct: 31.1, ingreso: 96_000,  costo: 66_144 },
    { cliente: 'Claro Colombia', periodo: 'Ene 2025', gmPct: 24.5, ingreso: 65_000,  costo: 49_075 },
    { cliente: 'Claro Colombia', periodo: 'Feb 2025', gmPct: 22.1, ingreso: 60_000,  costo: 46_740 },
    { cliente: 'Claro Colombia', periodo: 'Mar 2025', gmPct: 25.8, ingreso: 68_000,  costo: 50_456 },
    { cliente: 'Claro Colombia', periodo: 'Abr 2025', gmPct: 24.0, ingreso: 63_000,  costo: 47_880 },
    { cliente: 'Claro Colombia', periodo: 'May 2025', gmPct: 26.2, ingreso: 70_000,  costo: 51_660 },
    { cliente: 'Claro Colombia', periodo: 'Jun 2025', gmPct: 23.5, ingreso: 62_000,  costo: 47_430 },
    { cliente: 'EPM',            periodo: 'Ene 2025', gmPct: 28.7, ingreso: 60_000,  costo: 42_780 },
    { cliente: 'EPM',            periodo: 'Feb 2025', gmPct: 29.4, ingreso: 62_000,  costo: 43_772 },
    { cliente: 'EPM',            periodo: 'Mar 2025', gmPct: 27.5, ingreso: 58_000,  costo: 42_050 },
    { cliente: 'EPM',            periodo: 'Abr 2025', gmPct: 30.2, ingreso: 65_000,  costo: 45_370 },
    { cliente: 'EPM',            periodo: 'May 2025', gmPct: 28.1, ingreso: 59_000,  costo: 42_421 },
    { cliente: 'EPM',            periodo: 'Jun 2025', gmPct: 31.0, ingreso: 67_000,  costo: 46_230 },
    { cliente: 'Grupo Éxito',    periodo: 'Ene 2025', gmPct: 20.3, ingreso: 42_000,  costo: 33_474 },
    { cliente: 'Grupo Éxito',    periodo: 'Feb 2025', gmPct: 18.7, ingreso: 38_000,  costo: 30_894 },
    { cliente: 'Grupo Éxito',    periodo: 'Mar 2025', gmPct: 21.5, ingreso: 44_000,  costo: 34_540 },
    { cliente: 'Grupo Éxito',    periodo: 'Abr 2025', gmPct: 19.8, ingreso: 40_000,  costo: 32_080 },
    { cliente: 'Grupo Éxito',    periodo: 'May 2025', gmPct: 22.1, ingreso: 46_000,  costo: 35_834 },
    { cliente: 'Grupo Éxito',    periodo: 'Jun 2025', gmPct: 20.9, ingreso: 43_000,  costo: 34_013 },
  ],
};

export const MOCK_HISTORIAL: PagedResult<ConsolidacionHistorialDto> = {
  items: [
    { id: 3, fechaInicio: '2025-05-14T10:22:00', fechaFin: '2025-05-14T10:22:48', estado: 'Exitoso', totalRegistros: 5840, registrosExitosos: 5840, registrosFallidos: 0, iniciadoPor: 'julian.meza@softtek.com' },
    { id: 2, fechaInicio: '2025-05-07T09:15:00', fechaFin: '2025-05-07T09:15:52', estado: 'Exitoso', totalRegistros: 5710, registrosExitosos: 5690, registrosFallidos: 20, iniciadoPor: 'julian.meza@softtek.com' },
    { id: 1, fechaInicio: '2025-04-30T08:45:00', fechaFin: '2025-04-30T08:46:10', estado: 'Exitoso', totalRegistros: 5620, registrosExitosos: 5620, registrosFallidos: 0, iniciadoPor: 'julian.meza@softtek.com' },
  ],
  totalRegistros: 3,
  pagina: 1,
  tamañoPagina: 10,
  totalPaginas: 1,
};

export const MOCK_ESTADO_COMPLETADO: ConsolidacionEstadoDto = {
  consolidacionId: 99,
  estado: 'Exitoso',
  porcentajeAvance: 100,
  totalRegistros: 5840,
  registrosExitosos: 5840,
  registrosFallidos: 0,
  fechaInicio: new Date().toISOString(),
  fechaFin: new Date().toISOString(),
  fuentes: [
    { archivo: 'GR55.xlsx',             estado: 'Exitoso', registrosProcesados: 1820, totalRegistros: 1820, error: null },
    { archivo: 'Horas.xlsx',            estado: 'Exitoso', registrosProcesados: 2100, totalRegistros: 2100, error: null },
    { archivo: 'Planeación.xlsx',       estado: 'Exitoso', registrosProcesados: 1200, totalRegistros: 1200, error: null },
    { archivo: 'TipoCambio.xlsx',       estado: 'Exitoso', registrosProcesados: 12,   totalRegistros: 12,   error: null },
    { archivo: 'MaestroRef.xlsx',       estado: 'Exitoso', registrosProcesados: 708,  totalRegistros: 708,  error: null },
  ],
  errores: null,
};
