import { Component, Input, OnChanges, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { PlanVsRealResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

@Component({
  selector: 'app-plan-vs-real',
  standalone: true,
  imports: [EchartsDirective, DecimalPipe],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Plan vs Real</h3>
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
                      [class.text-red-600]="row.variacionPct < 0"
                    >{{ row.variacionPct > 0 ? '+' : '' }}{{ row.variacionPct.toFixed(1) }}%</td>
                    <td class="py-2">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="row.estado === 'Sobre plan'"
                        [class.text-green-700]="row.estado === 'Sobre plan'"
                        [class.bg-red-100]="row.estado === 'Bajo plan'"
                        [class.text-red-700]="row.estado === 'Bajo plan'"
                        [class.bg-slate-100]="row.estado !== 'Sobre plan' && row.estado !== 'Bajo plan'"
                        [class.text-slate-500]="row.estado !== 'Sobre plan' && row.estado !== 'Bajo plan'"
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
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const periodos = this.data?.periodos;
    if (!periodos?.length) { this.option.set(null); return; }

    this.option.set({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { top: 10, left: 60, right: 20, bottom: 40 },
      xAxis: { type: 'category', data: periodos.map(p => p.periodo ?? ''), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      series: [
        { name: 'Plan', type: 'bar', color: '#cbd5e1', data: periodos.map(p => p.ingresoPlaneado) },
        { name: 'Real', type: 'bar', color: '#3b82f6', data: periodos.map(p => p.ingresoReal) },
      ],
    });
  }
}
