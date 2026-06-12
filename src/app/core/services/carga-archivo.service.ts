import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { CargaArchivoDto } from '../models/carga-archivo.models';

@Injectable({ providedIn: 'root' })
export class CargaArchivoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/CargaArchivo`;

  getHistorial(): Observable<CargaArchivoDto[]> {
    return this.http
      .get<ApiResponse<CargaArchivoDto[]>>(`${this.base}/historial`)
      .pipe(map(r => r.data));
  }

  upload(tipo: string, file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http
      .post<ApiResponse<string>>(`${this.base}/upload/${tipo}`, fd)
      .pipe(
        map(r => {
          if (!r.success) throw new Error(r.message ?? 'Error al subir el archivo');
          return r.data;
        }),
        catchError(err => throwError(() => err))
      );
  }
}
