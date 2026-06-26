import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TendenciaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

/** Eje Y: valor abreviado para no saturar el espacio */
function fmtVal(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(v);
}

/** Tooltip: cifra completa para legibilidad exacta */
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
        <div [appEcharts]="option()!" style="height:360px"></div>
      } @else {
        <div class="flex items-center justify-center h-[360px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
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
          const punto  = puntos.find(p => p.periodo === period);
          const rows   = (params as any[])
            .map((p: any) => `${p.marker}${p.seriesName}: <b>${fmtFull(p.value ?? 0)}</b>`)
            .join('<br/>');
          const extra  = punto && !punto.sinPlan
            ? `<br/>Var: ${punto.variacion >= 0 ? '+' : ''}${fmtFull(punto.variacion)} · Cumpl: ${punto.pctCumplimiento.toFixed(1)}%`
            : '<br/>Plan: <i>Sin datos</i>';
          return `<b>${period}</b><br/>${rows}${extra}`;
        },
      },
      legend: { bottom: 4, textStyle: { fontSize: 11 }, itemGap: 20, itemWidth: 14, itemHeight: 8 },
      grid: { top: 16, left: 70, right: 56, bottom: 52 },
      xAxis: {
        type: 'category',
        name: 'Período',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 10, color: '#64748b' },
        data: puntos.map(p => p.periodo ?? ''),
        axisLabel: { fontSize: 10, rotate: 30, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        name: 'Ingreso',
        nameLocation: 'middle',
        nameGap: 38,
        nameRotate: 90,
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => fmtVal(v),
        },
      },
      series: [
        {
          name: 'Real',
          type: 'line',
          smooth: true,
          color: '#3b82f6',
          lineStyle: { width: 3 },
          areaStyle: { color: 'rgba(59,130,246,0.08)' },
          data: puntos.map(p => p.ingresoReal),
        },
        {
          name: 'Plan P26',
          type: 'line',
          smooth: true,
          color: '#10b981',
          lineStyle: { width: 2 },
          data: puntos.map(p => p.ingresoPlan ?? null),
        },
        {
          name: 'Proyectado',
          type: 'line',
          smooth: true,
          color: '#94a3b8',
          lineStyle: { type: 'dashed', width: 1.5 },
          areaStyle: { color: 'rgba(148,163,184,0.05)' },
          data: puntos.map(p => p.ingresoPlaneado || null),
        },
      ],
    });
  }
}
