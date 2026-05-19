import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { KpisDto } from '../models/kpis.models';
import { FiltrosParams } from '../models/graficas.models';
import { MOCK_KPIS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class KpisMockService {
  getKpis(_filters: FiltrosParams = {}): Observable<KpisDto> {
    return of(MOCK_KPIS).pipe(delay(300));
  }
}
