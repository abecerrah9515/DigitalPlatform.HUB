import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PnlRespuesta, PnlFiltrosOpciones, PnlFiltros } from '../models/pnl.model';
import { environment } from '../../../environments/environment';

const FILTROS_DEFAULT: PnlFiltrosOpciones = {
  clientes: [],
  proyectos: [],
  verticales: [],
  anios: [2025, 2026],
};

const RESPUESTA_VACIA: PnlRespuesta = {
  requiereAnio: false,
  moneda: 'COP',
  anio: null,
  nodos: [],
};

@Injectable({ providedIn: 'root' })
export class PnlService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/pyl`;

  getFiltros(): Observable<PnlFiltrosOpciones> {
    return this.http.get<any>(`${this.base}/filtros`).pipe(
      map(r => {
        const d = r.data ?? r;
        return {
          clientes:   d.clientes   ?? [],
          proyectos:  d.proyectos  ?? [],
          verticales: d.verticales ?? [],
          anios: d['años'] ?? d.anios ?? FILTROS_DEFAULT.anios,
        };
      }),
      catchError(() => of(FILTROS_DEFAULT)),
    );
  }

  getDatos(f: PnlFiltros): Observable<PnlRespuesta> {
    let params = new HttpParams();
    if (f.anio !== null) params = params.set('año', String(f.anio));
    params = params.set('moneda', f.moneda);
    f.clientes.forEach(c  => { params = params.append('cliente',  c); });
    f.proyectos.forEach(p => { params = params.append('proyecto', p); });
    f.verticales.forEach(v => { params = params.append('vertical', v); });

    return this.http.get<any>(`${this.base}`, { params }).pipe(
      map(r => {
        const d = r.data ?? r;
        return {
          requiereAnio: d['requiereAño'] ?? d.requiereAnio ?? false,
          moneda: d.moneda ?? 'COP',
          anio:   d['año'] ?? d.anio ?? null,
          nodos:  d.nodos ?? [],
        };
      }),
      catchError(() => of(RESPUESTA_VACIA)),
    );
  }
}
