import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  FiltrosParams,
  FiltrosValoresDto,
  BarrasApiladasResponseDto,
  PlanVsRealResponseDto,
  TendenciaResponseDto,
  TopClientesHorasResponseDto,
  TreemapAreaResponseDto,
  ScatterBurbujaResponseDto,
  HeatmapGmResponseDto,
} from '../models/graficas.models';

@Injectable({ providedIn: 'root' })
export class GraficasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/graficas`;

  private buildParams(filters: FiltrosParams): HttpParams {
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

  filtrosValores(filters: FiltrosParams = {}): Observable<FiltrosValoresDto> {
    return this.http
      .get<ApiResponse<FiltrosValoresDto>>(`${this.base}/filtros/valores`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  barrasApiladas(filters: FiltrosParams = {}, agruparPor?: string): Observable<BarrasApiladasResponseDto> {
    let params = this.buildParams(filters);
    if (agruparPor) params = params.set('agruparPor', agruparPor);
    return this.http
      .get<ApiResponse<BarrasApiladasResponseDto>>(`${this.base}/barras-apiladas`, { params })
      .pipe(map(r => r.data));
  }

  planVsReal(filters: FiltrosParams = {}): Observable<PlanVsRealResponseDto> {
    return this.http
      .get<ApiResponse<PlanVsRealResponseDto>>(`${this.base}/plan-vs-real`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  tendencia(filters: FiltrosParams = {}): Observable<TendenciaResponseDto> {
    return this.http
      .get<ApiResponse<TendenciaResponseDto>>(`${this.base}/tendencia`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  topClientesHoras(filters: FiltrosParams = {}): Observable<TopClientesHorasResponseDto> {
    return this.http
      .get<ApiResponse<TopClientesHorasResponseDto>>(`${this.base}/top-clientes-horas`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  treemapArea(filters: FiltrosParams = {}): Observable<TreemapAreaResponseDto> {
    return this.http
      .get<ApiResponse<TreemapAreaResponseDto>>(`${this.base}/treemap-area`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  scatterBurbuja(filters: FiltrosParams = {}): Observable<ScatterBurbujaResponseDto> {
    return this.http
      .get<ApiResponse<ScatterBurbujaResponseDto>>(`${this.base}/scatter-burbuja`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  heatmapGm(filters: FiltrosParams = {}): Observable<HeatmapGmResponseDto> {
    return this.http
      .get<ApiResponse<HeatmapGmResponseDto>>(`${this.base}/heatmap-gm`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  descargar(filters: FiltrosParams = {}): Observable<Blob> {
    return this.http.get(`${this.base}/descargar`, {
      params: this.buildParams(filters),
      responseType: 'blob',
    });
  }
}
