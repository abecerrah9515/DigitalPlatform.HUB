export interface ConsolidacionIniciadaDto {
  consolidacionId: number;
  fechaInicio: string;
  estado: string | null;
}

export interface FuenteEstadoDto {
  archivo: string | null;
  estado: string | null;
  registrosProcesados: number;
  error: string | null;
}

export interface ConsolidacionEstadoDto {
  consolidacionId: number;
  estado: string | null;
  porcentajeAvance: number;
  totalRegistros: number;
  registrosExitosos: number;
  registrosFallidos: number;
  fechaInicio: string;
  fechaFin: string | null;
  fuentes: FuenteEstadoDto[] | null;
  errores: string[] | null;
}

export interface ConsolidacionHistorialDto {
  id: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string | null;
  totalRegistros: number;
  registrosExitosos: number;
  registrosFallidos: number;
  iniciadoPor: string | null;
}

export interface ConsolidacionUploadParams {
  gr55: File;
  horas: File;
  planeacion: File;
  tipoCambio: File;
  maestroReferencias: File;
}
