import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { KpisDto } from '../models/kpis.models';
import { FiltrosParams } from '../models/graficas.models';

@Injectable({ providedIn: 'root' })
export class KpisService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/kpis`;

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

  getKpis(filters: FiltrosParams = {}): Observable<KpisDto> {
    return this.http
      .get<ApiResponse<KpisDto>>(this.base, { params: this.buildParams(filters) })
      .pipe(map(r => r.data));
  }
}
