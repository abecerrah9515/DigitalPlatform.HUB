import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { apiKeyInterceptor } from './core/interceptors/api-key.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GraficasService } from './core/services/graficas.service';
import { GraficasMockService } from './core/services/graficas-mock.service';
import { KpisService } from './core/services/kpis.service';
import { KpisMockService } from './core/services/kpis-mock.service';
import { ConsolidacionService } from './core/services/consolidacion.service';
import { ConsolidacionMockService } from './core/services/consolidacion-mock.service';

const mockProviders = [
  { provide: GraficasService,      useClass: GraficasMockService },
  { provide: KpisService,          useClass: KpisMockService },
  { provide: ConsolidacionService, useClass: ConsolidacionMockService },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiKeyInterceptor, errorInterceptor])),
    ...(environment.useMock ? mockProviders : []),
  ]
};
