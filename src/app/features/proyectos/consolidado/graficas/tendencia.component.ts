import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TendenciaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

@Component({
  selector: 'app-tendencia',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Tendencia de Ingresos</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:260px"></div>
      } @else {
        <div class="flex items-center justify-center h-[260px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      }
    </div>
  `,
})
export class TendenciaComponent implements OnChanges {
  @Input() data: TendenciaResponseDto | null = null;
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const puntos = this.data?.puntos;
    if (!puntos?.length) { this.option.set(null); return; }

    this.option.set({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { top: 10, left: 60, right: 20, bottom: 40 },
      xAxis: { type: 'category', data: puntos.map(p => p.periodo ?? ''), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      series: [
        {
          name: 'Real',
          type: 'line',
          smooth: true,
          color: '#3b82f6',
          areaStyle: { color: 'rgba(59,130,246,0.08)' },
          data: puntos.map(p => p.ingresoReal),
        },
        {
          name: 'Planeado',
          type: 'line',
          smooth: true,
          color: '#94a3b8',
          lineStyle: { type: 'dashed' },
          data: puntos.map(p => p.ingresoPlaneado),
        },
      ],
    });
  }
}
