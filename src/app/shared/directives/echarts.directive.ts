import { Directive, ElementRef, EventEmitter, Input, Output, OnChanges, OnDestroy, inject } from '@angular/core';
import * as echarts from 'echarts';

@Directive({ selector: '[appEcharts]', standalone: true })
export class EchartsDirective implements OnChanges, OnDestroy {
  @Input('appEcharts') option: echarts.EChartsOption | null = null;
  @Output() chartClick = new EventEmitter<{ name: string; value: number }>();

  private chart?: echarts.ECharts;
  private readonly el = inject(ElementRef);
  private ro?: ResizeObserver;
  private listenerAttached = false;

  ngOnChanges() {
    if (!this.option) return;
    if (!this.chart) {
      this.chart = echarts.init(this.el.nativeElement);
      this.ro = new ResizeObserver(() => this.chart?.resize());
      this.ro.observe(this.el.nativeElement);
    }
    if (!this.listenerAttached) {
      this.chart.on('click', (params: any) => {
        if (params.seriesType === 'pie' || params.seriesType === 'treemap') {
          this.chartClick.emit({ name: params.name, value: params.value });
        }
      });
      this.listenerAttached = true;
    }
    this.chart.setOption(this.option, { notMerge: true });
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    this.listenerAttached = false;
    this.chart?.dispose();
  }
}
