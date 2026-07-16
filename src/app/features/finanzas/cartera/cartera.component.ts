import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as echarts from 'echarts';
import { EchartsDirective } from '../../../shared/directives/echarts.directive';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';
import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CarteraFiltrosParams,
  CarteraResumenDto,
  CarteraClienteDto,
  ProyeccionPagoDto,
  FacturaDto,
  SeguimientoUrgenteDto,
  ProgramacionPagoDto,
  FechaReprogramadaDto,
  ComentarioDto,
} from '../../../core/models/cartera.models';

@Component({
  selector: 'app-cartera',
  standalone: true,
  imports: [EchartsDirective, FilterDropdownComponent, DatePipe, DecimalPipe],
  template: `
    <!-- Modal Detalle de Pago -->
    @if (modalPago()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="cerrarPago()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Detalle de Pago</h3>
                <p class="text-sm text-slate-500 mt-0.5">{{ modalPago()!.factura }}</p>
              </div>
              <button (click)="cerrarPago()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="px-6 py-5 space-y-4 flex-1">
            @let p = modalPago()!;
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Factura</p>
                <p class="text-sm text-slate-700 mt-1">{{ p.factura }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Cliente</p>
                <p class="text-sm text-slate-700 mt-1">{{ p.cliente }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Monto</p>
                <p class="text-sm text-slate-700 mt-1">{{ formatMonto(p.monto) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Fecha Vencimiento</p>
                <p class="text-sm text-slate-700 mt-1">{{ p.fechaVencimiento | date:'shortDate' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Fecha Compromiso</p>
                <p class="text-sm text-slate-700 mt-1">{{ formatFechaCompromiso(p.fechaCompromiso) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Categoria</p>
                <span class="inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  [class.bg-green-100]="p.categoria === 'En Tiempo'"
                  [class.text-green-700]="p.categoria === 'En Tiempo'"
                  [class.bg-yellow-100]="p.categoria === '0-15 dias' || p.categoria === '16-30 dias'"
                  [class.text-yellow-700]="p.categoria === '0-15 dias' || p.categoria === '16-30 dias'"
                  [class.bg-red-100]="p.categoria === '31-60 dias' || p.categoria === '61-90 dias' || p.categoria === '91-120 dias'"
                  [class.text-red-700]="p.categoria === '31-60 dias' || p.categoria === '61-90 dias' || p.categoria === '91-120 dias'"
                >{{ p.categoria }}</span>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Semana</p>
                <p class="text-sm text-slate-700 mt-1">{{ p.semanaFormateada || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Valor Semanal</p>
                <p class="text-sm text-slate-700 mt-1">{{ formatMonto(p.importeMonedaLocal) }}</p>
              </div>
            </div>
          </div>
          <div class="px-6 pb-6 pt-2 flex-shrink-0">
            <button (click)="cerrarPago()"
              class="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Página -->
    <div class="p-6 space-y-6 max-w-screen-2xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Cartera</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gestión de tesorería y seguimiento de facturación</p>
        </div>
      </div>

      <!-- Search & Currency row -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div class="flex items-end gap-4">
          <div class="flex-1">
            <app-filter-dropdown
              label="Buscar Cliente"
              [options]="clientesOptions()"
              [selectedValues]="selClienteFiltro()"
              (selectionChange)="onClienteFiltroChange($event)"
            />
          </div>
          <div class="w-40">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Moneda</label>
            <select
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [value]="moneda()" (change)="onMonedaChange($event)">
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Resumen cards -->
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Facturas por Cobrar</p>
          <p class="text-2xl font-bold text-slate-900 mt-2">{{ formatMonto(resumen()?.facturasPorCobrar ?? 0) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Facturas Vencidas</p>
          <p class="text-2xl font-bold text-red-600 mt-2">{{ formatMonto(resumen()?.facturasVencidas ?? 0) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Facturas Confirmadas</p>
          <p class="text-2xl font-bold text-green-600 mt-2">{{ formatMonto(resumen()?.facturasConfirmadas ?? 0) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Facturas con Diferencia</p>
          <p class="text-2xl font-bold text-orange-600 mt-2">{{ totalConDiferencia() | number }}</p>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h2 class="text-sm font-semibold text-slate-900 mb-3">Proyección de Pagos</h2>
          <div class="h-72" [appEcharts]="proyeccionPagosOption()"></div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h2 class="text-sm font-semibold text-slate-900 mb-3">Cartera por Cliente</h2>
          @if (selectedCategoria()) {
            <button (click)="selectedCategoria.set(null)"
              class="mb-2 text-xs text-blue-600 hover:text-blue-800 transition-colors">
              Limpiar filtro: {{ selectedCategoria() }}
            </button>
          }
          <div class="h-72" [appEcharts]="carteraClienteOption()" (chartClick)="onCategoriaClick($event)"></div>
        </div>
      </div>

      <!-- Alert buttons -->
      <div class="flex gap-3">
        <button (click)="enviarAlerta('Vencidas')" [disabled]="alertasEnviando()"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          @if (alertasEnviando()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          }
          Alertar Vencidas
        </button>
        <button (click)="enviarAlerta('Diferencias')" [disabled]="alertasEnviando()"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          @if (alertasEnviando()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          }
          Alertar Diferencias
        </button>
      </div>

      <!-- Seguimiento Urgente por Cliente -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-sm font-semibold text-slate-900">Seguimiento Urgente por Cliente</h2>
            <div class="w-56">
              <input type="text" placeholder="Buscar cliente..."
                class="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                [value]="seguimientoSearch()"
                (input)="onSeguimientoSearch($any($event.target).value)"
              />
            </div>
          </div>
        </div>
        @if (seguimientoFiltrados().length === 0) {
          <div class="py-10 text-center text-sm text-slate-400">Sin seguimiento urgente</div>
        } @else {
          <div class="p-5 space-y-3">
            @for (item of seguimientoPaginados(); track item.cliente) {
              <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button (click)="toggleSeguimientoExpand(item.cliente)"
                  class="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <svg class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
                        [class.rotate-180]="seguimientoExpandido() === item.cliente"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                      <p class="text-sm font-semibold text-slate-900 truncate">{{ item.razonSocial || item.cliente }}</p>
                    </div>
                    <div class="flex items-center gap-4 flex-shrink-0 text-sm">
                      <span class="text-red-600 font-semibold">{{ seguimientoMaxDias(item) }} d vencida</span>
                      <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{{ item.facturas.length }} factura(s)</span>
                    </div>
                  </div>
                </button>
                @if (seguimientoExpandido() === item.cliente) {
                  <div class="border-t border-slate-100 px-5 py-3 space-y-2 max-h-72 overflow-y-auto">
                    @for (f of item.facturas; track f.id) {
                      <div class="flex items-center justify-between gap-3 py-1.5">
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="text-sm font-semibold text-blue-600 truncate">{{ f.factura }}</span>
                          <span class="text-sm text-slate-500 flex-shrink-0">Vence: {{ f.fechaVencimiento | date:'shortDate' }}</span>
                        </div>
                        <div class="flex items-center gap-4 flex-shrink-0 text-sm">
                          <span class="font-semibold text-slate-900">{{ formatMonto(f.monto) }}</span>
                          <span class="text-red-600">{{ f.diasMora }} d vencida</span>
                          <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                            [class.bg-yellow-100]="f.estado === 'PorVencer'"
                            [class.text-yellow-700]="f.estado === 'PorVencer'"
                            [class.bg-red-100]="f.estado === 'Vencida'"
                            [class.text-red-700]="f.estado === 'Vencida'"
                            [class.bg-green-100]="f.estado === 'Pagada'"
                            [class.text-green-700]="f.estado === 'Pagada'"
                            [class.bg-slate-100]="f.estado !== 'PorVencer' && f.estado !== 'Vencida' && f.estado !== 'Pagada'"
                            [class.text-slate-600]="f.estado !== 'PorVencer' && f.estado !== 'Vencida' && f.estado !== 'Pagada'"
                          >{{ f.estado }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
          @if (seguimientoTotalPages() > 1) {
            <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ seguimientoFiltrados().length }} registro(s)</span>
              <div class="flex items-center gap-1">
                <button (click)="seguimientoIrPagina(seguimientoPage() - 1)" [disabled]="seguimientoPage() === 1"
                  class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>
                @for (p of seguimientoPaginas(); track p) {
                  <button (click)="seguimientoIrPagina(p)"
                    class="w-7 h-7 rounded text-xs font-medium transition-colors"
                    [class.bg-blue-600]="seguimientoPage() === p"
                    [class.text-white]="seguimientoPage() === p"
                    [class.bg-slate-100]="seguimientoPage() !== p"
                    [class.text-slate-600]="seguimientoPage() !== p"
                    [class.hover:bg-slate-200]="seguimientoPage() !== p"
                  >{{ p }}</button>
                }
                <button (click)="seguimientoIrPagina(seguimientoPage() + 1)" [disabled]="seguimientoPage() === seguimientoTotalPages()"
                  class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Fechas Reprogramadas -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100">
          <h2 class="text-sm font-semibold text-slate-900">Fechas Reprogramadas</h2>
        </div>
        @if (fechasReprogramadas().length === 0) {
          <div class="py-10 text-center text-sm text-slate-400">Sin fechas reprogramadas</div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (f of fechasReprogramadas(); track f.factura + f.nuevaFechaCompromiso) {
              <div class="px-5 py-3.5 flex items-center justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ f.factura }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ f.cliente }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-sm text-green-600 font-semibold">{{ f.nuevaFechaCompromiso | date:'shortDate' }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ f.autor }} · {{ f.fecha | date:'shortDate' }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Histórico de Facturas por Cliente -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Histórico de Facturas por Cliente</h2>
          <div class="w-56">
            <app-filter-dropdown
              label="Cliente"
              [options]="clientesOptions()"
              [selectedValues]="selHistoricoClientes()"
              (selectionChange)="onHistoricoClienteChange($event)"
            />
          </div>
        </div>
        <div class="p-5">
          @if (historicoFacturas().length === 0) {
            <div class="py-10 text-center text-sm text-slate-400">No hay facturas disponibles</div>
          } @else {
            @if (selHistoricoClientes().length > 0) {
              <div class="mb-6 flex justify-center">
                <div class="h-64 w-full max-w-lg" [appEcharts]="historicoChartOption()"></div>
              </div>
            }
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    <th class="px-3 py-2.5 text-left">N° Factura</th>
                    <th class="px-3 py-2.5 text-left">Cliente</th>
                    <th class="px-3 py-2.5 text-left">Emision</th>
                    <th class="px-3 py-2.5 text-left">Vencimiento</th>
                    <th class="px-3 py-2.5 text-right">Monto</th>
                    <th class="px-3 py-2.5 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of historicoPaginados(); track f.id) {
                    <tr class="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                      <td class="px-3 py-2.5 text-sm text-slate-700">{{ f.factura }}</td>
                      <td class="px-3 py-2.5 text-sm text-slate-700">{{ f.cliente }}</td>
                      <td class="px-3 py-2.5 text-sm text-slate-500">{{ f.fechaEmision | date:'shortDate' }}</td>
                      <td class="px-3 py-2.5 text-sm text-slate-500">{{ f.fechaVencimiento | date:'shortDate' }}</td>
                      <td class="px-3 py-2.5 text-sm text-slate-700 text-right">{{ formatMonto(f.monto) }}</td>
                      <td class="px-3 py-2.5">
                        <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                          [class.bg-yellow-100]="f.estado === 'PorVencer'"
                          [class.text-yellow-700]="f.estado === 'PorVencer'"
                          [class.bg-red-100]="f.estado === 'Vencida'"
                          [class.text-red-700]="f.estado === 'Vencida'"
                          [class.bg-green-100]="f.estado === 'Pagada'"
                          [class.text-green-700]="f.estado === 'Pagada'"
                          [class.bg-slate-100]="f.estado !== 'PorVencer' && f.estado !== 'Vencida' && f.estado !== 'Pagada'"
                          [class.text-slate-600]="f.estado !== 'PorVencer' && f.estado !== 'Vencida' && f.estado !== 'Pagada'"
                        >{{ f.estado }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (historicoTotalPages() > 1) {
              <div class="px-0 py-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs text-slate-400">{{ historicoFacturas().length }} registro(s)</span>
                <div class="flex items-center gap-1">
                  <button (click)="historicoIrPagina(historicoPage() - 1)" [disabled]="historicoPage() === 1"
                    class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  @for (p of historicoPaginas(); track p) {
                    <button (click)="historicoIrPagina(p)"
                      class="w-7 h-7 rounded text-xs font-medium transition-colors"
                      [class.bg-blue-600]="historicoPage() === p"
                      [class.text-white]="historicoPage() === p"
                      [class.bg-slate-100]="historicoPage() !== p"
                      [class.text-slate-600]="historicoPage() !== p"
                      [class.hover:bg-slate-200]="historicoPage() !== p"
                    >{{ p }}</button>
                  }
                  <button (click)="historicoIrPagina(historicoPage() + 1)" [disabled]="historicoPage() === historicoTotalPages()"
                    class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Programación de Pagos -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Programación de Pagos</h2>
          <button (click)="exportarProgramacion()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Exportar Excel
          </button>
        </div>
        @if (programacionPagos().length === 0) {
          <div class="py-10 text-center text-sm text-slate-400">Sin pagos programados</div>
        } @else {
          <div class="px-5 py-4 flex flex-wrap gap-2 border-b border-slate-100">
            <button (click)="filtrarPorCategoria(null)"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-blue-600]="!selectedCategoria()"
              [class.text-white]="!selectedCategoria()"
              [class.bg-blue-100]="selectedCategoria()"
              [class.text-blue-700]="selectedCategoria()">Todos ({{ programacionPagos().length }})</button>
            <button (click)="filtrarPorCategoria('En Tiempo')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-green-600]="selectedCategoria() === 'En Tiempo'"
              [class.text-white]="selectedCategoria() === 'En Tiempo'"
              [class.bg-green-100]="selectedCategoria() !== 'En Tiempo'"
              [class.text-green-700]="selectedCategoria() !== 'En Tiempo'">En Tiempo ({{ progCategoriaCount('En Tiempo') }})</button>
            <button (click)="filtrarPorCategoria('0-15 dias')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-yellow-600]="selectedCategoria() === '0-15 dias'"
              [class.text-white]="selectedCategoria() === '0-15 dias'"
              [class.bg-yellow-100]="selectedCategoria() !== '0-15 dias'"
              [class.text-yellow-700]="selectedCategoria() !== '0-15 dias'">0-15 dias ({{ progCategoriaCount('0-15 dias') }})</button>
            <button (click)="filtrarPorCategoria('16-30 dias')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-orange-600]="selectedCategoria() === '16-30 dias'"
              [class.text-white]="selectedCategoria() === '16-30 dias'"
              [class.bg-orange-100]="selectedCategoria() !== '16-30 dias'"
              [class.text-orange-700]="selectedCategoria() !== '16-30 dias'">16-30 dias ({{ progCategoriaCount('16-30 dias') }})</button>
            <button (click)="filtrarPorCategoria('31-60 dias')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-red-600]="selectedCategoria() === '31-60 dias'"
              [class.text-white]="selectedCategoria() === '31-60 dias'"
              [class.bg-red-100]="selectedCategoria() !== '31-60 dias'"
              [class.text-red-700]="selectedCategoria() !== '31-60 dias'">31-60 dias ({{ progCategoriaCount('31-60 dias') }})</button>
            <button (click)="filtrarPorCategoria('61-90 dias')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-red-700]="selectedCategoria() === '61-90 dias'"
              [class.text-white]="selectedCategoria() === '61-90 dias'"
              [class.bg-red-200]="selectedCategoria() !== '61-90 dias'"
              [class.text-red-800]="selectedCategoria() !== '61-90 dias'">61-90 dias ({{ progCategoriaCount('61-90 dias') }})</button>
            <button (click)="filtrarPorCategoria('91-120 dias')"
              class="inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-red-800]="selectedCategoria() === '91-120 dias'"
              [class.text-white]="selectedCategoria() === '91-120 dias'"
              [class.bg-red-300]="selectedCategoria() !== '91-120 dias'"
              [class.text-red-900]="selectedCategoria() !== '91-120 dias'">91-120 dias ({{ progCategoriaCount('91-120 dias') }})</button>
          </div>
          <div class="px-5 py-3 border-b border-slate-100">
            <input type="text" placeholder="Buscar por cliente o factura..."
              class="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [value]="progPagosSearch()"
              (input)="onProgPagosSearch($any($event.target).value)"
            />
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                  <th class="px-3 py-3 text-left whitespace-nowrap">Factura</th>
                  <th class="px-3 py-3 text-left whitespace-nowrap">Cliente</th>
                  <th class="px-3 py-3 text-left whitespace-nowrap">Monto</th>
                  <th class="px-3 py-3 text-left whitespace-nowrap">Fecha Vencimiento</th>
                  <th class="px-3 py-3 text-left whitespace-nowrap">Fecha Compromiso</th>
                  <th class="px-3 py-3 text-right whitespace-nowrap">Dias</th>
                  <th class="px-3 py-3 text-left whitespace-nowrap">Categoria</th>
                  @for (sem of semanasUnicas(); track sem) {
                    <th class="px-3 py-3 text-right text-[10px] whitespace-nowrap">{{ sem }}</th>
                  }
                  <th class="px-3 py-3 text-center w-12 whitespace-nowrap">Notas</th>
                </tr>
              </thead>
              <tbody>
                @for (pago of progPagosPaginados(); track pago.id) {
                  <tr class="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td class="px-3 py-3 text-sm text-slate-700 whitespace-nowrap">{{ pago.factura }}</td>
                    <td class="px-3 py-3 text-sm text-slate-700 whitespace-nowrap">{{ pago.cliente }}</td>
                    <td class="px-3 py-3 text-sm text-slate-700 text-right whitespace-nowrap">{{ formatMonto(pago.monto) }}</td>
                    <td class="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{{ pago.fechaVencimiento | date:'shortDate' }}</td>
                    <td class="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{{ formatFechaCompromiso(pago.fechaCompromiso) }}</td>
                    <td class="px-4 py-3 text-sm text-right whitespace-nowrap"
                      [class.text-red-600]="pago.dias > 0"
                      [class.text-green-600]="pago.dias <= 0"
                    >{{ pago.dias }}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="pago.categoria === 'En Tiempo'"
                        [class.text-green-700]="pago.categoria === 'En Tiempo'"
                        [class.bg-yellow-100]="pago.categoria === '0-15 dias'"
                        [class.text-yellow-700]="pago.categoria === '0-15 dias'"
                        [class.bg-orange-100]="pago.categoria === '16-30 dias'"
                        [class.text-orange-700]="pago.categoria === '16-30 dias'"
                        [class.bg-red-100]="pago.categoria === '31-60 dias' || pago.categoria === '61-90 dias' || pago.categoria === '91-120 dias'"
                        [class.text-red-700]="pago.categoria === '31-60 dias' || pago.categoria === '61-90 dias' || pago.categoria === '91-120 dias'"
                      >{{ pago.categoria }}</span>
                    </td>
                    @for (sem of semanasUnicas(); track sem) {
                      <td class="px-3 py-3 text-sm text-right text-slate-700 whitespace-nowrap"
                        [class.font-semibold]="pago.semanaFormateada === sem"
                      >{{ pago.semanaFormateada === sem ? formatMonto(pago.importeMonedaLocal) : '—' }}</td>
                    }
                    <td class="px-3 py-3 text-center whitespace-nowrap">
                      <button (click)="abrirHistorialNotas(pago)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Historial de notas">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (progPagosTotalPages() > 1) {
            <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ progPagosFiltrados().length }} registro(s)</span>
              <div class="flex items-center gap-1">
                <button (click)="progPagosIrPagina(progPagosPage() - 1)" [disabled]="progPagosPage() === 1"
                  class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>
                @for (p of progPagosPaginas(); track p) {
                  <button (click)="progPagosIrPagina(p)"
                    class="w-7 h-7 rounded text-xs font-medium transition-colors"
                    [class.bg-blue-600]="progPagosPage() === p"
                    [class.text-white]="progPagosPage() === p"
                    [class.bg-slate-100]="progPagosPage() !== p"
                    [class.text-slate-600]="progPagosPage() !== p"
                    [class.hover:bg-slate-200]="progPagosPage() !== p"
                  >{{ p }}</button>
                }
                <button (click)="progPagosIrPagina(progPagosPage() + 1)" [disabled]="progPagosPage() === progPagosTotalPages()"
                  class="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          }
        }
      </div>

    </div>

    <!-- Note History Modal -->
    @if (notasModalFactura()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="cerrarHistorialNotas()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              Historial de notas — {{ notasModalFactura()!.factura }}
            </h3>
            <button (click)="cerrarHistorialNotas()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 flex-1 overflow-y-auto space-y-3">
            @if (notasHistorial().length === 0) {
              <p class="text-sm text-slate-400 text-center py-4">Sin notas registradas</p>
            }
            @for (nota of notasHistorial(); track nota.id) {
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
            <button (click)="cerrarHistorialNotas()" class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CarteraComponent implements OnInit {
  private readonly carteraSvc = inject(CarteraService);
  private readonly notifSvc = inject(NotificationService);

  readonly moneda = signal('COP');
  readonly selClienteFiltro = signal<(string | number)[]>([]);
  private readonly allClientesOptions = signal<string[]>([]);
  readonly filtros = signal<CarteraFiltrosParams>({ Moneda: 'COP' });

  readonly resumen = signal<CarteraResumenDto | null>(null);
  readonly totalConDiferencia = signal(0);
  readonly carteraClientes = signal<CarteraClienteDto[]>([]);
  readonly carteraCategorias = signal<CarteraClienteDto[]>([]);
  readonly proyeccionPagos = signal<ProyeccionPagoDto[]>([]);
  readonly seguimientoUrgente = signal<SeguimientoUrgenteDto[]>([]);
  readonly historicoFacturas = signal<FacturaDto[]>([]);
  readonly programacionPagos = signal<ProgramacionPagoDto[]>([]);
  readonly fechasReprogramadas = signal<FechaReprogramadaDto[]>([]);
  readonly alertasEnviando = signal(false);

  readonly selHistoricoClientes = signal<(string | number)[]>([]);
  readonly historicoPage = signal(1);
  readonly historicoPageSize = 10;
  readonly historicoTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.historicoFacturas().length / this.historicoPageSize))
  );
  readonly historicoPaginas = computed(() => {
    const total = this.historicoTotalPages();
    const curr = this.historicoPage();
    const pages: number[] = [];
    const start = Math.max(1, curr - 2);
    const end = Math.min(total, curr + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });
  readonly historicoPaginados = computed(() => {
    const start = (this.historicoPage() - 1) * this.historicoPageSize;
    return this.historicoFacturas().slice(start, start + this.historicoPageSize);
  });
  readonly seguimientoExpandido = signal<string | null>(null);
  readonly seguimientoSearch = signal('');
  readonly seguimientoPage = signal(1);
  readonly seguimientoPageSize = 10;
  readonly selectedCategoria = signal<string | null>(null);

  readonly seguimientoFiltrados = computed(() => {
    const texto = this.seguimientoSearch().toLowerCase();
    if (!texto) return this.seguimientoUrgente();
    return this.seguimientoUrgente().filter(s => s.cliente.toLowerCase().includes(texto));
  });

  readonly seguimientoTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.seguimientoFiltrados().length / this.seguimientoPageSize))
  );

  readonly seguimientoPaginas = computed(() => {
    const total = this.seguimientoTotalPages();
    const curr = this.seguimientoPage();
    const pages: number[] = [];
    const start = Math.max(1, curr - 2);
    const end = Math.min(total, curr + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly seguimientoPaginados = computed(() => {
    const start = (this.seguimientoPage() - 1) * this.seguimientoPageSize;
    return this.seguimientoFiltrados().slice(start, start + this.seguimientoPageSize);
  });

  readonly progPagosSearch = signal('');
  readonly progPagosPage = signal(1);
  readonly progPagosPageSize = 10;

  readonly progPagosFiltrados = computed(() => {
    const texto = this.progPagosSearch().toLowerCase();
    const cat = this.selectedCategoria();
    let result = this.programacionPagos();
    if (cat) {
      result = result.filter(p => p.categoria === cat);
    }
    if (texto) {
      result = result.filter(p =>
        p.cliente.toLowerCase().includes(texto) || p.factura.toLowerCase().includes(texto)
      );
    }
    return result;
  });

  readonly progPagosTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.progPagosFiltrados().length / this.progPagosPageSize))
  );

  readonly progPagosPaginas = computed(() => {
    const total = this.progPagosTotalPages();
    const curr = this.progPagosPage();
    const pages: number[] = [];
    const start = Math.max(1, curr - 2);
    const end = Math.min(total, curr + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly progPagosPaginados = computed(() => {
    const start = (this.progPagosPage() - 1) * this.progPagosPageSize;
    return this.progPagosFiltrados().slice(start, start + this.progPagosPageSize);
  });

  readonly semanasUnicas = computed(() => {
    const set = new Set<string>();
    for (const p of this.progPagosFiltrados()) {
      if (p.semanaFormateada) set.add(p.semanaFormateada);
    }
    return [...set].sort();
  });

  readonly modalPago = signal<ProgramacionPagoDto | null>(null);
  readonly notifDropdownOpen = signal(false);
  readonly notasModalFactura = signal<ProgramacionPagoDto | null>(null);
  readonly notasHistorial = signal<ComentarioDto[]>([]);

  abrirHistorialNotas(pago: ProgramacionPagoDto): void {
    this.notasModalFactura.set(pago);
    this.notasHistorial.set([]);
    this.carteraSvc.getComentarios(pago.id).subscribe({
      next: (notas: ComentarioDto[]) => this.notasHistorial.set(notas),
      error: () => this.notasHistorial.set([]),
    });
  }

  cerrarHistorialNotas(): void {
    this.notasModalFactura.set(null);
    this.notasHistorial.set([]);
  }

  readonly clientesOptions = computed(() => {
    const names = this.allClientesOptions();
    if (names.length > 0) return names;
    const fallback = new Set<string>();
    this.historicoFacturas().forEach(f => fallback.add(f.cliente));
    this.carteraClientes().forEach(c => fallback.add(c.cliente));
    this.seguimientoUrgente().forEach(s => fallback.add(s.cliente));
    this.programacionPagos().forEach(p => fallback.add(p.cliente));
    return [...fallback].sort();
  });

  readonly proyeccionPagosOption = computed<echarts.EChartsOption>(() => {
    const data = this.proyeccionPagos();
    const fmt = (v: number) => this.formatMonto(v);
    const total = data.reduce((s, d) => s + d.monto, 0);
    const palette = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#4f46e5'];
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          const d = data.find(x => x.razonSocial === p.name);
          return `<strong>${p.name}</strong><br/>${fmt(p.value)}<br/><b>${pct}%</b> del total<br/>${d?.facturasPendientes ?? 0} facturas pendientes`;
        },
      },
      series: [{
        type: 'treemap',
        roam: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (p: any) => `${p.name}\n${fmt(p.value)}`,
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowBlur: 2,
        },
        upperLabel: {
          show: true,
          height: 24,
          formatter: (p: any) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
            return `${pct}%`;
          },
          fontSize: 13,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowBlur: 2,
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        levels: [{
          colorMappingBy: 'value',
        }],
        data: data.map((d, i) => ({
          name: d.razonSocial,
          value: d.monto,
          itemStyle: { color: palette[i % palette.length] },
        })),
      }],
    };
  });

  readonly carteraClienteOption = computed<echarts.EChartsOption>(() => {
    const data = this.carteraCategorias();
    const selected = this.selectedCategoria();
    const fmt = (v: number) => this.formatMonto(v);
    const total = data.reduce((s, d) => s + d.montoTotal, 0);
    const palette = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#4f46e5'];
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          const d = data.find(x => x.cliente === p.name);
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          return `<strong>${p.name}</strong><br/>${fmt(p.value)}<br/><b>${pct}%</b> del total<br/>${d?.facturasPendientes ?? 0} facturas`;
        },
      },
      series: [{
        type: 'treemap',
        roam: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (p: any) => `${p.name}\n${fmt(p.value)}`,
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowBlur: 2,
        },
        upperLabel: {
          show: true,
          height: 24,
          formatter: (p: any) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
            return `${pct}%`;
          },
          fontSize: 13,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowBlur: 2,
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        levels: [{
          colorMappingBy: 'value',
        }],
        data: data.map((d, i) => ({
          name: d.cliente,
          value: d.montoTotal,
          itemStyle: {
            color: palette[i % palette.length],
            ...(selected && d.cliente !== selected ? { opacity: 0.2, borderColor: '#e2e8f0' } : {}),
          },
        })),
      }],
    };
  });

  readonly historicoChartOption = computed<echarts.EChartsOption>(() => {
    const estados = new Map<string, number>();
    this.historicoFacturas().forEach(f => {
      estados.set(f.estado, (estados.get(f.estado) || 0) + f.monto);
    });
    const fmt = (v: number) => this.formatMonto(v);
    return {
      tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>${fmt(p.value)}<br/>${p.percent}%` },
      series: [{
        type: 'pie',
        radius: '60%',
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { label: { show: true, fontWeight: 'bold' } },
        data: [...estados.entries()].map(([name, value]) => ({ name, value })),
      }],
    };
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const f = this.filtros();
    const clientes = Array.isArray(f.Cliente) ? f.Cliente : (f.Cliente ? [f.Cliente] : []);
    const clientesStr = clientes.length > 0 ? clientes.join(',') : undefined;
    forkJoin({
      resumen: this.carteraSvc.getResumen(f).pipe(catchError(() => of(null))),
      resumenTotal: this.carteraSvc.getResumen({ Cliente: f.Cliente }).pipe(catchError(() => of(null))),
      carteraClientes: this.carteraSvc.getCarteraPorCliente(f).pipe(catchError(() => of([]))),
      carteraCategorias: this.carteraSvc.getCarteraPorCategoria(f).pipe(catchError(() => of([]))),
      proyeccionPagos: this.carteraSvc.getProyeccionPagos(f).pipe(catchError(() => of([]))),
      seguimientoUrgente: this.carteraSvc.getSeguimientoUrgente(clientesStr).pipe(catchError(() => of([]))),
      programacionPagos: this.carteraSvc.getProgramacionPagos(clientesStr).pipe(catchError(() => of([]))),
      fechasReprogramadas: this.carteraSvc.getFechasReprogramadas().pipe(catchError(() => of([]))),
      historicoFacturas: this.carteraSvc.getHistoricoFacturas(clientesStr).pipe(catchError(() => of([]))),
    }).subscribe({
      next: r => {
        this.resumen.set(r.resumen);
        this.totalConDiferencia.set(r.resumenTotal?.facturasConDiferencia ?? 0);
        this.carteraClientes.set(r.carteraClientes);
        this.carteraCategorias.set(r.carteraCategorias);
        this.proyeccionPagos.set(r.proyeccionPagos);
        this.seguimientoUrgente.set(r.seguimientoUrgente);
        this.programacionPagos.set(r.programacionPagos);
        this.fechasReprogramadas.set(r.fechasReprogramadas);
        this.historicoFacturas.set(r.historicoFacturas);
        this.historicoPage.set(1);
        if (this.allClientesOptions().length === 0) {
          const names = new Set<string>();
          r.carteraClientes?.forEach(c => names.add(c.cliente));
          r.seguimientoUrgente?.forEach(s => names.add(s.cliente));
          r.programacionPagos?.forEach(p => names.add(p.cliente));
          r.historicoFacturas?.forEach(f => names.add(f.cliente));
          this.allClientesOptions.set([...names].sort());
        }
      },
    });
  }

  onClienteFiltroChange(vals: (string | number)[]) {
    this.selClienteFiltro.set(vals);
    this.filtros.update(f => ({
      ...f,
      Cliente: vals.length > 0 ? vals.map(v => String(v)) : undefined,
    }));
    this.cargarDatos();
  }

  onMonedaChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.moneda.set(val);
    this.filtros.update(f => ({ ...f, Moneda: val }));
    this.cargarDatos();
  }

  onHistoricoClienteChange(vals: (string | number)[]) {
    this.selHistoricoClientes.set(vals);
    const cliente = vals.length === 1 ? String(vals[0]) : undefined;
    this.carteraSvc.getHistoricoFacturas(cliente).pipe(
      catchError(() => of([])),
    ).subscribe(data => {
      this.historicoFacturas.set(data);
      this.historicoPage.set(1);
    });
  }

  historicoIrPagina(p: number) {
    if (p >= 1 && p <= this.historicoTotalPages()) this.historicoPage.set(p);
  }

  enviarAlerta(tipo: 'Vencidas' | 'Diferencias') {
    this.alertasEnviando.set(true);
    this.carteraSvc.enviarAlerta(tipo, '').pipe(
      catchError(() => of({ enviado: false })),
    ).subscribe(r => {
      this.alertasEnviando.set(false);
      if (r.enviado) {
        this.notifSvc.success(`Alerta de ${tipo} enviada correctamente`);
      } else {
        this.notifSvc.error(`Error al enviar alerta de ${tipo}`);
      }
    });
  }

  toggleSeguimientoExpand(cliente: string) {
    this.seguimientoExpandido.set(this.seguimientoExpandido() === cliente ? null : cliente);
  }

  onSeguimientoSearch(texto: string) {
    this.seguimientoSearch.set(texto);
    this.seguimientoPage.set(1);
  }

  seguimientoIrPagina(p: number) {
    if (p >= 1 && p <= this.seguimientoTotalPages()) this.seguimientoPage.set(p);
  }

  onProgPagosSearch(texto: string) {
    this.progPagosSearch.set(texto);
    this.progPagosPage.set(1);
  }

  progCategoriaCount(categoria: string): number {
    return this.programacionPagos().filter(p => p.categoria === categoria).length;
  }

  exportarProgramacion() {
    this.carteraSvc.exportarProgramacionPagos().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'programacion_pagos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notifSvc.error('Error al exportar programación de pagos'),
    });
  }

  progPagosIrPagina(p: number) {
    if (p >= 1 && p <= this.progPagosTotalPages()) this.progPagosPage.set(p);
  }

  filtrarPorCategoria(categoria: string | null) {
    this.selectedCategoria.set(this.selectedCategoria() === categoria ? null : categoria);
    this.progPagosPage.set(1);
  }

  onCategoriaClick(e: { name: string; value: number }) {
    this.selectedCategoria.set(this.selectedCategoria() === e.name ? null : e.name);
  }

  seguimientoTotal(item: SeguimientoUrgenteDto): number {
    return item.facturas.reduce((sum, f) => sum + f.monto, 0);
  }

  seguimientoMaxDias(item: SeguimientoUrgenteDto): number {
    return Math.max(...item.facturas.map(f => f.diasMora), 0);
  }

  seleccionarPago(pago: ProgramacionPagoDto) {
    this.modalPago.set(pago);
  }

  cerrarPago() {
    this.modalPago.set(null);
  }

  toggleNotificaciones() {
    this.notifDropdownOpen.update(v => !v);
  }

  formatMonto(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: this.moneda(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  }

  formatFechaCompromiso(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return fecha;
  }
}
