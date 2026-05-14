import { Component, signal, computed, inject, OnDestroy, NgZone } from '@angular/core';
import { Subscription, timer, race } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

const POLL_INTERVAL_MS  = 2_000;
const TIMEOUT_MS        = 5 * 60 * 1_000;
const TERMINAL_ESTADOS  = ['Exitoso', 'ParcialmenteExitoso', 'Fallido'] as const;
type  TerminalEstado    = typeof TERMINAL_ESTADOS[number];
import { ConsolidacionService } from '../../../core/services/consolidacion.service';
import { ConsolidacionEstadoDto, ConsolidacionHistorialDto } from '../../../core/models/consolidacion.models';
import { PagedResult } from '../../../core/models/api.models';

interface FileSlot {
  key: string;
  label: string;
  file: File | null;
  dragOver: boolean;
}

@Component({
  selector: 'app-consolidar',
  standalone: true,
  template: `
    <!-- Progress Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              @if (isTerminal()) {
                @if (isExitoso()) {
                  <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                } @else if (isParcial()) {
                  <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  </div>
                } @else {
                  <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </div>
                }
              } @else {
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              }
              <div>
                <h3 class="text-base font-semibold text-slate-900">
                  @if (uploading()) { Subiendo archivos… }
                  @else { {{ modalTitulo() }} }
                </h3>
                @if (uploading()) {
                  <p class="text-sm text-slate-500 mt-0.5">Transfiriendo los 5 archivos al servidor</p>
                } @else if (textoProgreso()) {
                  <p class="text-sm text-slate-500 mt-0.5">{{ textoProgreso() }}</p>
                }
              </div>
            </div>
          </div>

          <div class="px-6 py-5 space-y-4">
            <!-- Barra de progreso -->
            <div>
              <div class="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progreso general</span>
                <span class="font-medium">{{ estado()?.porcentajeAvance ?? 0 }}%</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  [class.bg-blue-500]="!isTerminal()"
                  [class.bg-green-500]="isExitoso()"
                  [class.bg-yellow-400]="isParcial()"
                  [class.bg-red-500]="isFallido()"
                  [style.width.%]="estado()?.porcentajeAvance ?? 0"
                ></div>
              </div>
            </div>

            <!-- Stats -->
            @if ((estado()?.totalRegistros ?? 0) > 0 || isTerminal()) {
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-slate-900">{{ estado()?.totalRegistros ?? 0 }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">Total</div>
                </div>
                <div class="bg-green-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-green-700">{{ estado()?.registrosExitosos ?? 0 }}</div>
                  <div class="text-xs text-green-600 mt-0.5">Exitosos</div>
                </div>
                <div class="bg-red-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-red-700">{{ estado()?.registrosFallidos ?? 0 }}</div>
                  <div class="text-xs text-red-600 mt-0.5">Fallidos</div>
                </div>
              </div>
            }

            <!-- Fuentes -->
            @if ((estado()?.fuentes?.length ?? 0) > 0) {
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-slate-500">Estado por archivo</p>
                @for (fuente of estado()!.fuentes; track fuente.archivo) {
                  <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50">
                    @if (fuente.estado === 'Completado' || fuente.estado === 'Procesado') {
                      <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    } @else if (fuente.estado === 'Error') {
                      <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-blue-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    }
                    <span class="text-sm text-slate-700 flex-1 truncate">{{ fuente.archivo }}</span>
                    <span class="text-xs text-slate-400 flex-shrink-0">{{ fuente.registrosProcesados }} regs.</span>
                  </div>
                }
              </div>
            }

            <!-- Advertencias / Errores -->
            @if ((estado()?.errores?.length ?? 0) > 0) {
              <div class="p-3 rounded-lg border"
                [class.bg-yellow-50]="isParcial()"
                [class.border-yellow-100]="isParcial()"
                [class.bg-red-50]="!isParcial()"
                [class.border-red-100]="!isParcial()"
              >
                <p class="text-xs font-medium mb-2"
                  [class.text-yellow-700]="isParcial()"
                  [class.text-red-700]="!isParcial()"
                >
                  {{ isParcial() ? 'Advertencias (' + estado()!.errores!.length + ')' : 'Errores encontrados' }}
                </p>
                <ul class="space-y-1 max-h-32 overflow-y-auto">
                  @for (err of estado()!.errores; track err) {
                    <li class="text-xs flex gap-1.5"
                      [class.text-yellow-700]="isParcial()"
                      [class.text-red-600]="!isParcial()"
                    >
                      <span class="flex-shrink-0 mt-0.5">{{ isParcial() ? '⚠' : '✕' }}</span>
                      <span>{{ err }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          @if (isTerminal()) {
            <div class="px-6 pb-6">
              <button
                (click)="closeModal()"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                [class.bg-green-600]="isExitoso()"
                [class.text-white]="isExitoso() || isParcial() || isFallido()"
                [class.bg-yellow-500]="isParcial()"
                [class.bg-red-500]="isFallido()"
                [class.bg-slate-100]="!isExitoso() && !isParcial() && !isFallido()"
                [class.text-slate-700]="!isExitoso() && !isParcial() && !isFallido()"
              >
                Cerrar
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Página -->
    <div class="p-6 max-w-5xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between mb-7">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Consolidar</h1>
          <p class="text-sm text-slate-500 mt-0.5">Carga los 5 archivos fuente para iniciar la consolidación</p>
        </div>
        <button
          type="button"
          (click)="consolidar()"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          [class.bg-blue-600]="allFilesReady() && !uploading()"
          [class.text-white]="allFilesReady() && !uploading()"
          [class.bg-slate-100]="!allFilesReady() || uploading()"
          [class.text-slate-400]="!allFilesReady() || uploading()"
          [class.cursor-not-allowed]="!allFilesReady() || uploading()"
          [class.opacity-60]="!allFilesReady() || uploading()"
        >
          @if (uploading()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Subiendo archivos...
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Consolidar
          }
        </button>
      </div>

      <!-- Tarjetas de archivos -->
      <div class="grid grid-cols-6 gap-4 mb-4">
        @for (slot of slots(); track slot.key; let i = $index) {
          <div
            class="rounded-xl border-2 transition-all cursor-pointer select-none"
            [class.col-span-2]="i < 3"
            [class.col-span-3]="i >= 3"
            [class.border-slate-200]="!slot.file && !slot.dragOver"
            [class.bg-white]="!slot.file && !slot.dragOver"
            [class.border-blue-400]="slot.dragOver"
            [class.bg-blue-50]="slot.dragOver"
            [class.border-green-300]="slot.file !== null && !slot.dragOver"
            [class.bg-green-50]="slot.file !== null && !slot.dragOver"
            (click)="selectFile(slot.key)"
            (dragover)="onDragOver($event, slot.key)"
            (dragleave)="onDragLeave(slot.key)"
            (drop)="onDrop($event, slot.key)"
          >
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  [class.bg-green-100]="slot.file !== null"
                  [class.bg-slate-100]="slot.file === null"
                >
                  @if (slot.file) {
                    <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  }
                </div>
                @if (slot.file) {
                  <button
                    (click)="removeFile($event, slot.key)"
                    class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>

              <p class="text-sm font-semibold text-slate-700 mb-1">{{ slot.label }}</p>

              @if (slot.file) {
                <p class="text-xs text-green-700 font-medium truncate" [title]="slot.file.name">{{ slot.file.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatSize(slot.file.size) }}</p>
              } @else {
                <p class="text-xs text-slate-400 leading-relaxed">
                  {{ slot.dragOver ? 'Suelta el archivo aquí' : 'Arrastra o haz clic para cargar' }}
                </p>
              }
            </div>
          </div>
        }
      </div>

      <!-- Indicador de progreso de carga -->
      <div class="flex items-center gap-2 mb-8">
        @for (slot of slots(); track slot.key) {
          <div
            class="h-1 flex-1 rounded-full transition-all duration-300"
            [class.bg-green-400]="slot.file !== null"
            [class.bg-slate-200]="slot.file === null"
          ></div>
        }
        <span class="text-xs text-slate-400 ml-1 flex-shrink-0">{{ readyCount() }}/5 archivos</span>
      </div>

      <!-- Historial -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Historial de consolidaciones</h2>
            @if (historialTotal() > 0) {
              <p class="text-xs text-slate-400 mt-0.5">{{ historialTotal() }} registros en total</p>
            }
          </div>
          <button
            (click)="loadHistorial()"
            class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>
        </div>

        @if (loadingHistorial()) {
          <div class="flex items-center justify-center py-14 gap-2 text-slate-400">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-sm">Cargando historial...</span>
          </div>
        } @else if (historial().length === 0) {
          <div class="py-14 text-center">
            <svg class="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-sm text-slate-400">No hay consolidaciones registradas</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  <th class="px-5 py-3 text-left">Fecha inicio</th>
                  <th class="px-5 py-3 text-left">Estado</th>
                  <th class="px-5 py-3 text-right">Total</th>
                  <th class="px-5 py-3 text-right">Exitosos</th>
                  <th class="px-5 py-3 text-right">Fallidos</th>
                  <th class="px-5 py-3 text-left">Duración</th>
                  <th class="px-5 py-3 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody>
                @for (item of historial(); track item.id) {
                  <tr class="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">{{ formatDate(item.fechaInicio) }}</td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        [class.bg-green-100]="item.estado === 'Exitoso'"
                        [class.text-green-700]="item.estado === 'Exitoso'"
                        [class.bg-yellow-100]="item.estado === 'ParcialmenteExitoso'"
                        [class.text-yellow-700]="item.estado === 'ParcialmenteExitoso'"
                        [class.bg-red-100]="item.estado === 'Fallido'"
                        [class.text-red-700]="item.estado === 'Fallido'"
                        [class.bg-blue-100]="item.estado !== 'Exitoso' && item.estado !== 'ParcialmenteExitoso' && item.estado !== 'Fallido'"
                        [class.text-blue-700]="item.estado !== 'Exitoso' && item.estado !== 'ParcialmenteExitoso' && item.estado !== 'Fallido'"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          [class.bg-green-500]="item.estado === 'Exitoso'"
                          [class.bg-yellow-500]="item.estado === 'ParcialmenteExitoso'"
                          [class.bg-red-500]="item.estado === 'Fallido'"
                          [class.bg-blue-500]="item.estado !== 'Exitoso' && item.estado !== 'ParcialmenteExitoso' && item.estado !== 'Fallido'"
                        ></span>
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-slate-700 text-right">{{ item.totalRegistros }}</td>
                    <td class="px-5 py-3.5 text-sm text-right font-medium text-green-600">{{ item.registrosExitosos }}</td>
                    <td class="px-5 py-3.5 text-sm text-right font-medium"
                      [class.text-red-600]="item.registrosFallidos > 0"
                      [class.text-slate-300]="item.registrosFallidos === 0"
                    >{{ item.registrosFallidos }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{{ formatDuracion(item.fechaInicio, item.fechaFin) }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-500">{{ item.iniciadoPor || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (historialTotalPaginas() > 1) {
            <div class="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs text-slate-400">Página {{ historialPagina() }} de {{ historialTotalPaginas() }}</span>
              <div class="flex gap-2">
                <button
                  (click)="cambiarPagina(historialPagina() - 1)"
                  [disabled]="historialPagina() === 1"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >Anterior</button>
                <button
                  (click)="cambiarPagina(historialPagina() + 1)"
                  [disabled]="historialPagina() === historialTotalPaginas()"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >Siguiente</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ConsolidarComponent implements OnDestroy {
  private readonly svc  = inject(ConsolidacionService);
  private readonly zone = inject(NgZone);
  private pollSub?:    Subscription;
  private timeoutSub?: Subscription;

  slots = signal<FileSlot[]>([
    { key: 'gr55',               label: 'GR55',                   file: null, dragOver: false },
    { key: 'horas',              label: 'Horas',                  file: null, dragOver: false },
    { key: 'planeacion',         label: 'Planeación',             file: null, dragOver: false },
    { key: 'tipoCambio',         label: 'Tipo de Cambio',         file: null, dragOver: false },
    { key: 'maestroReferencias', label: 'Maestro de Referencias', file: null, dragOver: false },
  ]);

  allFilesReady = computed(() => this.slots().every(s => s.file !== null));
  readyCount    = computed(() => this.slots().filter(s => s.file !== null).length);

  uploading  = signal(false);
  showModal  = signal(false);
  timedOut   = signal(false);
  estado     = signal<ConsolidacionEstadoDto | null>(null);

  isTerminal = computed(() => {
    if (this.timedOut()) return true;
    const e = this.estado()?.estado;
    return !!e && (TERMINAL_ESTADOS as readonly string[]).includes(e);
  });

  isExitoso          = computed(() => this.estado()?.estado === 'Exitoso');
  isParcial          = computed(() => this.estado()?.estado === 'ParcialmenteExitoso');
  isFallido          = computed(() => this.timedOut() || this.estado()?.estado === 'Fallido');

  modalTitulo = computed(() => {
    if (this.timedOut())      return 'Tiempo de espera agotado';
    if (this.isExitoso())     return 'Consolidación completada';
    if (this.isParcial())     return 'Completado con advertencias';
    if (this.isFallido())     return 'Error en la consolidación';
    const ex = this.estado()?.registrosExitosos ?? 0;
    const tot = this.estado()?.totalRegistros ?? 5;
    return `Procesando archivos… (${ex}/${tot})`;
  });

  textoProgreso = computed(() => {
    if (this.isTerminal()) return null;
    return 'Este proceso puede tomar varios minutos';
  });

  historial             = signal<ConsolidacionHistorialDto[]>([]);
  historialTotal        = signal(0);
  historialPagina       = signal(1);
  historialTotalPaginas = signal(1);
  loadingHistorial      = signal(false);

  constructor() {
    this.loadHistorial();
  }

  selectFile(key: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) this.zone.run(() => this.setFile(key, file));
      document.body.removeChild(input);
    });
    input.click();
  }

  removeFile(event: MouseEvent, key: string) {
    event.stopPropagation();
    this.setFile(key, null);
  }

  private setFile(key: string, file: File | null) {
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, file } : s));
  }

  onDragOver(event: DragEvent, key: string) {
    event.preventDefault();
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: true } : s));
  }

  onDragLeave(key: string) {
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: false } : s));
  }

  onDrop(event: DragEvent, key: string) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(key, file);
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: false } : s));
  }

  consolidar() {
    if (!this.allFilesReady() || this.uploading()) return;
    const s = this.slots();
    const getFile = (key: string) => s.find(x => x.key === key)!.file!;

    this.uploading.set(true);
    this.timedOut.set(false);
    // Abrir modal de inmediato — fase "subiendo archivos"
    this.estado.set(null);
    this.showModal.set(true);

    this.svc.upload({
      gr55:               getFile('gr55'),
      horas:              getFile('horas'),
      planeacion:         getFile('planeacion'),
      tipoCambio:         getFile('tipoCambio'),
      maestroReferencias: getFile('maestroReferencias'),
    }).subscribe({
      next: (data) => {
        this.uploading.set(false);
        this.estado.set({
          consolidacionId:   data.consolidacionId,
          estado:            'Procesando',
          porcentajeAvance:  0,
          totalRegistros:    5,
          registrosExitosos: 0,
          registrosFallidos: 0,
          fechaInicio:       new Date().toISOString(),
          fechaFin:          null,
          fuentes:           null,
          errores:           null,
        });
        this.startPolling(data.consolidacionId);
      },
      error: () => {
        this.uploading.set(false);
        this.showModal.set(false);
      },
    });
  }

  private startPolling(id: number) {
    this.stopPolling();

    // Timeout de seguridad: detiene el polling a los 5 minutos
    this.timeoutSub = timer(TIMEOUT_MS).pipe(take(1)).subscribe(() => {
      this.stopPolling();
      this.timedOut.set(true);
      this.loadHistorial();
    });

    this.pollSub = timer(500, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.svc.estado(id))
    ).subscribe({
      next: (data) => {
        this.estado.set(data);
        const e = data.estado ?? '';
        if ((TERMINAL_ESTADOS as readonly string[]).includes(e)) {
          this.stopPolling();
          this.loadHistorial();
        }
      },
    });
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
    this.timeoutSub?.unsubscribe();
    this.pollSub    = undefined;
    this.timeoutSub = undefined;
  }

  closeModal() {
    const wasSuccess = this.estado()?.estado === 'Exitoso';
    this.showModal.set(false);
    this.estado.set(null);
    this.timedOut.set(false);
    if (wasSuccess) {
      this.slots.update(arr => arr.map(s => ({ ...s, file: null })));
    }
  }

  loadHistorial(pagina?: number) {
    const p = pagina ?? this.historialPagina();
    this.loadingHistorial.set(true);
    this.svc.historial(p).subscribe({
      next: (result: PagedResult<ConsolidacionHistorialDto>) => {
        this.loadingHistorial.set(false);
        this.historial.set(result.items ?? []);
        this.historialTotal.set(result.totalRegistros);
        this.historialPagina.set(result.pagina);
        this.historialTotalPaginas.set(result.totalPaginas);
      },
      error: () => this.loadingHistorial.set(false),
    });
  }

  cambiarPagina(p: number) {
    this.loadHistorial(p);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDuracion(inicio: string, fin: string | null): string {
    if (!fin) return '—';
    const s = Math.floor((new Date(fin).getTime() - new Date(inicio).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
