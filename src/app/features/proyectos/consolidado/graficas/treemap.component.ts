import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TreemapAreaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

/** Lookup por nombre en MAYÚSCULAS para evitar discrepancias de capitalización */
const AREA_COLORS: Record<string, string> = {
  'AMS':              '#3b82f6',
  'DIGITAL':          '#84cc16',
  'ERP':              '#f97316',
  'ITIS':             '#64748b',
  'LICENCIAS':        '#06b6d4',
  'NO IDENTIFICADAS': '#94a3b8',
};
const DEFAULT_COLOR = '#6366f1';

/** Áreas conocidas que siempre deben aparecer (con 0 h si el backend no las devuelve) */
const KNOWN_AREAS = ['AMS', 'DIGITAL', 'ERP', 'ITIS', 'Licencias'];

function fmtHoras(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M h`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K h`;
  return `${Math.round(v)} h`;
}

@Component({
  selector: 'app-treemap',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5 h-full flex flex-col">
      <h3 class="text-sm font-semibold text-slate-800 mb-4 flex-shrink-0">Horas por Área</h3>
      @if (option()) {
        <div [appEcharts]="option()!" class="flex-1 min-h-0"></div>
      } @else {
        <div class="flex-1 flex items-center justify-center text-sm text-slate-400">Sin datos para esta selección</div>
      }
    </div>
  `,
})
export class TreemapComponent implements OnChanges {
  @Input() data: TreemapAreaResponseDto | null = null;
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const areas = this.data?.areas ?? [];

    // Mapear áreas del backend: null/vacío → "No identificadas"
    const fromBackend = areas.map(a => ({
      nombre:     a.area?.trim() || 'No identificadas',
      horas:      a.horas ?? 0,
      proyectos:  a.cantidadProyectos ?? 0,
      pct:        a.pctParticipacion ?? 0,
    }));

    // Agregar áreas conocidas que falten con 0 horas
    const nombres = new Set(fromBackend.map(a => a.nombre));
    for (const known of KNOWN_AREAS) {
      if (!nombres.has(known)) {
        fromBackend.push({ nombre: known, horas: 0, proyectos: 0, pct: 0 });
      }
    }

    const hasData = fromBackend.some(a => a.horas !== 0);
    if (!hasData) { this.option.set(null); return; }

    // Valor mínimo de visualización: 3% del total para que áreas con 0 sean visibles
    const totalHoras = fromBackend.reduce((s, a) => s + a.horas, 0);
    const minDisplay = Math.max(totalHoras * 0.03, 1);

    const treeData = fromBackend.map(a => ({
      name:       a.nombre,
      value:      a.horas > 0 ? a.horas : minDisplay,
      horasReal:  a.horas,
      proyectos:  a.proyectos,
      pct:        a.pct,
      itemStyle:  { color: AREA_COLORS[a.nombre.toUpperCase()] ?? DEFAULT_COLOR },
    }));

    this.option.set({
      tooltip: {
        formatter: (info: any) => {
          const h    = (info.data.horasReal as number).toLocaleString('es-MX', { maximumFractionDigits: 0 });
          const proy = info.data.proyectos ?? 0;
          const pct  = info.data.pct != null ? (info.data.pct as number).toFixed(1) + '%' : '—';
          return `<b>${info.name}</b><br/>Horas: <b>${h} h</b><br/>Proyectos: ${proy}<br/>Participación: ${pct}`;
        },
      },
      series: [{
        type: 'treemap',
        width:  '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        visibleMin: 0,
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',           // ← color en la serie, no en cada dato
          lineHeight: 16,
          formatter: (p: any) => {
            const horasReal: number = p.data.horasReal ?? 0;
            return `${p.name}\n${fmtHoras(horasReal)}`;
          },
        },
        itemStyle: { borderWidth: 2, borderColor: '#fff', gapWidth: 2 },
        data: treeData,
      }],
    });
  }
}
