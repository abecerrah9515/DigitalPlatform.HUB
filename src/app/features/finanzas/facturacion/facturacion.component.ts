import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';
import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  FacturaDto,
  ComentarioDto,
  NotificacionEnviadaDto,
} from '../../../core/models/cartera.models';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterDropdownComponent,
  ],
  template: `
    <div class="p-6 space-y-6 max-w-screen-2xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Facturación</h1>
          <p class="text-sm text-slate-500 mt-0.5">Control de facturas de clientes</p>
        </div>
        <div class="flex items-center gap-3">
          <label
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Cargar correos
            <input type="file" (change)="cargarCorreos($event)" accept=".eml,.msg,.pdf" class="hidden">
          </label>
          <button (click)="showReporteModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Generar Reporte
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas por Cobrar</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{{ simboloMoneda(monedaFiltro()) }}{{ resumen().facturasPorCobrar | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas Vencidas</p>
          <p class="text-2xl font-bold text-red-600 mt-1">{{ simboloMoneda(monedaFiltro()) }}{{ resumen().facturasVencidas | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas Confirmadas</p>
          <p class="text-2xl font-bold text-emerald-600 mt-1">{{ simboloMoneda(monedaFiltro()) }}{{ resumen().facturasConfirmadas | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas con Diferencia</p>
          <p class="text-2xl font-bold text-amber-600 mt-1">{{ resumen().facturasConDiferencia | number }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div class="flex gap-4 items-end">
          <div class="flex-[6] flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Buscar</label>
            <input
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nombre o Nº de cliente..."
              [ngModel]="filtroBusqueda()"
              (ngModelChange)="filtroBusqueda.set($event); cargarFacturas()"
            />
          </div>
          <div class="flex-[2] flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Moneda</label>
            <select
              [value]="monedaFiltro()"
              (change)="cambiarMoneda($any($event.target).value)"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="COP">COP ($)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div class="flex-[2] flex flex-col gap-1">
            <app-filter-dropdown
              label="Estado"
              [options]="estadosDisponibles()"
              [selectedValues]="filtroEstado()"
              (selectionChange)="onEstadoChange($event)"
            />
          </div>
        </div>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Listado de Facturas</h2>
          <span class="text-xs text-slate-400">{{ facturas().length }} registro(s)</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Factura</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Cliente</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Monto</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Fecha Vencimiento</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wide">Estado</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Pago Prometido</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Retención</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (factura of paginatedFacturas(); track factura.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ factura.consecutivo || factura.factura }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ factura.cliente }}</td>
                  <td class="px-4 py-3 text-right font-medium text-slate-900">{{ simboloMoneda(monedaFiltro()) }}{{ convertir(factura.monto) | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ factura.fechaVencimiento | date:'shortDate' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full"
                      [style.background]="estadoBg(factura.estado)"
                      [style.color]="estadoText(factura.estado)"
                    >{{ factura.estado | titlecase }}</span>
                  </td>
                  <td class="px-4 py-3 text-right text-slate-400">—</td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ simboloMoneda(monedaFiltro()) }}{{ convertir(factura.retencion) | number:'1.2-2' }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        (click)="abrirNotaModal(factura)"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        Agregar nota
                      </button>
                      <button
                        (click)="abrirNotaMasivaModal(factura)"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                        Nota masiva
                      </button>
                      <button
                        (click)="abrirHistorialModal(factura)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Ver historial de notas"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-sm text-slate-400">
                    No se encontraron facturas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span class="text-xs text-slate-400">
            Página {{ currentPage() }} de {{ totalPages() }}
          </span>
          <div class="flex items-center gap-2">
            <button
              (click)="currentPage.set(currentPage() - 1)"
              [disabled]="currentPage() <= 1"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            @for (p of paginas(); track p) {
              <button
                (click)="currentPage.set(p)"
                class="w-8 h-8 text-xs rounded-lg transition-colors"
                [class.bg-blue-600]="p === currentPage()"
                [class.text-white]="p === currentPage()"
                [class.text-slate-600]="p !== currentPage()"
                [class.hover:bg-slate-100]="p !== currentPage()"
                [class.border]="p !== currentPage()"
                [class.border-slate-200]="p !== currentPage()"
              >
                {{ p }}
              </button>
            }
            <button
              (click)="currentPage.set(currentPage() + 1)"
              [disabled]="currentPage() >= totalPages()"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- Seguimiento Notificaciones -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Seguimiento Notificaciones Enviadas a Clientes</h2>
          <div class="flex items-center gap-3">
            <select
              [value]="notifFiltroEstado()"
              (change)="filtrarNotificaciones($any($event.target).value)"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Enviado">Enviado</option>
              <option value="Leído">Leído</option>
              <option value="Pendiente">Pendiente</option>
            </select>
            <button
              (click)="enviarCorreo()"
              [disabled]="notificacionesSeleccionadas().length === 0"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Enviar Correo
            </button>
          </div>
        </div>

        <div class="px-5 py-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Enviado recientemente
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Recordar hoy(3 dias)
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Reenviar pronto
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Urgente(+5 dias)
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50">
                <th class="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    [checked]="notificacionesSeleccionadas().length === notificacionesFiltradas().length && notificacionesFiltradas().length > 0"
                    (change)="toggleSeleccionarTodas($any($event.target).checked)"
                    class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Factura</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Cliente</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Ultimo Envio</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Alerta</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Envios</th>
              </tr>
            </thead>
            <tbody>
              @for (n of notificacionesFiltradas(); track n.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  [class.bg-blue-50]="notificacionesSeleccionadas().includes(n.id)">
                  <td class="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      [checked]="notificacionesSeleccionadas().includes(n.id)"
                      (change)="toggleSeleccionarNotificacion(n.id)"
                      class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td class="px-4 py-3 font-medium text-slate-900">{{ n.factura }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ n.cliente }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full"
                      [class.bg-emerald-100]="n.estado === 'Enviado'"
                      [class.text-emerald-700]="n.estado === 'Enviado'"
                      [class.bg-blue-100]="n.estado === 'Leído'"
                      [class.text-blue-700]="n.estado === 'Leído'"
                      [class.bg-amber-100]="n.estado === 'Pendiente'"
                      [class.text-amber-700]="n.estado === 'Pendiente'"
                    >{{ n.estado }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ n.fechaEnvio }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full"
                      [class.bg-emerald-100]="alertaNotificacion(n) === 'Enviado recientemente'"
                      [class.text-emerald-700]="alertaNotificacion(n) === 'Enviado recientemente'"
                      [class.bg-amber-100]="alertaNotificacion(n) === 'Recordar hoy(3 dias)'"
                      [class.text-amber-700]="alertaNotificacion(n) === 'Recordar hoy(3 dias)'"
                      [class.bg-orange-100]="alertaNotificacion(n) === 'Reenviar pronto'"
                      [class.text-orange-700]="alertaNotificacion(n) === 'Reenviar pronto'"
                      [class.bg-red-100]="alertaNotificacion(n) === 'Urgente(+5 dias)'"
                      [class.text-red-700]="alertaNotificacion(n) === 'Urgente(+5 dias)'"
                    >{{ alertaNotificacion(n) }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ n.tipo }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-400">
                    Sin notificaciones enviadas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Reporte Modal -->
    @if (showReporteModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showReporteModal.set(false)">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-xs mx-4 p-6" (click)="$event.stopPropagation()">
          <div class="flex flex-col items-center gap-4">
            <select [value]="reporteEstado()" (change)="reporteEstado.set($any($event.target).value)"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              @for (est of estadosDisponibles(); track est) {
                <option [value]="est">{{ est }}</option>
              }
            </select>
            <button (click)="descargarReporte()"
              class="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer">
              <svg class="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </button>
            <p class="text-xs text-slate-400 text-center">Selecciona el estado y haz clic en el ícono para descargar</p>
          </div>
        </div>
      </div>
    }

    <!-- Individual Note Modal -->
    @if (notaModalFactura()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="cerrarNotaModal()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              Factura {{ notaModalFactura()!.consecutivo || notaModalFactura()!.factura }}
            </h3>
            <button (click)="cerrarNotaModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nota</label>
              <textarea
                [(ngModel)]="notaTexto"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Escribir nota..."
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Fecha compromiso de pago</label>
              <input
                type="date"
                [(ngModel)]="notaFechaCompromiso"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button (click)="cerrarNotaModal()" class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button (click)="guardarNota()" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Guardar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Note Modal -->
    @if (notaMasivaCliente()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="cerrarNotaMasivaModal()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              Nota masiva — {{ notaMasivaCliente() }}
            </h3>
            <button (click)="cerrarNotaMasivaModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 space-y-4">
            <p class="text-sm text-slate-500">
              Se agregará la misma nota a <strong>{{ notaMasivaCantidad() }}</strong> factura(s) de este proyecto.
            </p>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nota</label>
              <textarea
                [(ngModel)]="notaMasivaTexto"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Escribir nota..."
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Fecha compromiso de pago</label>
              <input
                type="date"
                [(ngModel)]="notaMasivaFechaCompromiso"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button (click)="cerrarNotaMasivaModal()" class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button (click)="guardarNotaMasiva()" class="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              Aplicar a {{ notaMasivaCantidad() }} factura(s)
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Note History Modal -->
    @if (historialModalFactura()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="cerrarHistorialModal()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              Historial de notas — {{ historialModalFactura()!.consecutivo || historialModalFactura()!.factura }}
            </h3>
            <button (click)="cerrarHistorialModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 flex-1 overflow-y-auto space-y-3">
            @if (historialNotas().length === 0) {
              <p class="text-sm text-slate-400 text-center py-4">Sin notas registradas</p>
            }
            @for (nota of historialNotas(); track nota.id) {
              <div class="bg-slate-50 rounded-lg px-4 py-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-slate-700">{{ nota.autor }}</span>
                  <span class="text-xs text-slate-400">{{ nota.fecha | date:'short' }}</span>
                </div>
                <p class="text-sm text-slate-600">{{ nota.texto }}</p>
              </div>
            }
          </div>
          <div class="px-6 py-4 border-t border-slate-200 flex justify-end">
            <button (click)="cerrarHistorialModal()" class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class FacturacionComponent implements OnInit {
  private readonly carteraSvc = inject(CarteraService);
  private readonly notifSvc = inject(NotificationService);

  readonly pageSize = 10;
  readonly estadoOptions = ['Todos', 'Confirmada', 'Vencida', 'Pendiente', 'Cancelada'];

  showReporteModal = signal(false);
  reporteEstado = signal('Todos');
  estadosDisponibles = computed(() => {
    const unique = new Set(this.facturas().map(f => f.estado?.toLowerCase()).filter(Boolean));
    return ['Todos', ...unique];
  });

  resumen = computed(() => {
    const f = this.facturasFiltradas();
    const tasa = this.tasaCambio();
    const total = f.reduce((s, x) => s + x.monto / tasa, 0);
    return {
      facturasPorCobrar: total,
      facturasVencidas: f.filter(x => x.estado === 'vencida').reduce((s, x) => s + x.monto / tasa, 0),
      facturasConfirmadas: f.filter(x => x.estado === 'confirmada').reduce((s, x) => s + x.monto / tasa, 0),
      facturasConDiferencia: 0,
    };
  });
  facturas = signal<FacturaDto[]>([]);

  filtroBusqueda = signal('');
  filtroEstado = signal<(string | number)[]>([]);
  monedaFiltro = signal('COP');
  tasaCambio = signal(1);
  currentPage = signal(1);

  facturasFiltradas = computed(() => {
    const estados = this.filtroEstado();
    if (estados.length === 0 || estados.includes('Todos')) return this.facturas();
    const lower = estados.map(e => String(e).toLowerCase());
    return this.facturas().filter(f => f.estado && lower.includes(f.estado));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.facturasFiltradas().length / this.pageSize)));
  paginas = computed(() => {
    const total = this.totalPages();
    const curr = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, curr - 2);
    const end = Math.min(total, curr + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });
  paginatedFacturas = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.facturasFiltradas().slice(start, start + this.pageSize);
  });

  // Individual note modal
  notaModalFactura = signal<FacturaDto | null>(null);
  notaTexto = '';
  notaFechaCompromiso = '';

  // Bulk note modal
  notaMasivaCliente = signal<string | null>(null);
  notaMasivaCantidad = signal(0);
  notaMasivaTexto = '';
  notaMasivaFechaCompromiso = '';

  // History modal
  historialModalFactura = signal<FacturaDto | null>(null);
  historialNotas = signal<ComentarioDto[]>([]);

  ngOnInit() {
    this.cargarFacturas();
    this.carteraSvc.getNotificacionesEnviadas().pipe(catchError(() => of([])))
      .subscribe(r => this.notificaciones.set(r));
  }

  onEstadoChange(vals: (string | number)[]) {
    this.filtroEstado.set(vals);
    this.currentPage.set(1);
  }

  cambiarMoneda(moneda: string) {
    this.monedaFiltro.set(moneda);
    if (moneda === 'COP') { this.tasaCambio.set(1); return; }
    this.carteraSvc.getTasaCambio(moneda).pipe(catchError(() => of({ moneda, tasa: 4200 })))
      .subscribe(r => this.tasaCambio.set(r.tasa));
  }

  convertir(valor: number): number {
    return valor / this.tasaCambio();
  }

  simboloMoneda(_moneda: string): string {
    return '$';
  }

  // ── Notificaciones ──

  notificaciones = signal<NotificacionEnviadaDto[]>([]);
  notifFiltroEstado = signal('');
  notificacionesSeleccionadas = signal<number[]>([]);

  notificacionesFiltradas = computed(() => {
    const estado = this.notifFiltroEstado();
    if (!estado) return this.notificaciones();
    return this.notificaciones().filter(n => n.estado === estado);
  });

  alertaNotificacion(n: NotificacionEnviadaDto): string {
    const dias = Math.floor((Date.now() - new Date(n.fechaEnvio).getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 3) return 'Enviado recientemente';
    if (dias <= 5) return 'Recordar hoy(3 dias)';
    if (dias <= 10) return 'Reenviar pronto';
    return 'Urgente(+5 dias)';
  }

  filtrarNotificaciones(estado: string) {
    this.notifFiltroEstado.set(estado);
  }

  toggleSeleccionarNotificacion(id: number) {
    this.notificacionesSeleccionadas.update(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  toggleSeleccionarTodas(checked: boolean) {
    this.notificacionesSeleccionadas.set(checked ? this.notificacionesFiltradas().map(n => n.id) : []);
  }

  enviarCorreo() {
    const seleccionadas = this.notificacionesSeleccionadas();
    const notifica = this.notificaciones().find(n => n.id === seleccionadas[0]);
    this.carteraSvc.enviarNotificacionBRM({
      correoCliente: notifica?.cliente ?? '',
      correoBRM: '',
      asunto: `Recordatorio de pago - ${notifica?.factura ?? ''}`,
      sharepointLink: '',
      mensaje: 'Recordatorio de factura pendiente',
    }).subscribe(r => {
      if (r.enviado) this.notifSvc.success('Correo enviado correctamente');
      else this.notifSvc.error('Error al enviar correo');
    });
  }

  cargarCorreos(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.carteraSvc.uploadCorreos(file).subscribe({
      next: () => {
        this.notifSvc.success('Correos cargados correctamente');
        input.value = '';
      },
      error: () => {
        this.notifSvc.error('Error al cargar correos');
        input.value = '';
      },
    });
  }

  descargarReporte() {
    const estado = this.reporteEstado();
    const filtered = estado === 'Todos'
      ? this.facturas()
      : this.facturas().filter(f => f.estado === estado);

    const rows = filtered.map(f => ({
      Factura: f.consecutivo || f.factura,
      Cliente: f.cliente,
      'Razón Social': f.razonSocial ?? '',
      NIT: f.nit,
      'Fecha Emisión': f.fechaEmision,
      'Fecha Vencimiento': f.fechaVencimiento,
      Monto: f.monto,
      Retención: f.retencion,
      Estado: f.estado,
      'Días Mora': f.diasMora,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
    XLSX.writeFile(wb, `reporte_facturas_${estado}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    this.showReporteModal.set(false);
  }

  cargarFacturas() {
    const busqueda = this.filtroBusqueda();
    this.carteraSvc.getHistoricoFacturas(busqueda || undefined).pipe(
      catchError(() => of([]))
    ).subscribe(r => {
      const normalized = r.map(f => ({ ...f, estado: f.estado?.toLowerCase() ?? '' }));
      this.facturas.set(normalized);
      this.currentPage.set(1);
    });
  }

  // ── Individual note ──

  abrirNotaModal(factura: FacturaDto) {
    this.notaModalFactura.set(factura);
    this.notaTexto = '';
    this.notaFechaCompromiso = '';
  }

  cerrarNotaModal() {
    this.notaModalFactura.set(null);
    this.notaTexto = '';
    this.notaFechaCompromiso = '';
  }

  guardarNota() {
    const factura = this.notaModalFactura();
    if (!factura || !this.notaTexto.trim()) return;
    this.carteraSvc.agregarComentario(factura.id, {
      texto: this.notaTexto.trim(),
      nuevaFechaCompromiso: this.notaFechaCompromiso || undefined,
    }).pipe(
      catchError((err: unknown) => {
        this.notifSvc.error((err as Error)?.message ?? 'Error al guardar la nota');
        return of(null);
      })
    ).subscribe(r => {
      if (r) {
        this.notifSvc.success('Nota guardada exitosamente');
        this.cerrarNotaModal();
      }
    });
  }

  // ── Bulk note ──

  abrirNotaMasivaModal(factura: FacturaDto) {
    const cliente = factura.cliente;
    const cantidad = this.facturas().filter(f => f.cliente === cliente).length;
    this.notaMasivaCliente.set(cliente);
    this.notaMasivaCantidad.set(cantidad);
    this.notaMasivaTexto = '';
    this.notaMasivaFechaCompromiso = '';
  }

  cerrarNotaMasivaModal() {
    this.notaMasivaCliente.set(null);
    this.notaMasivaCantidad.set(0);
    this.notaMasivaTexto = '';
    this.notaMasivaFechaCompromiso = '';
  }

  guardarNotaMasiva() {
    const cliente = this.notaMasivaCliente();
    if (!cliente || !this.notaMasivaTexto.trim()) return;
    const targets = this.facturas().filter(f => f.cliente === cliente);
    if (targets.length === 0) return;

    let completadas = 0;
    let errores = 0;
    const total = targets.length;
    targets.forEach(f => {
      this.carteraSvc.agregarComentario(f.id, {
        texto: this.notaMasivaTexto.trim(),
        nuevaFechaCompromiso: this.notaMasivaFechaCompromiso || undefined,
      }).pipe(
        catchError(() => {
          errores++;
          return of(null);
        })
      ).subscribe(r => {
        if (r) completadas++;
        if (completadas + errores === total) {
          if (errores > 0) {
            this.notifSvc.error(`Nota aplicada a ${completadas} de ${total} factura(s) (${errores} error(es))`);
          } else {
            this.notifSvc.success(`Nota aplicada a ${completadas} factura(s)`);
          }
          this.cerrarNotaMasivaModal();
        }
      });
    });
  }

  // ── History ──

  abrirHistorialModal(factura: FacturaDto) {
    this.historialModalFactura.set(factura);
    this.carteraSvc.getComentarios(factura.id).pipe(
      catchError(() => of([]))
    ).subscribe(r => this.historialNotas.set(r));
  }

  estadoBg(estado: string | undefined): string {
    const map: Record<string, string> = {
      radicado: '#ecfdf5',
      anulada: '#fef2f2',
      vencida: '#fef2f2',
      confirmada: '#ecfdf5',
      pendiente: '#fffbeb',
      cancelada: '#f1f5f9',
    };
    return map[estado ?? ''] ?? '#f5f3ff';
  }

  estadoText(estado: string | undefined): string {
    const map: Record<string, string> = {
      radicado: '#065f46',
      anulada: '#991b1b',
      vencida: '#991b1b',
      confirmada: '#065f46',
      pendiente: '#92400e',
      cancelada: '#475569',
    };
    return map[estado ?? ''] ?? '#5b21b6';
  }

  cerrarHistorialModal() {
    this.historialModalFactura.set(null);
    this.historialNotas.set([]);
  }
}
