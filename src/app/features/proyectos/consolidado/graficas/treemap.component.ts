import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { TreemapAreaResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

@Component({
  selector: 'app-treemap',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">Horas por Área</h3>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:280px"></div>
      } @else {
        <div class="flex items-center justify-center h-[280px] text-sm text-slate-400">Sin datos para los filtros seleccionados</div>
      }
    </div>
  `,
})
export class TreemapComponent implements OnChanges {
  @Input() data: TreemapAreaResponseDto | null = null;
  option = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() {
    const areas = this.data?.areas;
    if (!areas?.length) { this.option.set(null); return; }

    this.option.set({
      tooltip: {
        formatter: (p: any) =>
          `${p.name}<br/>Horas: ${p.value.toLocaleString()}<br/>Proyectos: ${p.data.proyectos}`,
      },
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        colorMappingBy: 'index',
        data: areas.map(a => ({
          name: a.area ?? '',
          value: a.horas,
          proyectos: a.cantidadProyectos,
        })),
        label: { show: true, fontSize: 12, formatter: '{b}' },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
      }],
    });
  }
}
