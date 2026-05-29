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
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Cumplimiento de Ingresos Mensuales</h3>
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
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          formatter: (value: number) => {
            if (Math.abs(value) >= 1_000_000) {
              return (value / 1_000_000).toFixed(1) + 'M';
            }
            if (Math.abs(value) >= 1_000) {
              return (value / 1_000).toFixed(0) + 'K';
            }
            return value.toString();
          }
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: '#e5e7eb',
            opacity: 0.4
          }
        }
      },

      series: [
        // 🔵 REAL
        {
          name: 'Real',
          type: 'line',
          smooth: true,
          color: '#1d4ed8', // 🔥 más fuerte
          lineStyle: {
            width: 2
          },
          showSymbol: false,
          emphasis: {
            focus: 'series'
          },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#1d4ed8'
          },
          areaStyle: {
            color: 'rgba(29, 78, 216, 0.1)' // un pelín más visible
          },
          data: puntos.map(p => p.ingresoReal),
        },

        // 🟣 PROYECTADO
        {
          name: 'Proyectado',
          type: 'line',
          smooth: true,
          color: '#8b5cf6', // 🔥 más fuerte
          lineStyle: {
            width: 1.8,
            type: 'dashed',
            opacity: 0.85
          },
          showSymbol: false,
          emphasis: {
            focus: 'series'
          },
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: {
            color: '#8b5cf6'
          },
          data: puntos.map(p => p.ingresoProyectado ?? p.ingresoPlaneado),
        },

        // ⚪ PLANEADO
        {
          name: 'Planeado',
          type: 'line',
          smooth: true,
          color: '#64748b', // 🔥 gris más definido
          lineStyle: {
            width: 1.5,
            opacity: 0.75
          },
          showSymbol: false,
          emphasis: {
            focus: 'series'
          },
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: {
            color: '#64748b'
          },
          data: puntos.map(p => p.ingresoPlaneado),
        }
      ],
    });
  }
}
