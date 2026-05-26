import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TreemapAreaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

const AREA_COLORS: Record<string, string> = {
  'AMS':            '#3b82f6',
  'DIGITAL':        '#10b981',
  'ERP':            '#f97316',
  'ITIS':           '#a855f7',
  'Licencias':      '#06b6d4',
  'Sin clasificar': '#94a3b8',
};
const DEFAULT_COLOR = '#64748b';

function fmtHoras(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

@Component({
  selector: 'app-treemap',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Horas por Área</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:280px"></div>
      } @else {
        <div class="flex items-center justify-center h-[280px] text-sm text-slate-400">Sin datos para esta selección</div>
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

    // Normalizar nombre vacío y guardar referencia original para tooltip
    const normalized = areas.map(a => ({
      ...a,
      nombre: a.area?.trim() || 'Sin clasificar',
    }));

    // Ordenar ascendente → el mayor queda en la parte superior del gráfico
    const sorted = [...normalized].sort((a, b) => a.horas - b.horas);

    const nombres   = sorted.map(a => a.nombre);
    const horas     = sorted.map(a => a.horas);
    const colores   = sorted.map(a => AREA_COLORS[a.nombre] ?? DEFAULT_COLOR);

    this.option.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p    = (params as any[])[0];
          const item = sorted.find(a => a.nombre === p.name);
          const h    = (p.value as number).toLocaleString('es-MX', { maximumFractionDigits: 0 });
          const proy = item?.cantidadProyectos ?? 0;
          const pct  = item?.pctParticipacion != null ? item.pctParticipacion.toFixed(1) + '%' : '—';
          return `<b>${p.name}</b><br/>Horas: <b>${h}h</b><br/>Proyectos: ${proy}<br/>Participación: ${pct}`;
        },
      },
      grid: { top: 10, left: 10, right: 72, bottom: 24, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Horas',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        splitNumber: 4,
        axisLabel: {
          fontSize: 11,
          hideOverlap: true,
          formatter: (v: number) => fmtHoras(v),
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'category',
        data: nombres,
        axisLabel: { fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: horas.map((h, i) => ({ value: h, itemStyle: { color: colores[i], borderRadius: [0, 4, 4, 0] } })),
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#475569',
          formatter: (p: any) => {
            const v = p.value as number;
            return v === 0 ? '0 h' : `${fmtHoras(v)} h`;
          },
        },
      }],
    });
  }
}
