import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TendenciaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

function fmtAxis(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(v);
}

function fmtFull(v: number): string {
  return v.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

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
        <div class="flex items-center justify-center h-[260px] text-sm text-slate-400">Sin datos para esta selección</div>
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
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const period = (params as any[])[0]?.axisValue ?? '';
          const rows = (params as any[])
            .map((p: any) => `${p.marker}${p.seriesName}: <b>${fmtFull(p.value)}</b>`)
            .join('<br/>');
          return `<b>${period}</b><br/>${rows}`;
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { top: 30, left: 80, right: 20, bottom: 55 },
      xAxis: {
        type: 'category',
        name: 'Período',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        data: puntos.map(p => p.periodo ?? ''),
        axisLabel: { fontSize: 10, rotate: 30, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        name: 'Ingreso',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 11, color: '#64748b', align: 'left' },
        axisLabel: { fontSize: 11, formatter: fmtAxis },
      },
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
