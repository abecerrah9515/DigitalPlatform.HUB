import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NotificationService } from '../../core/services/notification.service';
import { ConsolidacionActivaService } from '../../core/services/consolidacion-activa.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, DecimalPipe],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar />
      <main class="ml-[210px] flex-1 min-h-screen overflow-auto bg-slate-50">
        <router-outlet />
      </main>
    </div>

    <!-- Modal de progreso de consolidación (global) -->
    @if (consolidacion.showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                @if (consolidacion.isTerminal()) {
                  @if (consolidacion.isExitoso()) {
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  } @else if (consolidacion.isParcial()) {
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
                    @if (consolidacion.uploading()) { Subiendo archivos… }
                    @else { {{ consolidacion.modalTitulo() }} }
                  </h3>
                  @if (consolidacion.uploading()) {
                    <p class="text-sm text-slate-500 mt-0.5">Subiendo {{ consolidacion.slotLabels().length }} archivos en paralelo…</p>
                  } @else if (consolidacion.textoProgreso()) {
                    <p class="text-sm text-slate-500 mt-0.5">{{ consolidacion.textoProgreso() }}</p>
                  }
                </div>
              </div>
              @if (!consolidacion.uploading() && !consolidacion.isTerminal()) {
                <button
                  (click)="consolidacion.minimizarModal()"
                  title="Minimizar — el proceso continúa en segundo plano"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="space-y-2.5">
              @if (consolidacion.estado()?.fuentes?.length) {
                @for (fuente of consolidacion.estado()!.fuentes!; track fuente.archivo) {
                  <div class="space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        @if (fuente.estado === 'Exitoso') {
                          <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        } @else if (consolidacion.fuenteEsAdvertencia(fuente)) {
                          <svg class="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          </svg>
                        } @else if (fuente.estado === 'Fallido') {
                          <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        } @else if (fuente.estado === 'Procesando') {
                          <svg class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        } @else {
                          <span class="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0"></span>
                        }
                        <span class="text-xs text-slate-700 truncate">{{ fuente.archivo }}</span>
                      </div>
                      @if (fuente.estado === 'Exitoso') {
                        <span class="text-xs font-medium text-green-600 flex-shrink-0">100%</span>
                      } @else if (consolidacion.fuenteEsAdvertencia(fuente)) {
                        <span class="text-xs font-medium text-yellow-600 flex-shrink-0">Advertencia</span>
                      } @else if (fuente.estado === 'Fallido') {
                        <span class="text-xs font-medium text-red-500 flex-shrink-0">Error</span>
                      } @else if (fuente.estado === 'Procesando') {
                        @if (consolidacion.fuentePct(fuente) !== null) {
                          <span class="text-xs font-medium text-blue-500 flex-shrink-0">{{ consolidacion.fuentePct(fuente) }}%</span>
                        } @else {
                          <span class="text-xs text-slate-400 flex-shrink-0">{{ fuente.registrosProcesados | number }} filas</span>
                        }
                      } @else {
                        <span class="text-xs text-slate-400 flex-shrink-0">Pendiente</span>
                      }
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      @if (fuente.estado === 'Exitoso') {
                        <div class="h-full w-full rounded-full bg-green-500 transition-all duration-500"></div>
                      } @else if (consolidacion.fuenteEsAdvertencia(fuente)) {
                        <div class="h-full w-full rounded-full bg-yellow-400"></div>
                      } @else if (fuente.estado === 'Fallido') {
                        <div class="h-full w-full rounded-full bg-red-400"></div>
                      } @else if (fuente.estado === 'Procesando') {
                        @if (consolidacion.fuentePct(fuente) !== null) {
                          <div class="h-full rounded-full bg-blue-400 transition-all duration-500"
                            [style.width.%]="consolidacion.fuentePct(fuente)"></div>
                        } @else {
                          <div class="h-full w-1/2 rounded-full bg-blue-400 animate-pulse"></div>
                        }
                      } @else {
                        <div class="h-full w-0 rounded-full bg-slate-300"></div>
                      }
                    </div>
                  </div>
                }
              } @else if (consolidacion.uploading()) {
                @for (slot of consolidacion.slotLabels(); track slot.key) {
                  <div class="space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        @if (consolidacion.uploadProgreso()[slot.key]?.done) {
                          <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        } @else if (consolidacion.uploadProgreso()[slot.key]?.error) {
                          <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        } @else {
                          <svg class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        }
                        <span class="text-xs text-slate-700 truncate">{{ slot.label }}</span>
                      </div>
                      @if (consolidacion.uploadProgreso()[slot.key]?.error) {
                        <span class="text-xs font-medium text-red-500 flex-shrink-0">Error</span>
                      } @else if (consolidacion.uploadProgreso()[slot.key]?.done) {
                        <span class="text-xs font-medium text-green-600 flex-shrink-0">100%</span>
                      } @else {
                        <span class="text-xs font-medium text-blue-500 flex-shrink-0">
                          {{ consolidacion.uploadProgreso()[slot.key]?.percent ?? 0 }}%
                        </span>
                      }
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      @if (consolidacion.uploadProgreso()[slot.key]?.error) {
                        <div class="h-full w-full rounded-full bg-red-400"></div>
                      } @else {
                        <div class="h-full rounded-full transition-all duration-300"
                          [class.bg-green-500]="consolidacion.uploadProgreso()[slot.key]?.done"
                          [class.bg-blue-400]="!consolidacion.uploadProgreso()[slot.key]?.done"
                          [style.width.%]="consolidacion.uploadProgreso()[slot.key]?.percent ?? 0"
                        ></div>
                      }
                    </div>
                  </div>
                }
              } @else {
                @for (slot of consolidacion.slotLabels(); track slot.key) {
                  <div class="space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <svg class="w-3.5 h-3.5 text-blue-300 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span class="text-xs text-slate-500 truncate">{{ slot.label }}</span>
                      </div>
                      <span class="text-xs text-slate-300 flex-shrink-0">—</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full w-1/3 rounded-full bg-blue-200 animate-pulse"></div>
                    </div>
                  </div>
                }
              }
            </div>

            @if (consolidacion.uploadErrorMsg()) {
              <div class="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <p class="text-xs text-red-700">{{ consolidacion.uploadErrorMsg() }}</p>
              </div>
            }

            @if ((consolidacion.estado()?.fuentes?.length ?? 0) > 0 || consolidacion.isTerminal()) {
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-slate-900">{{ consolidacion.statsTotal() }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ consolidacion.isTerminal() ? 'Total' : 'Archivos' }}</div>
                </div>
                <div class="bg-green-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-green-700">{{ consolidacion.statsExitosos() }}</div>
                  <div class="text-xs text-green-600 mt-0.5">Exitosos</div>
                </div>
                <div class="bg-red-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-red-700">{{ consolidacion.statsFallidos() }}</div>
                  <div class="text-xs text-red-600 mt-0.5">Fallidos</div>
                </div>
              </div>
            }

            @if ((consolidacion.estado()?.errores?.length ?? 0) > 0) {
              <div class="p-3 rounded-lg border"
                [class.bg-yellow-50]="consolidacion.isParcial()"
                [class.border-yellow-100]="consolidacion.isParcial()"
                [class.bg-red-50]="!consolidacion.isParcial()"
                [class.border-red-100]="!consolidacion.isParcial()"
              >
                <p class="text-xs font-medium mb-2"
                  [class.text-yellow-700]="consolidacion.isParcial()"
                  [class.text-red-700]="!consolidacion.isParcial()"
                >
                  {{ consolidacion.isParcial()
                      ? 'Advertencias (' + consolidacion.estado()!.errores!.length + ')'
                      : 'Errores encontrados' }}
                </p>
                <ul class="space-y-1 max-h-32 overflow-y-auto">
                  @for (err of consolidacion.estado()!.errores; track err) {
                    <li class="text-xs flex gap-1.5"
                      [class.text-yellow-700]="consolidacion.isParcial()"
                      [class.text-red-600]="!consolidacion.isParcial()"
                    >
                      <span class="flex-shrink-0 mt-0.5">{{ consolidacion.isParcial() ? '⚠' : '✕' }}</span>
                      <span>{{ err }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          @if (consolidacion.isTerminal() || consolidacion.uploadErrorMsg()) {
            <div class="px-6 pb-6">
              <button
                (click)="consolidacion.closeModal()"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                [class.bg-green-600]="consolidacion.isExitoso()"
                [class.text-white]="consolidacion.isExitoso() || consolidacion.isParcial() || consolidacion.isFallido()"
                [class.bg-yellow-500]="consolidacion.isParcial()"
                [class.bg-red-500]="consolidacion.isFallido() && !consolidacion.uploadErrorMsg()"
                [class.bg-slate-100]="(!consolidacion.isExitoso() && !consolidacion.isParcial() && !consolidacion.isFallido()) || !!consolidacion.uploadErrorMsg()"
                [class.text-slate-700]="(!consolidacion.isExitoso() && !consolidacion.isParcial() && !consolidacion.isFallido()) || !!consolidacion.uploadErrorMsg()"
              >
                Cerrar
              </button>
            </div>
          }

        </div>
      </div>
    }

    <!-- Banner proceso activo (visible en cualquier página cuando el modal está minimizado) -->
    @if (!consolidacion.showModal() && consolidacion.hayProcesoActivo()) {
      <div
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-full shadow-xl cursor-pointer hover:bg-blue-700 transition-colors"
        (click)="consolidacion.showModal.set(true)"
      >
        <svg class="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="text-sm font-medium">Consolidación en progreso — Ver estado</span>
      </div>
    }

    <!-- Toast notifications -->
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-fade-in"
          [class.bg-red-50]="toast.type === 'error'"
          [class.border-red-200]="toast.type === 'error'"
          [class.text-red-800]="toast.type === 'error'"
          [class.bg-yellow-50]="toast.type === 'warning'"
          [class.border-yellow-200]="toast.type === 'warning'"
          [class.text-yellow-800]="toast.type === 'warning'"
          [class.bg-green-50]="toast.type === 'success'"
          [class.border-green-200]="toast.type === 'success'"
          [class.text-green-800]="toast.type === 'success'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.text-blue-800]="toast.type === 'info'"
        >
          @if (toast.type === 'error') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          } @else if (toast.type === 'warning') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          } @else if (toast.type === 'success') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          } @else {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"/>
            </svg>
          }
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <button (click)="notify.dismiss(toast.id)"
            class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ShellComponent {
  protected readonly notify         = inject(NotificationService);
  protected readonly consolidacion  = inject(ConsolidacionActivaService);
}
