import { Component, Input, OnChanges, signal, computed } from '@angular/core';
import { HeatmapGmResponseDto } from '../../../../core/models/graficas.models';

interface HeatmapRow { cliente: string; valores: Record<string, number>; prom: number | null; }

const RANGES = [
  { label: '≥45%',    min: 45,  bg: '#15803d', text: '#fff' },
  { label: '40–44%',  min: 40,  bg: '#16a34a', text: '#fff' },
  { label: '35–39%',  min: 35,  bg: '#86efac', text: '#14532d' },
  { label: '30–34%',  min: 30,  bg: '#fef08a', text: '#713f12' },
  { label: '20–29%',  min: 20,  bg: '#fed7aa', text: '#7c2d12' },
  { label: '<20%',    min: -Infinity, bg: '#fca5a5', text: '#7f1d1d' },
];

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function mesAbrev(periodo: string): string {
  const m = periodo.match(/^(\d{4})-(\d{2})$/);
  return m ? MESES_ABREV[+m[2] - 1] ?? periodo : periodo;
}

function gmStyle(gm: number): { bg: string; text: string } {
  for (const r of RANGES) if (gm >= r.min) return { bg: r.bg, text: r.text };
  return { bg: '#fca5a5', text: '#7f1d1d' };
}

@Component({
  selector: 'app-heatmap',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">

      <!-- Header -->
      <div class="mb-3">
        <h3 class="text-sm font-semibold text-slate-800">
          Heatmap GM% por Cliente
          @if (rows().length > 0) {
            <span class="font-normal text-slate-400">({{ rows().length }} clientes)</span>
          }
        </h3>
      </div>

      <!-- Leyenda de rangos -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        @for (r of ranges; track r.label) {
          <span class="flex items-center gap-1.5 text-xs text-slate-600">
            <span class="w-3 h-3 rounded-sm flex-shrink-0" [style.background]="r.bg"></span>
            {{ r.label }}
          </span>
        }
        <span class="flex items-center gap-1.5 text-xs text-slate-600">
          <span class="w-3 h-3 rounded-sm border border-slate-200 flex-shrink-0"></span>
          Sin dato
        </span>
      </div>

      @if (!data?.celdas?.length) {
        <div class="flex items-center justify-center h-32 text-sm text-slate-400">
          Sin datos para los filtros seleccionados
        </div>
      } @else {
        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-2 pr-6 text-xs font-medium text-blue-600 w-52">Cliente</th>
                @for (p of periodos(); track p) {
                  <th class="text-center py-2 px-1 text-xs font-medium text-slate-500 min-w-[72px]">{{ mesAbrev(p) }}</th>
                }
                <th class="text-center py-2 px-1 text-xs font-semibold text-slate-600 min-w-[72px]">Prom.</th>
              </tr>
            </thead>
            <tbody>
              @for (row of paginatedRows(); track row.cliente) {
                <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td class="py-2 pr-6 text-xs text-slate-700 font-medium max-w-[200px] truncate" [title]="row.cliente">
                    {{ row.cliente }}
                  </td>
                  @for (p of periodos(); track p) {
                    <td class="py-1.5 px-0.5">
                      @if (row.valores[p] !== undefined) {
                        <div class="flex items-center justify-center rounded px-2 py-1.5 text-xs font-semibold leading-none"
                          [style.background]="gmStyle(row.valores[p]).bg"
                          [style.color]="gmStyle(row.valores[p]).text">
                          {{ row.valores[p].toFixed(1) }}%
                        </div>
                      } @else {
                        <div class="flex items-center justify-center text-xs text-slate-300">—</div>
                      }
                    </td>
                  }
                  <td class="py-1.5 px-0.5">
                    @if (row.prom !== null) {
                      <div class="flex items-center justify-center rounded px-2 py-1.5 text-xs font-bold leading-none"
                        [style.background]="gmStyle(row.prom!).bg"
                        [style.color]="gmStyle(row.prom!).text">
                        {{ row.prom!.toFixed(1) }}%
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Por página:</span>
            <select class="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              [value]="pageSize()" (change)="onPageSizeChange($event)">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>| {{ pageFrom() }}–{{ pageTo() }} de {{ rows().length }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button (click)="goPage(1)"            [disabled]="page() === 1"           class="pager-btn">«</button>
            <button (click)="goPage(page() - 1)"   [disabled]="page() === 1"           class="pager-btn">‹</button>
            @for (n of pageNumbers(); track n) {
              <button (click)="goPage(n)"
                class="pager-btn"
                [class.bg-blue-600]="n === page()"
                [class.!text-white]="n === page()"
                [class.border-blue-600]="n === page()">{{ n }}</button>
            }
            <button (click)="goPage(page() + 1)"   [disabled]="page() === totalPages()" class="pager-btn">›</button>
            <button (click)="goPage(totalPages())"  [disabled]="page() === totalPages()" class="pager-btn">»</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .pager-btn {
      @apply w-7 h-7 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center;
    }
  `],
})
export class HeatmapComponent implements OnChanges {
  @Input() data: HeatmapGmResponseDto | null = null;

  readonly ranges = RANGES;
  readonly mesAbrev = mesAbrev;
  readonly gmStyle = gmStyle;

  page     = signal(1);
  pageSize = signal(10);

  rows = signal<HeatmapRow[]>([]);
  periodos = signal<string[]>([]);

  totalPages  = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  pageFrom    = computed(() => Math.min((this.page() - 1) * this.pageSize() + 1, this.rows().length));
  pageTo      = computed(() => Math.min(this.page() * this.pageSize(), this.rows().length));
  paginatedRows = computed(() =>
    this.rows().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize())
  );
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.page();
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) pages.push(i);
    return pages;
  });

  ngOnChanges() {
    const celdas = this.data?.celdas;
    if (!celdas?.length) { this.rows.set([]); this.periodos.set([]); return; }

    const periodos = [...new Set(celdas.map(c => c.periodo ?? ''))].sort();
    this.periodos.set(periodos);

    const clienteMap = new Map<string, Record<string, number>>();
    for (const c of celdas) {
      const key = c.cliente ?? '';
      if (!clienteMap.has(key)) clienteMap.set(key, {});
      clienteMap.get(key)![c.periodo ?? ''] = c.gmPct;
    }

    const rows: HeatmapRow[] = [];
    clienteMap.forEach((valores, cliente) => {
      const vals = Object.values(valores);
      const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      rows.push({ cliente, valores, prom });
    });

    rows.sort((a, b) => (b.prom ?? 0) - (a.prom ?? 0));
    this.rows.set(rows);
    this.page.set(1);
  }

  goPage(n: number) {
    const clamped = Math.max(1, Math.min(n, this.totalPages()));
    this.page.set(clamped);
  }

  onPageSizeChange(e: Event) {
    this.pageSize.set(Number((e.target as HTMLSelectElement).value));
    this.page.set(1);
  }
}
