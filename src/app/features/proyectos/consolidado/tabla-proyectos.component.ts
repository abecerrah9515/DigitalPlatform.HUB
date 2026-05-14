import { Component, Input, OnChanges, inject, signal, computed } from '@angular/core';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { ProyectosFilterParams, ProyectoDto } from '../../../core/models/proyectos.models';
import { PagedResult } from '../../../core/models/api.models';

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtMoneda(v: number, moneda: string): string {
  const abs  = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  const sym  = moneda === 'USD' ? 'US$' : '$';
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${sym}${Math.round(abs).toLocaleString('es-MX')}`;
}

@Component({
  selector: 'app-tabla-proyectos',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="text-sm font-semibold text-slate-800">Detalle de Proyectos</h3>
        @if (result()?.totalRegistros) {
          <p class="text-xs text-slate-400 mt-0.5">{{ result()!.totalRegistros.toLocaleString('es-MX') }} registros</p>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-16 gap-2 text-slate-400">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-sm">Cargando...</span>
        </div>
      } @else if (!result()?.items?.length) {
        <div class="py-16 text-center text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-xs whitespace-nowrap">
            <thead>
              <tr class="text-slate-400 uppercase tracking-wide text-[10px] border-b border-slate-100">
                <th class="px-4 py-3 text-left">Año</th>
                <th class="px-4 py-3 text-left">Mes</th>
                <th class="px-4 py-3 text-left">Industria</th>
                <th class="px-4 py-3 text-left">Cliente</th>
                <th class="px-4 py-3 text-left">Proyecto</th>
                <th class="px-4 py-3 text-left">CeBe</th>
                <th class="px-4 py-3 text-left">Responsable</th>
                <th class="px-4 py-3 text-left">Área</th>
                <th class="px-4 py-3 text-left">Sociedad</th>
                <th class="px-4 py-3 text-right">Ingreso</th>
                <th class="px-4 py-3 text-right">Costo</th>
                <th class="px-4 py-3 text-right">GM</th>
                <th class="px-4 py-3 text-right">GM%</th>
                <th class="px-4 py-3 text-right">Horas</th>
                <th class="px-4 py-3 text-right">Tarifa Entrega</th>
              </tr>
            </thead>
            <tbody>
              @for (p of result()!.items; track $index) {
                <tr class="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 text-slate-600">{{ p['año'] }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ mesFmt(p.mes) }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ p.industria ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-700 font-medium">{{ p.cliente ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ p.codProyecto ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ p.ceBe ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-600 max-w-[140px] truncate" [title]="p.responsable ?? ''">
                    {{ p.responsable ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ p.area ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ p.sociedad ?? '—' }}</td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ fmt(p.ingreso) }}</td>
                  <td class="px-4 py-3 text-right text-slate-600">{{ fmt(p.costo) }}</td>
                  <td class="px-4 py-3 text-right font-medium"
                    [class.text-green-600]="p.gm >= 0"
                    [class.text-red-600]="p.gm < 0"
                  >{{ fmt(p.gm) }}</td>
                  <td class="px-4 py-3 text-right font-medium"
                    [class.text-green-600]="p.gmPorcentaje >= 0"
                    [class.text-red-600]="p.gmPorcentaje < 0"
                  >{{ p.gmPorcentaje.toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-right text-slate-600">
                    {{ p.horas.toLocaleString('es-MX', { maximumFractionDigits: 0 }) }}h
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600">{{ fmt(p.tarifaEntrega) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (result()!.totalPaginas > 1) {
          <div class="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span class="text-xs text-slate-400">
              Página {{ page() }} de {{ result()!.totalPaginas }}
              · {{ result()!.totalRegistros.toLocaleString('es-MX') }} registros
            </span>
            <div class="flex items-center gap-1">
              <button (click)="goPage(1)"              [disabled]="page() === 1"                          class="pager-btn">«</button>
              <button (click)="goPage(page() - 1)"     [disabled]="page() === 1"                          class="pager-btn">‹</button>
              @for (n of pageNumbers(); track n) {
                <button (click)="goPage(n)"
                  class="pager-btn"
                  [class.bg-blue-600]="n === page()"
                  [class.!text-white]="n === page()"
                  [class.border-blue-600]="n === page()">{{ n }}</button>
              }
              <button (click)="goPage(page() + 1)"     [disabled]="page() === result()!.totalPaginas"     class="pager-btn">›</button>
              <button (click)="goPage(result()!.totalPaginas)" [disabled]="page() === result()!.totalPaginas" class="pager-btn">»</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pager-btn {
      @apply w-7 h-7 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center;
    }
  `],
})
export class TablaProyectosComponent implements OnChanges {
  private readonly svc = inject(ProyectosService);

  @Input() filtros: ProyectosFilterParams = {};
  @Input() moneda = 'COP';

  page    = signal(1);
  loading = signal(false);
  result  = signal<PagedResult<ProyectoDto> | null>(null);

  pageNumbers = computed(() => {
    const total = this.result()?.totalPaginas ?? 1;
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  });

  ngOnChanges() {
    this.page.set(1);
    this.load(1);
  }

  goPage(n: number) {
    const total = this.result()?.totalPaginas ?? 1;
    const p = Math.max(1, Math.min(n, total));
    this.page.set(p);
    this.load(p);
  }

  mesFmt(m: number): string { return MESES[m] ?? String(m); }
  fmt(v: number): string     { return fmtMoneda(v, this.moneda); }

  private load(pagina: number) {
    this.loading.set(true);
    this.svc.getProyectos({ ...this.filtros, Pagina: pagina, TamañoPagina: 15 }).subscribe({
      next:  d  => { this.result.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
