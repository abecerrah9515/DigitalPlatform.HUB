import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TopClientesHorasResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

@Component({
  selector: 'app-top-clientes',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Top 10 Clientes por Horas</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:300px"></div>
      } @else {
        <div class="flex items-center justify-center h-[300px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      }
    </div>
  `,
})
export class TopClientesComponent implements OnChanges {
  @Input() data: TopClientesHorasResponseDto | null = null;
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const clientes = this.data?.clientes;
    if (!clientes?.length) { this.option.set(null); return; }

    const top = [...clientes].sort((a, b) => b.horas - a.horas).slice(0, 10);

    this.option.set({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 10, left: 10, right: 60, bottom: 10, containLabel: true },
      xAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      yAxis: {
        type: 'category',
        data: top.map(c => c.cliente ?? '').reverse(),
        axisLabel: { fontSize: 11, width: 100, overflow: 'truncate' },
      },
      series: [{
        type: 'bar',
        color: '#6366f1',
        data: top.map(c => c.horas).reverse(),
        label: { show: true, position: 'right', fontSize: 11, formatter: (p: any) => p.value.toLocaleString() },
      }],
    });
  }
}
