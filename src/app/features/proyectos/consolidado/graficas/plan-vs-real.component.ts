import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { PlanVsRealResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';


@Component({
  selector: 'app-plan-vs-real',
  standalone: true,
  imports: [EchartsDirective, DecimalPipe],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5 h-full">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Cumplimiento mensual de Ingresos vs Proyectado</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:260px"></div>
        @if (data?.tablaResumen?.length) {
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-slate-400 uppercase tracking-wide">
                  <th class="text-left py-2 pr-4">Mes</th>
                  <th class="text-right py-2 pr-4">Plan</th>
                  <th class="text-right py-2 pr-4">Real</th>
                  <th class="text-right py-2 pr-4">Var %</th>
                  <th class="text-left py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (row of data!.tablaResumen!; track row.mes) {
                  <tr class="border-t border-slate-50">
                    <td class="py-2 pr-4 text-slate-700">{{ row.mes }}</td>
                    <td class="py-2 pr-4 text-right text-slate-600">{{ row.plan | number:'1.0-0' }}</td>
                    <td class="py-2 pr-4 text-right text-slate-700 font-medium">{{ row.real | number:'1.0-0' }}</td>
                    <td class="py-2 pr-4 text-right font-medium"
                      [class.text-green-600]="row.variacionPct >= 0"         
                      [class.text-yellow-500]="row.variacionPct >= -2 && row.variacionPct <= 2"
                      [class.text-red-600]="row.variacionPct < 0"
                    >{{ row.variacionPct > 0 ? '+' : '' }}{{ row.variacionPct.toFixed(1) }}%</td>
                    <td class="py-2">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="row.estado === 'Verde'"
                        [class.text-green-700]="row.estado === 'Verde'"
                        [class.bg-red-100]="row.estado === 'Rojo'"
                        [class.text-red-700]="row.estado === 'Rojo'"
                        [class.bg-slate-100]="row.estado !== 'Verde' && row.estado !== 'Rojo'"
                        [class.text-slate-500]="row.estado !== 'Verde' && row.estado !== 'Rojo'"
                      >{{ row.estado }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      } @else {
        <div class="flex items-center justify-center h-[260px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      }
    </div>
  `,
})
export class PlanVsRealComponent implements OnChanges {
  @Input() data: PlanVsRealResponseDto | null = null;
  @Input() targetPeriodos: string[] = [];
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges(_changes?: SimpleChanges) {
    const periodos = this.data?.periodos;
    if (!periodos?.length) { this.option.set(null); return; }

    let ultimos3: typeof periodos;
    if (this.targetPeriodos.length > 0) {
      // Filtrar exactamente los períodos que el padre calculó como ventana de 3 meses.
      // El backend puede devolver producto cruzado Año×Mes; aquí acotamos al conjunto correcto.
      const targets = new Set(this.targetPeriodos);
      ultimos3 = periodos
        .filter(p => targets.has(p.periodo ?? ''))
        .sort((a, b) => (a.periodo ?? '').localeCompare(b.periodo ?? ''));
    } else {
      ultimos3 = [...periodos]
        .sort((a, b) => (a.periodo ?? '').localeCompare(b.periodo ?? ''))
        .slice(-3);
    }

    if (!ultimos3.length) { this.option.set(null); return; }
    /** Eje Y: abreviado */
    const fmtVal  = (v: number) => {
      if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
      if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
      return String(v);
    };
    /** Tooltip: cifra completa */
    const fmtFull = (v: number) => v.toLocaleString('es-MX', { maximumFractionDigits: 0 });

    this.option.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const period = (params as any[])[0]?.axisValue ?? '';
          const plan   = (params as any[]).find((p: any) => p.seriesName === 'Plan')?.value ?? 0;
          const real   = (params as any[]).find((p: any) => p.seriesName === 'Real')?.value ?? 0;
          const delta  = plan > 0 ? (((real - plan) / plan) * 100) : null;
          const deltaStr = delta !== null
            ? `Δ%: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
            : 'sin período anterior';
          return `<b>${period}</b><br/>`
            + `Plan: <b>${fmtFull(plan)}</b><br/>`
            + `Real: <b>${fmtFull(real)}</b><br/>`
            + deltaStr;
        },
      },
      legend: { bottom: 4, textStyle: { fontSize: 11 }, itemGap: 20, itemWidth: 14, itemHeight: 8 },
      grid: { top: 16, left: 70, right: 56, bottom: 40 },
      xAxis: {
        type: 'category',
        name: 'Período',
        nameLocation: 'end',
        nameTextStyle: { fontSize: 10, color: '#64748b' },
        data: ultimos3.map(p => p.periodo ?? ''),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Ingreso',
        nameLocation: 'middle',
        nameGap: 38,
        nameRotate: 90,
        nameTextStyle: { fontSize: 11, color: '#64748b' },
        splitLine: { lineStyle: { color: '#b0b6bb', opacity: 0.1 } },
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => {
            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
            if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
            return String(v);
          }
        }
      },
      series: [
        { name: 'Plan', type: 'bar', color: '#cbd5e1', data: ultimos3.map(p => p.ingresoPlaneado) },
        {
          name: 'Real',
          type: 'bar',
          data: ultimos3.map(p => {
            const ratio = p.ingresoPlaneado > 0 ? p.ingresoReal / p.ingresoPlaneado : null;
            let color = '#cbd5e1';
            if (ratio !== null && ratio >= 1.02) color = '#86efac';
            else if (ratio !== null && ratio >= 0.98) color = '#fde68a';
            else if (ratio !== null) color = '#fca5a5';
            return { value: p.ingresoReal, itemStyle: { color } };
          })
        }
      ],
    });
  }
}
