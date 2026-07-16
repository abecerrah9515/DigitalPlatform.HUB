import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TopClientesHorasResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

function fmtHoras(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M h`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K h`;
  return `${Math.round(v)} h`;
}

@Component({
  selector: 'app-top-clientes',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Top 10 Clientes por Horas</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:360px"></div>
      } @else {
        <div class="flex items-center justify-center h-[360px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
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
    const top = [...clientes]
      .filter(c => c.cliente?.trim())
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 10);

    if (!top.length || top.every(c => c.horas === 0)) { this.option.set(null); return; }

    this.option.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p    = (params as any[])[0];
          const meta = top.find(c => c.cliente === p.name);
          const pct  = meta ? `<br/>Participación: <b>${meta.pctParticipacion.toFixed(1)}%</b>` : '';
          const area = meta?.areaMasHoras ? `<br/>Área: <b>${meta.areaMasHoras}</b>` : '';
          return `<b>${p.name}</b><br/>${p.marker}Horas: <b>${fmtHoras(p.value as number)}</b>${pct}${area}`;
        },
      },
      grid: { top: 10, left: 10, right: 80, bottom: 36, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Horas',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        splitNumber: 4,
        axisLabel: {
          fontSize: 11,
          hideOverlap: true,
          formatter: (v: number) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return String(v);
          },
        },
      },
      yAxis: {
        type: 'category',
        name: 'Cliente',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        data: top.map(c => c.cliente ?? '').reverse(),
        axisLabel: { fontSize: 10, width: 110, overflow: 'truncate' },
      },
      series: [{
        type: 'bar',
        color: '#6366f1',
        data: top.map(c => c.horas).reverse(),
        label: {
          show: true,
          position: 'right',
          fontSize: 10,
          color: '#475569',
          formatter: (p: any) => fmtHoras(p.value as number),
        },
      }],
    });
  }
}
