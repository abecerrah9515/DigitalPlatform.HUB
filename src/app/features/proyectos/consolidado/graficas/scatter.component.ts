import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { ScatterBurbujaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

@Component({
  selector: 'app-scatter',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-1">Tarifa vs GM% por Cliente</h3>
      <p class="text-xs text-slate-400 mb-4">Tamaño de burbuja = Ingreso</p>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:300px"></div>
      } @else {
        <div class="flex items-center justify-center h-[300px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
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

    const maxIngreso = Math.max(...clientes.map(c => c.ingreso));

    this.option.set({
      tooltip: {
        formatter: (p: any) => {
          const d = p.data;
          return `${d[3]}<br/>Tarifa: ${d[0].toLocaleString()}<br/>GM%: ${d[1].toFixed(1)}%<br/>Ingreso: ${d[2].toLocaleString()}`;
        },
      },
      xAxis: { name: 'Tarifa Entrega', nameLocation: 'middle', nameGap: 30, axisLabel: { fontSize: 11 } },
      yAxis: { name: 'GM %', nameLocation: 'middle', nameGap: 35, axisLabel: { fontSize: 11 } },
      grid: { top: 20, left: 60, right: 30, bottom: 50 },
      series: [{
        type: 'scatter',
        color: '#3b82f6',
        symbolSize: (d: number[]) => Math.max(10, Math.sqrt(d[2] / maxIngreso) * 60),
        data: clientes.map(c => [c.tarifaEntrega, c.gmPct, c.ingreso, c.cliente]),
        emphasis: { focus: 'self' },
      }],
    });
  }
}
