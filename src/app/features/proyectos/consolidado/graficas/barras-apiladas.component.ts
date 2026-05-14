import { Component, Input, OnChanges, signal } from '@angular/core';
import { EchartsDirective } from '../../../../shared/directives/echarts.directive';
import { BarrasApiladasResponseDto } from '../../../../core/models/graficas.models';
import * as echarts from 'echarts';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatPeriodo(p: string): string {
  const m = p.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MESES[+m[2] - 1]} ${m[1]}` : p;
}

function fmtAxis(v: number, isPct: boolean): string {
  if (isPct) return v.toFixed(0) + '%';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
  return String(v);
}

function fmtTooltip(v: number, isPct: boolean): string {
  if (isPct) return v.toFixed(1) + '%';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
  return String(v);
}

// Cuántos períodos mostrar por defecto en la ventana visible
const WINDOW = 8;

@Component({
  selector: 'app-barras-apiladas',
  standalone: true,
  imports: [EchartsDirective],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-slate-800">
          Ingreso por Industria/Área — Barras Apiladas
        </h3>
        <div class="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
          <button class="px-3 py-1.5 transition-colors"
            [class.bg-blue-600]="agrupacion() === 'industria'"
            [class.text-white]="agrupacion() === 'industria'"
            [class.text-slate-500]="agrupacion() !== 'industria'"
            (click)="cambiar('industria')">Industria</button>
          <button class="px-3 py-1.5 transition-colors border-l border-slate-200"
            [class.bg-blue-600]="agrupacion() === 'area'"
            [class.text-white]="agrupacion() === 'area'"
            [class.text-slate-500]="agrupacion() !== 'area'"
            (click)="cambiar('area')">Área</button>
        </div>
      </div>
      @if (option()) {
        <div [appEcharts]="option()!" style="height:360px"></div>
      } @else {
        <div class="flex items-center justify-center h-[360px] text-sm text-slate-400">
          Sin datos para los filtros seleccionados
        </div>
      }
    </div>
  `,
})
export class BarrasApiladasComponent implements OnChanges {
  @Input() data: BarrasApiladasResponseDto | null = null;
  @Input() onToggle?: (agrupacion: string) => void;

  agrupacion = signal<'industria' | 'area'>('industria');
  option     = signal<echarts.EChartsOption | null>(null);

  ngOnChanges() { this.buildOption(); }

  cambiar(v: 'industria' | 'area') {
    this.agrupacion.set(v);
    this.onToggle?.(v);
  }

  private buildOption() {
    const items = this.data?.items;
    if (!items?.length) { this.option.set(null); return; }

    const periodos  = [...new Set(items.map(i => i.periodo ?? ''))].sort();
    const segmentos = [...new Set(items.map(i => i.segmento ?? ''))];
    const colors    = ['#3b82f6','#10b981','#f97316','#a855f7','#ef4444',
                       '#06b6d4','#f59e0b','#6366f1','#84cc16','#ec4899','#14b8a6'];

    // Detectar si el back manda valores normalizados (0-1) o monetarios
    const maxVal = Math.max(...items.map(i => i.ingreso));
    const isPct  = maxVal > 0 && maxVal <= 1;
    const scale  = isPct ? 100 : 1;

    const periodosLabel = periodos.map(formatPeriodo);
    const total         = periodos.length;

    // Ventana visible: mostrar los últimos WINDOW períodos por defecto
    const endPct   = 100;
    const startPct = total <= WINDOW ? 0 : Math.round((1 - WINDOW / total) * 100);

    const series: echarts.SeriesOption[] = segmentos.map((seg, idx) => ({
      name: seg,
      type: 'bar',
      stack: 'total',
      color: colors[idx % colors.length],
      barMaxWidth: 56,
      data: periodos.map(p => {
        const val = items.find(i => i.periodo === p && i.segmento === seg)?.ingreso ?? 0;
        return +(val * scale).toFixed(2);
      }),
      emphasis: { focus: 'series' },
    }));

    this.option.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const rows = (params as any[])
            .filter(p => p.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .map((p: any) =>
              `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;`
              + `background:${p.color};margin-right:4px"></span>`
              + `${p.seriesName}: <b>${fmtTooltip(p.value, isPct)}</b>`
            ).join('<br/>');
          return `<b>${params[0]?.axisValue}</b><br/>${rows}`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 30,
        itemWidth: 12,
        itemHeight: 12,
        pageIconSize: 10,
        textStyle: { fontSize: 11 },
      },
      // Slider de zoom — permite desplazarse por todos los períodos
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          start: startPct,
          end: endPct,
          height: 20,
          bottom: 6,
          borderColor: 'transparent',
          backgroundColor: '#f1f5f9',
          fillerColor: 'rgba(59,130,246,0.15)',
          handleStyle: { color: '#3b82f6' },
          textStyle: { fontSize: 10 },
          showDetail: false,
        },
      ],
      grid: { top: 16, left: 64, right: 16, bottom: 90 },
      xAxis: {
        type: 'category',
        data: periodosLabel,
        axisLabel: { fontSize: 11, rotate: 20, interval: 0 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => fmtAxis(v, isPct),
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series,
    });
  }
}
