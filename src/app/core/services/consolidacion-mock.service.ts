import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PagedResult } from '../models/api.models';
import { ConsolidacionIniciadaDto, ConsolidacionEstadoDto, ConsolidacionHistorialDto, ConsolidacionUploadParams } from '../models/consolidacion.models';
import { MOCK_HISTORIAL, MOCK_ESTADO_COMPLETADO } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ConsolidacionMockService {
  upload(_params: ConsolidacionUploadParams): Observable<ConsolidacionIniciadaDto> {
    return of({ consolidacionId: 99, fechaInicio: new Date().toISOString(), estado: 'Procesando' }).pipe(delay(800));
  }
  estado(_id: number): Observable<ConsolidacionEstadoDto> {
    return of(MOCK_ESTADO_COMPLETADO).pipe(delay(500));
  }
  historial(_pagina = 1, _tamañoPagina = 10): Observable<PagedResult<ConsolidacionHistorialDto>> {
    return of(MOCK_HISTORIAL).pipe(delay(300));
  }
}
