import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api.models';
import {
  ConsolidacionIniciadaDto,
  ConsolidacionEstadoDto,
  ConsolidacionHistorialDto,
  ConsolidacionUploadParams,
} from '../models/consolidacion.models';

export type UploadEvent =
  | { type: 'progress'; percent: number }
  | { type: 'done'; data: ConsolidacionIniciadaDto };

@Injectable({ providedIn: 'root' })
export class ConsolidacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Consolidacion`;

  upload(params: ConsolidacionUploadParams): Observable<UploadEvent> {
    const fd = new FormData();
    fd.append('gr55', params.gr55);
    fd.append('horas', params.horas);
    fd.append('planeacion', params.planeacion);
    fd.append('tipoCambio', params.tipoCambio);
    fd.append('maestroReferencias', params.maestroReferencias);

    const req = new HttpRequest('POST', `${this.base}/upload`, fd, { reportProgress: true });

    return this.http.request<ApiResponse<ConsolidacionIniciadaDto>>(req).pipe(
      map((event): UploadEvent | null => {
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total
            ? Math.round(100 * event.loaded / event.total)
            : 0;
          return { type: 'progress', percent };
        }
        if (event.type === HttpEventType.Response) {
          return { type: 'done', data: event.body!.data };
        }
        return null;
      }),
      filter((e): e is UploadEvent => e !== null),
    );
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
