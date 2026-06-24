import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { ScatterBurbujaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

const GM_MIN = -150;
const GM_MAX = 150;

@Component({
  selector: 'app-scatter',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-1">Tarifa vs GM% por Cliente</h3>
      <p class="text-xs text-slate-400 mb-4">Tamaño de burbuja = Ingreso · ▲ naranja = GM% fuera de rango (−150% a 150%)</p>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:360px"></div>
      } @else {
        <div class="flex items-center justify-center h-[360px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      }
    </div>
  `,
})
export class ScatterComponent implements OnChanges {
  @Input() data: ScatterBurbujaResponseDto | null = null;
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const clientes = this.data?.clientes;
    if (!clientes?.length) { this.option.set(null); return; }

    // Excluir clientes sin ingreso real y con tarifa <= 0 (necesario para escala log)
    const filtered = clientes.filter(c => c.ingreso > 0 && c.tarifaEntrega > 0);
    if (!filtered.length) { this.option.set(null); return; }

    const maxIngreso = Math.max(...filtered.map(c => c.ingreso));
    const symbolSize = (d: any[]) => Math.max(10, Math.sqrt(d[2] / maxIngreso) * 60);

    const normal: any[][] = [];
    const outliers: any[][] = [];
    for (const c of filtered) {
      // [0:tarifa, 1:gmClamped, 2:ingreso, 3:cliente, 4:area, 5:gmReal]
      const point = [c.tarifaEntrega, Math.max(GM_MIN, Math.min(GM_MAX, c.gmPct)), c.ingreso, c.cliente?.trim() || 'Sin identificar', c.area ?? '—', c.gmPct];
      (c.gmPct < GM_MIN || c.gmPct > GM_MAX ? outliers : normal).push(point);
    }

    const tooltipFmt = (p: any) => {
      const d = p.data as any[];
      const realGm: number = d[5] ?? d[1];
      return `<b>${d[3]}</b><br/>Área: ${d[4]}<br/>Tarifa: $${(d[0] as number).toLocaleString('es-MX')}<br/>Ingreso: $${(d[2] as number).toLocaleString('es-MX')}<br/>GM%: ${realGm.toFixed(1)}%`;
    };
    const tarifaPromedio = this.data!.tarifaPromedio;

    this.option.set({
      tooltip: { formatter: tooltipFmt },
      xAxis: {
        type: 'log',
        name: 'Tarifa Entrega',
        nameLocation: 'end',
        axisLabel: {
          fontSize: 10,
          hideOverlap: true,
          formatter: (v: number) => {
            if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
            if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
            return `$${v}`;
          },
        },
      },
      yAxis: {
        name: 'GM %',
        nameLocation: 'middle',
        nameGap: 38,
        min: GM_MIN,
        max: GM_MAX,
        axisLabel: { fontSize: 10 },
      },
      grid: { top: 20, left: 70, right: 30, bottom: 60 },
      series: [
        {
          type: 'scatter',
          color: '#3b82f6',
          symbolSize,
          data: normal,
          emphasis: { focus: 'self' as const },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: { color: '#64748b', type: 'dashed', width: 1.5 },
            label: {
              position: 'insideStartTop',
              fontSize: 10,
              color: '#64748b',
              formatter: () => `Prom: $${tarifaPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
            },
            data: [{ xAxis: tarifaPromedio }],
          },
        },
        ...(outliers.length ? [{
          type: 'scatter' as const,
          color: '#f97316',
          symbol: 'triangle',
          symbolSize,
          data: outliers,
          emphasis: { focus: 'self' as const },
        }] : []),
      ],
    });
  }
}
