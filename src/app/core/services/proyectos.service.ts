import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api.models';
import { ProyectoDto, ProyectosFilterParams } from '../models/proyectos.models';
import { KpisDto } from '../models/kpis.models';
import { GraficoBarrasApiladasDto, GraficoPlanVsRealDto } from '../models/graficas.models';

@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Proyectos`;

  private buildParams(filters: ProyectosFilterParams): HttpParams {
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

  getProyectos(filters: ProyectosFilterParams = {}): Observable<PagedResult<ProyectoDto>> {
    return this.http
      .get<ApiResponse<PagedResult<ProyectoDto>>>(this.base, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getKpis(filters: ProyectosFilterParams = {}): Observable<KpisDto> {
    return this.http
      .get<ApiResponse<KpisDto>>(`${this.base}/kpis`, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }

  getBarrasApiladas(filters: ProyectosFilterParams = {}): Observable<GraficoBarrasApiladasDto> {
    return this.http
      .get<ApiResponse<GraficoBarrasApiladasDto>>(`${this.base}/graficos/barras-apiladas`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  getPlanVsReal(filters: ProyectosFilterParams = {}): Observable<GraficoPlanVsRealDto> {
    return this.http
      .get<ApiResponse<GraficoPlanVsRealDto>>(`${this.base}/graficos/plan-vs-real`, {
        params: this.buildParams(filters),
      })
      .pipe(map(r => r.data));
  }

  descargar(filters: ProyectosFilterParams = {}): Observable<Blob> {
    return this.http.get(`${this.base}/descargar`, {
      params: this.buildParams(filters),
      responseType: 'blob',
    });
  }
}
