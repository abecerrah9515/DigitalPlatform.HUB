export interface KpiItemDto {
  valor: number;
  unidad: string | null;
  semaforo: string | null;
  tendencia: string | null;
  badgeTexto: string | null;
  subtitulo: string | null;
}

export interface KpisDto {
  ingresoTotalReal: KpiItemDto;
  margenGM: KpiItemDto;
  horasEntregadas: KpiItemDto;
  tarifaEntregaPromedio: KpiItemDto;
  cumplimientoIngresosPlan: KpiItemDto;
}
