import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';
import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  FacturaDto,
  ComentarioDto,
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
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Facturación</h1>
        <p class="text-sm text-slate-500 mt-0.5">Control de facturas de clientes</p>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas por Cobrar</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{{ resumen().facturasPorCobrar | number }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas Vencidas</p>
          <p class="text-2xl font-bold text-red-600 mt-1">{{ resumen().facturasVencidas | number }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas Confirmadas</p>
          <p class="text-2xl font-bold text-emerald-600 mt-1">{{ resumen().facturasConfirmadas | number }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide font-medium">Facturas con Diferencia</p>
          <p class="text-2xl font-bold text-amber-600 mt-1">{{ resumen().facturasConDiferencia | number }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div class="grid grid-cols-2 gap-4 items-end">
          <div class="flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Buscar</label>
            <input
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nombre o Nº de cliente..."
              [ngModel]="filtroBusqueda()"
              (ngModelChange)="filtroBusqueda.set($event); cargarFacturas()"
            />
          </div>
          <div class="flex flex-col gap-1">
            <app-filter-dropdown
              label="Estado"
              [options]="estadoOptions"
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
                  <td class="px-4 py-3 text-right font-medium text-slate-900">{{ factura.monto | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ factura.fechaVencimiento | date:'shortDate' }}</td>
                  <td class="px-4 py-3 text-right text-slate-400">—</td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ factura.retencion | number:'1.2-2' }}</td>
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
                  <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-400">
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

    </div>

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

  resumen = signal({ facturasPorCobrar: 0, facturasVencidas: 0, facturasConfirmadas: 0, facturasConDiferencia: 0 });
  facturas = signal<FacturaDto[]>([]);

  filtroBusqueda = signal('');
  filtroEstado = signal<(string | number)[]>([]);
  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.facturas().length / this.pageSize)));
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
    return this.facturas().slice(start, start + this.pageSize);
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
  }

  onEstadoChange(vals: (string | number)[]) {
    this.filtroEstado.set(vals);
    this.currentPage.set(1);
    this.cargarFacturas();
  }

  cargarFacturas() {
    const busqueda = this.filtroBusqueda();
    this.carteraSvc.getHistoricoFacturas(busqueda || undefined).pipe(
      catchError(() => of([]))
    ).subscribe(r => {
      this.facturas.set(r);
      this.currentPage.set(1);
      const total = r.reduce((s, f) => s + f.monto, 0);
      const vencidas = r.filter(f => f.estado === 'Vencida').reduce((s, f) => s + f.monto, 0);
      const confirmadas = r.filter(f => f.estado === 'Confirmada').reduce((s, f) => s + f.monto, 0);
      this.resumen.set({
        facturasPorCobrar: total,
        facturasVencidas: vencidas,
        facturasConfirmadas: confirmadas,
        facturasConDiferencia: 0,
      });
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
      catchError(() => of(null))
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
    targets.forEach(f => {
      this.carteraSvc.agregarComentario(f.id, {
        texto: this.notaMasivaTexto.trim(),
        nuevaFechaCompromiso: this.notaMasivaFechaCompromiso || undefined,
      }).pipe(catchError(() => of(null))).subscribe(r => {
        if (r) completadas++;
        if (completadas === targets.length) {
          this.notifSvc.success(`Nota aplicada a ${completadas} factura(s)`);
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

  cerrarHistorialModal() {
    this.historialModalFactura.set(null);
    this.historialNotas.set([]);
  }
}
