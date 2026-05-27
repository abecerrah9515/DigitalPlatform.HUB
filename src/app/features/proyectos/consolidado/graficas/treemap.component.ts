import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TreemapAreaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

const AREA_COLORS: Record<string, string> = {
  'AMS':       '#3b82f6',
  'DIGITAL':   '#84cc16',
  'ERP':       '#f97316',
  'ITIS':      '#64748b',
  'Licencias': '#06b6d4',
};
const DEFAULT_COLOR = '#6366f1';

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
    const areas = this.data?.areas;
    if (!areas?.length) { this.option.set(null); return; }

    // Excluir "Sin clasificar" (área vacía/nula) y áreas sin horas
    const filtered = areas
      .filter(a => a.area?.trim())
      .map(a => ({ ...a, nombre: a.area!.trim() }));

    const hasData = filtered.some(a => (a.horas ?? 0) !== 0);
    if (!hasData) { this.option.set(null); return; }

    const treeData = filtered.map(a => ({
      name:  a.nombre,
      value: a.horas,
      itemStyle: { color: AREA_COLORS[a.nombre] ?? DEFAULT_COLOR },
      label: { color: '#fff' },
      // guardamos meta para el tooltip
      proyectos: a.cantidadProyectos,
      pct:       a.pctParticipacion,
    }));

    this.option.set({
      tooltip: {
        formatter: (info: any) => {
          const h    = (info.value as number).toLocaleString('es-MX', { maximumFractionDigits: 0 });
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
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          fontSize: 13,
          fontWeight: 'bold',
          lineHeight: 20,
          formatter: (p: any) => `${p.name}\n${fmtHoras(p.value as number)}`,
        },
        itemStyle: { borderWidth: 2, borderColor: '#fff', gapWidth: 2 },
        data: treeData,
      }],
    });
  }
}
