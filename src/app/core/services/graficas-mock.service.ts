import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { FiltrosParams, FiltrosValoresDto, BarrasApiladasResponseDto, PlanVsRealResponseDto, TendenciaResponseDto, TopClientesHorasResponseDto, TreemapAreaResponseDto, ScatterBurbujaResponseDto, HeatmapGmResponseDto } from '../models/graficas.models';
import { MOCK_FILTROS_VALORES, MOCK_BARRAS_APILADAS, MOCK_PLAN_VS_REAL, MOCK_TENDENCIA, MOCK_TOP_CLIENTES, MOCK_TREEMAP, MOCK_SCATTER, MOCK_HEATMAP } from './mock-data';

@Injectable({ providedIn: 'root' })
export class GraficasMockService {
  filtrosValores(_filters: FiltrosParams = {}): Observable<FiltrosValoresDto> {
    return of(MOCK_FILTROS_VALORES).pipe(delay(300));
  }
  barrasApiladas(_filters: FiltrosParams = {}, _agruparPor?: string): Observable<BarrasApiladasResponseDto> {
    return of(MOCK_BARRAS_APILADAS).pipe(delay(400));
  }
  planVsReal(_filters: FiltrosParams = {}): Observable<PlanVsRealResponseDto> {
    return of(MOCK_PLAN_VS_REAL).pipe(delay(400));
  }
  tendencia(_filters: FiltrosParams = {}): Observable<TendenciaResponseDto> {
    return of(MOCK_TENDENCIA).pipe(delay(400));
  }
  topClientesHoras(_filters: FiltrosParams = {}): Observable<TopClientesHorasResponseDto> {
    return of(MOCK_TOP_CLIENTES).pipe(delay(350));
  }
  treemapArea(_filters: FiltrosParams = {}): Observable<TreemapAreaResponseDto> {
    return of(MOCK_TREEMAP).pipe(delay(350));
  }
  scatterBurbuja(_filters: FiltrosParams = {}): Observable<ScatterBurbujaResponseDto> {
    return of(MOCK_SCATTER).pipe(delay(350));
  }
  heatmapGm(_filters: FiltrosParams = {}): Observable<HeatmapGmResponseDto> {
    return of(MOCK_HEATMAP).pipe(delay(350));
  }
  descargar(_filters: FiltrosParams = {}): Observable<Blob> {
    return of(new Blob(['mock'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).pipe(delay(500));
  }
}
