import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import * as echarts from 'echarts';

@Directive({ selector: '[appEcharts]', standalone: true })
export class EchartsDirective implements OnChanges, OnDestroy {
  @Input('appEcharts') option: echarts.EChartsOption | null = null;

  private chart?: echarts.ECharts;
  private readonly el = inject(ElementRef);
  private ro?: ResizeObserver;

  ngOnChanges() {
    if (!this.option) return;
    if (!this.chart) {
      this.chart = echarts.init(this.el.nativeElement);
      this.ro = new ResizeObserver(() => this.chart?.resize());
      this.ro.observe(this.el.nativeElement);
    }
    this.chart.setOption(this.option, { notMerge: true });
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    this.chart?.dispose();
  }
}
