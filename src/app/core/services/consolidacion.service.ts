import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api.models';
import {
  ConsolidacionIniciadaDto,
  ConsolidacionEstadoDto,
  ConsolidacionHistorialDto,
  ConsolidacionUploadParams,
} from '../models/consolidacion.models';

@Injectable({ providedIn: 'root' })
export class ConsolidacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Consolidacion`;

  upload(params: ConsolidacionUploadParams): Observable<ConsolidacionIniciadaDto> {
    const fd = new FormData();
    fd.append('gr55', params.gr55);
    fd.append('horas', params.horas);
    fd.append('planeacion', params.planeacion);
    fd.append('tipoCambio', params.tipoCambio);
    fd.append('maestroReferencias', params.maestroReferencias);

    return this.http
      .post<ApiResponse<ConsolidacionIniciadaDto>>(`${this.base}/upload`, fd)
      .pipe(map(r => r.data));
  }

  estado(id: number): Observable<ConsolidacionEstadoDto> {
    return this.http
      .get<ApiResponse<ConsolidacionEstadoDto>>(`${this.base}/${id}/estado`)
      .pipe(map(r => r.data));
  }

  historial(pagina = 1, tamañoPagina = 10): Observable<PagedResult<ConsolidacionHistorialDto>> {
    return this.http
      .get<ApiResponse<PagedResult<ConsolidacionHistorialDto>>>(`${this.base}/historial`, {
        params: { pagina: pagina.toString(), tamañoPagina: tamañoPagina.toString() },
      })
      .pipe(map(r => r.data));
  }
}
