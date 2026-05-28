import { Component, signal, computed, inject, NgZone, effect, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConsolidacionService } from '../../../core/services/consolidacion.service';
import { ConsolidacionActivaService } from '../../../core/services/consolidacion-activa.service';
import { ConsolidacionEstadoDto, ConsolidacionHistorialDto, FuenteEstadoDto } from '../../../core/models/consolidacion.models';
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
  imports: [DecimalPipe],
  template: `
    <!-- Modal Ver Detalle -->
    @if (loadingDetalle() || detalleEstado()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="cerrarDetalle()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                @if (loadingDetalle()) {
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                } @else if (detalleEstado()?.estado === 'Exitoso') {
                  <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                } @else if (detalleEstado()?.estado === 'ParcialmenteExitoso') {
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
                <div class="min-w-0">
                  <h3 class="text-base font-semibold text-slate-900">
                    @if (loadingDetalle()) { Cargando detalle… }
                    @else if (detalleEstado()?.estado === 'Exitoso') { Consolidación exitosa }
                    @else if (detalleEstado()?.estado === 'ParcialmenteExitoso') { Completado con advertencias }
                    @else { Error en consolidación }
                  </h3>
                  @if (detalleEstado()) {
                    <p class="text-xs text-slate-400 mt-0.5 truncate">
                      {{ formatDate(detalleEstado()!.fechaInicio) }}
                      @if (detalleEstado()!.fechaFin) {
                        · {{ formatDuracion(detalleEstado()!.fechaInicio, detalleEstado()!.fechaFin) }}
                      }
                    </p>
                  }
                </div>
              </div>
              <button (click)="cerrarDetalle()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            @if (loadingDetalle()) {
              <div class="flex items-center justify-center py-10 gap-2 text-slate-400">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span class="text-sm">Obteniendo detalle...</span>
              </div>
            } @else if (detalleEstado()) {

              @if (detalleEstado()!.fuentes?.length) {
                <div>
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Archivos procesados</p>
                  <div class="space-y-1.5">
                    @for (fuente of detalleEstado()!.fuentes!; track fuente.archivo) {
                      <div class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                        [class.bg-green-50]="fuente.estado === 'Exitoso'"
                        [class.bg-yellow-50]="detalleIsAdvertencia(fuente)"
                        [class.bg-red-50]="fuente.estado === 'Fallido' && !detalleIsAdvertencia(fuente)"
                        [class.bg-slate-50]="fuente.estado === 'Pendiente'"
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          @if (fuente.estado === 'Exitoso') {
                            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          } @else if (detalleIsAdvertencia(fuente)) {
                            <svg class="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          }
                          <span class="text-sm text-slate-700 font-medium truncate">{{ fuente.archivo }}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          @if (fuente.registrosProcesados > 0) {
                            <span class="text-xs text-slate-400">{{ fuente.registrosProcesados | number }} filas</span>
                          }
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                            [class.bg-green-100]="fuente.estado === 'Exitoso'"
                            [class.text-green-700]="fuente.estado === 'Exitoso'"
                            [class.bg-yellow-100]="detalleIsAdvertencia(fuente)"
                            [class.text-yellow-700]="detalleIsAdvertencia(fuente)"
                            [class.bg-red-100]="fuente.estado === 'Fallido' && !detalleIsAdvertencia(fuente)"
                            [class.text-red-700]="fuente.estado === 'Fallido' && !detalleIsAdvertencia(fuente)"
                            [class.bg-slate-100]="fuente.estado !== 'Exitoso' && fuente.estado !== 'Fallido'"
                            [class.text-slate-600]="fuente.estado !== 'Exitoso' && fuente.estado !== 'Fallido'"
                          >
                            @if (fuente.estado === 'Exitoso') { Exitoso }
                            @else if (detalleIsAdvertencia(fuente)) { Advertencia }
                            @else if (fuente.estado === 'Fallido') { Error }
                            @else { {{ fuente.estado }} }
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="py-4 text-center text-sm text-slate-400">Sin detalle por archivo disponible</div>
              }

              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-slate-900">{{ detalleEstado()!.totalRegistros | number }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">Total</div>
                </div>
                <div class="bg-green-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-green-700">{{ detalleEstado()!.registrosExitosos | number }}</div>
                  <div class="text-xs text-green-600 mt-0.5">Exitosos</div>
                </div>
                <div class="bg-red-50 rounded-xl p-3 text-center">
                  <div class="text-xl font-bold text-red-700">{{ detalleEstado()!.registrosFallidos | number }}</div>
                  <div class="text-xs text-red-600 mt-0.5">Fallidos</div>
                </div>
              </div>

              @if ((detalleEstado()!.errores?.length ?? 0) > 0) {
                <div class="p-3 rounded-lg border"
                  [class.bg-yellow-50]="detalleEstado()!.estado === 'ParcialmenteExitoso'"
                  [class.border-yellow-100]="detalleEstado()!.estado === 'ParcialmenteExitoso'"
                  [class.bg-red-50]="detalleEstado()!.estado !== 'ParcialmenteExitoso'"
                  [class.border-red-100]="detalleEstado()!.estado !== 'ParcialmenteExitoso'"
                >
                  <p class="text-xs font-semibold mb-2"
                    [class.text-yellow-700]="detalleEstado()!.estado === 'ParcialmenteExitoso'"
                    [class.text-red-700]="detalleEstado()!.estado !== 'ParcialmenteExitoso'"
                  >
                    {{ detalleEstado()!.estado === 'ParcialmenteExitoso'
                        ? 'Advertencias (' + detalleEstado()!.errores!.length + ')'
                        : 'Errores (' + detalleEstado()!.errores!.length + ')' }}
                  </p>
                  <ul class="space-y-1 max-h-40 overflow-y-auto">
                    @for (err of detalleEstado()!.errores!; track err) {
                      <li class="text-xs flex gap-1.5"
                        [class.text-yellow-700]="detalleEstado()!.estado === 'ParcialmenteExitoso'"
                        [class.text-red-600]="detalleEstado()!.estado !== 'ParcialmenteExitoso'"
                      >
                        <span class="flex-shrink-0 mt-0.5">
                          {{ detalleEstado()!.estado === 'ParcialmenteExitoso' ? '⚠' : '✕' }}
                        </span>
                        <span>{{ err }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            }
          </div>

          <div class="px-6 pb-6 pt-2 flex-shrink-0">
            <button (click)="cerrarDetalle()"
              class="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              Cerrar
            </button>
          </div>
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
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="consolidarSinArchivos()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border"
            [class.border-slate-300]="!consolidacionActiva.hayProcesoActivo() && !consolidacionActiva.iniciando()"
            [class.text-slate-700]="!consolidacionActiva.hayProcesoActivo() && !consolidacionActiva.iniciando()"
            [class.hover:bg-slate-50]="!consolidacionActiva.hayProcesoActivo() && !consolidacionActiva.iniciando()"
            [class.border-slate-200]="consolidacionActiva.hayProcesoActivo() || consolidacionActiva.iniciando()"
            [class.text-slate-400]="consolidacionActiva.hayProcesoActivo() || consolidacionActiva.iniciando()"
            [class.cursor-not-allowed]="consolidacionActiva.hayProcesoActivo() || consolidacionActiva.iniciando()"
            [class.opacity-60]="consolidacionActiva.hayProcesoActivo() || consolidacionActiva.iniciando()"
          >
            @if (consolidacionActiva.iniciando()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Iniciando…
            } @else {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Iniciar consolidación
            }
          </button>
          <button
            type="button"
            (click)="consolidar()"
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            [class.bg-blue-600]="allFilesReady() && !consolidacionActiva.uploading()"
            [class.text-white]="allFilesReady() && !consolidacionActiva.uploading()"
            [class.bg-slate-100]="!allFilesReady() || consolidacionActiva.uploading()"
            [class.text-slate-400]="!allFilesReady() || consolidacionActiva.uploading()"
            [class.cursor-not-allowed]="!allFilesReady() || consolidacionActiva.uploading()"
            [class.opacity-60]="!allFilesReady() || consolidacionActiva.uploading()"
          >
            @if (consolidacionActiva.uploading()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Subiendo…
            } @else {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Consolidar
            }
          </button>
        </div>
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
                  <th class="px-5 py-3"></th>
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
                    <td class="px-5 py-3.5">
                      <button
                        (click)="verDetalle(item.id)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Ver Detalle
                      </button>
                    </td>
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
export class ConsolidarComponent {
  private readonly svc              = inject(ConsolidacionService);
  private readonly zone             = inject(NgZone);
  protected readonly consolidacionActiva = inject(ConsolidacionActivaService);

  slots = signal<FileSlot[]>([
    { key: 'gr55',               label: 'GR55',                   file: null, dragOver: false },
    { key: 'horas',              label: 'Horas',                  file: null, dragOver: false },
    { key: 'planeacion',         label: 'Planeación',             file: null, dragOver: false },
    { key: 'tipoCambio',         label: 'Tipo de Cambio',         file: null, dragOver: false },
    { key: 'maestroReferencias', label: 'Maestro de Referencias', file: null, dragOver: false },
  ]);

  allFilesReady = computed(() => this.slots().every(s => s.file !== null));
  readyCount    = computed(() => this.slots().filter(s => s.file !== null).length);

  historial             = signal<ConsolidacionHistorialDto[]>([]);
  historialTotal        = signal(0);
  historialPagina       = signal(1);
  historialTotalPaginas = signal(1);
  loadingHistorial      = signal(false);

  detalleEstado  = signal<ConsolidacionEstadoDto | null>(null);
  loadingDetalle = signal(false);

  constructor() {
    this.loadHistorial();

    // Cuando la consolidación termina, recargar historial y limpiar archivos si fue exitosa.
    // Si el modal no estaba visible (usuario en otra página), limpiar el estado del servicio.
    effect(() => {
      const terminal = this.consolidacionActiva.isTerminal();
      if (!terminal) return;
      untracked(() => {
        const exitoso   = this.consolidacionActiva.isExitoso();
        const modalOpen = this.consolidacionActiva.showModal();
        this.loadHistorial();
        if (exitoso) {
          this.slots.update(arr => arr.map(s => ({ ...s, file: null })));
        }
        if (!modalOpen) {
          this.consolidacionActiva.clearEstado();
        }
      });
    });
  }

  consolidarSinArchivos() {
    if (this.consolidacionActiva.hayProcesoActivo() || this.consolidacionActiva.iniciando()) return;
    this.consolidacionActiva.iniciarSinArchivos();
  }

  consolidar() {
    if (this.consolidacionActiva.uploading() || !this.allFilesReady()) return;
    const s = this.slots();
    const getFile = (key: string) => s.find(x => x.key === key)!.file!;
    this.consolidacionActiva.iniciarConsolidacion([
      { key: 'gr55',               label: 'GR55',                   endpoint: 'gr55',               file: getFile('gr55') },
      { key: 'horas',              label: 'Horas',                  endpoint: 'horas',              file: getFile('horas') },
      { key: 'planeacion',         label: 'Planeación',             endpoint: 'planeacion',         file: getFile('planeacion') },
      { key: 'tipoCambio',         label: 'Tipo de Cambio',         endpoint: 'tipocambio',         file: getFile('tipoCambio') },
      { key: 'maestroReferencias', label: 'Maestro de Referencias', endpoint: 'maestroreferencias', file: getFile('maestroReferencias') },
    ]);
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

  verDetalle(id: number) {
    this.detalleEstado.set(null);
    this.loadingDetalle.set(true);
    this.svc.estado(id).subscribe({
      next:  (data) => { this.loadingDetalle.set(false); this.detalleEstado.set(data); },
      error: ()     => { this.loadingDetalle.set(false); },
    });
  }

  cerrarDetalle() {
    this.detalleEstado.set(null);
    this.loadingDetalle.set(false);
  }

  detalleIsAdvertencia(fuente: FuenteEstadoDto): boolean {
    return fuente.estado === 'Fallido' && this.detalleEstado()?.estado !== 'Fallido';
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
}
