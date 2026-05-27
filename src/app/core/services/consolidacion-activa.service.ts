import { Injectable, inject, signal, computed } from '@angular/core';
import { Subscription, timer, forkJoin, throwError } from 'rxjs';
import { switchMap, tap, take, catchError, filter } from 'rxjs/operators';
import { ConsolidacionService } from './consolidacion.service';
import { NotificationService } from './notification.service';
import { ConsolidacionEstadoDto, FuenteEstadoDto } from '../models/consolidacion.models';

const POLL_INTERVAL_MS = 2_000;
const TERMINAL_ESTADOS = ['Exitoso', 'ParcialmenteExitoso', 'Fallido'] as const;
type TerminalEstado = typeof TERMINAL_ESTADOS[number];

export interface ArchivoParaConsolidar {
  key: string;
  label: string;
  endpoint: string;
  file: File;
}

@Injectable({ providedIn: 'root' })
export class ConsolidacionActivaService {
  private readonly svc    = inject(ConsolidacionService);
  private readonly notify = inject(NotificationService);
  private pollSub?: Subscription;

  slotLabels     = signal<{ key: string; label: string }[]>([]);
  showModal      = signal(false);
  estado         = signal<ConsolidacionEstadoDto | null>(null);
  uploading      = signal(false);
  uploadProgreso = signal<Record<string, { percent: number; done: boolean; error: boolean }>>({});
  uploadErrorMsg = signal<string | null>(null);

  isTerminal = computed(() => {
    const e = this.estado()?.estado;
    return !!e && (TERMINAL_ESTADOS as readonly string[]).includes(e);
  });
  isExitoso = computed(() => this.estado()?.estado === 'Exitoso');
  isParcial = computed(() => this.estado()?.estado === 'ParcialmenteExitoso');
  isFallido = computed(() => this.estado()?.estado === 'Fallido');

  hayProcesoActivo = computed(() =>
    !this.isTerminal() && (this.estado() !== null || this.uploading())
  );

  statsTotal = computed(() => {
    if (this.isTerminal()) return this.estado()?.totalRegistros ?? 0;
    return this.estado()?.fuentes?.length ?? 0;
  });
  statsExitosos = computed(() => {
    if (this.isTerminal()) return this.estado()?.registrosExitosos ?? 0;
    return this.estado()?.fuentes?.filter(f => f.estado === 'Exitoso').length ?? 0;
  });
  statsFallidos = computed(() => {
    if (this.isTerminal()) return this.estado()?.registrosFallidos ?? 0;
    return this.estado()?.fuentes?.filter(f =>
      f.estado === 'Fallido' && !this.fuenteEsAdvertencia(f)
    ).length ?? 0;
  });

  modalTitulo = computed(() => {
    if (this.isExitoso()) return 'Consolidación completada';
    if (this.isParcial()) return 'Completado con advertencias';
    if (this.isFallido()) return 'Error en la consolidación';
    const fuentes = this.estado()?.fuentes;
    if (fuentes?.length) {
      const completadas = fuentes.filter(f => f.estado === 'Exitoso' || f.estado === 'Fallido').length;
      return `Procesando archivos… (${completadas}/${fuentes.length})`;
    }
    return 'Procesando archivos…';
  });

  textoProgreso = computed(() => {
    if (this.isTerminal()) return null;
    return 'Este proceso puede tomar varios minutos';
  });

  iniciarConsolidacion(archivos: ArchivoParaConsolidar[]) {
    this.slotLabels.set(archivos.map(a => ({ key: a.key, label: a.label })));
    this.estado.set(null);
    this.showModal.set(true);

    const progresoInicial: Record<string, { percent: number; done: boolean; error: boolean }> = {};
    archivos.forEach(a => { progresoInicial[a.key] = { percent: 0, done: false, error: false }; });
    this.uploadProgreso.set(progresoInicial);
    this.uploadErrorMsg.set(null);
    this.uploading.set(true);

    const uploads = archivos.map(({ key, endpoint, file }) =>
      this.svc.subirArchivo(endpoint, file).pipe(
        tap(event => {
          if (event.type === 'progress') {
            this.uploadProgreso.update(p => ({ ...p, [key]: { ...p[key], percent: event.percent } }));
          } else if (event.type === 'done') {
            this.uploadProgreso.update(p => ({ ...p, [key]: { percent: 100, done: true, error: false } }));
          }
        }),
        filter(e => e.type === 'done'),
        take(1),
        catchError(err => {
          this.uploadProgreso.update(p => ({ ...p, [key]: { ...p[key], error: true } }));
          return throwError(() => err);
        }),
      )
    );

    forkJoin(uploads).subscribe({
      next: () => {
        this.svc.iniciar().subscribe({
          next: (data) => {
            this.uploading.set(false);
            this.estado.set({
              consolidacionId:   data.consolidacionId,
              estado:            'Procesando',
              porcentajeAvance:  0,
              totalRegistros:    0,
              registrosExitosos: 0,
              registrosFallidos: 0,
              fechaInicio:       data.fechaInicio,
              fechaFin:          null,
              fuentes:           null,
              errores:           null,
            });
            this.startPolling(data.consolidacionId);
          },
          error: (err) => {
            console.error('[iniciar error]', err);
            this.uploading.set(false);
            this.showModal.set(false);
          },
        });
      },
      error: (err) => {
        console.error('[upload error]', err);
        this.uploading.set(false);
        const status = err?.status ?? err?.error?.status;
        if (status === 409) {
          this.uploadErrorMsg.set('Hay una consolidación en progreso. Espera a que termine antes de iniciar una nueva.');
        } else if (status === 400) {
          this.uploadErrorMsg.set('Uno o más archivos no son válidos. Asegúrate de subir archivos .xlsx.');
        } else {
          this.uploadErrorMsg.set('Error al subir los archivos. Verifica tu conexión e intenta nuevamente.');
        }
      },
    });
  }

  startPolling(id: number) {
    this.stopPolling();
    this.pollSub = timer(500, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.svc.estado(id))
    ).subscribe({
      next: (data) => {
        this.estado.set(data);
        const e = data.estado ?? '';
        if ((TERMINAL_ESTADOS as readonly string[]).includes(e)) {
          this.stopPolling();
          this._notificarTermino(e as TerminalEstado);
        }
      },
    });
  }

  stopPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  minimizarModal() {
    this.showModal.set(false);
  }

  closeModal() {
    this.stopPolling();
    this.showModal.set(false);
    this.estado.set(null);
    this.uploadErrorMsg.set(null);
  }

  clearEstado() {
    this.estado.set(null);
    this.uploadErrorMsg.set(null);
  }

  fuentePct(fuente: FuenteEstadoDto): number | null {
    if (fuente.estado === 'Exitoso' || fuente.estado === 'Fallido') return 100;
    if (fuente.estado !== 'Procesando') return 0;
    const total = fuente.totalRegistros ?? 0;
    if (total > 0) return Math.min(100, Math.round((fuente.registrosProcesados / total) * 100));
    return null;
  }

  fuenteEsAdvertencia(fuente: FuenteEstadoDto): boolean {
    return fuente.estado === 'Fallido' && this.estado()?.estado !== 'Fallido';
  }

  private _notificarTermino(estado: TerminalEstado) {
    if (estado === 'Exitoso') {
      this.notify.success('Consolidación completada exitosamente.');
    } else if (estado === 'ParcialmenteExitoso') {
      this.notify.warning('Consolidación completada con advertencias. Revisa el detalle.');
    } else {
      this.notify.error('La consolidación falló. Revisa el detalle para más información.');
    }
  }
}
