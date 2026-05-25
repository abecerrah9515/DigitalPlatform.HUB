import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        notify.error('Acceso no autorizado. Verifica la API Key.');
      } else if (err.status === 500) {
        notify.error(err.error?.message ?? 'Error interno del servidor.');
      } else if (err.status === 0) {
        notify.error('No se pudo conectar con el servidor.');
      }
      return throwError(() => err);
    }),
  );
};
