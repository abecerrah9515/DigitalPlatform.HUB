import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PnlLineaDto, PnlFiltrosOpciones, PnlFiltros } from '../models/pnl.model';
import { environment } from '../../../environments/environment';

const FILTROS_DEFAULT: PnlFiltrosOpciones = {
  clientes: [],
  proyectos: [],
  verticales: [],
  anios: [2026],
};

@Injectable({ providedIn: 'root' })
export class PnlService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/pnl`;

  getFiltros(): Observable<PnlFiltrosOpciones> {
    return this.http.get<PnlFiltrosOpciones>(`${this.base}/filtros`).pipe(
      catchError(() => of(FILTROS_DEFAULT)),
    );
  }

  getDatos(f: PnlFiltros): Observable<PnlLineaDto[]> {
    let params = new HttpParams();
    if (f.anio !== null) params = params.set('Anio', String(f.anio));
    f.clientes.forEach(c  => { params = params.append('Cliente',  c); });
    f.proyectos.forEach(p => { params = params.append('Proyecto', p); });
    f.verticales.forEach(v => { params = params.append('Vertical', v); });
    return this.http.get<PnlLineaDto[]>(`${this.base}/datos`, { params });
  }
}
