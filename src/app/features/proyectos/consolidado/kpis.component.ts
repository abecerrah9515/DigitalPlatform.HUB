import { Component, Input } from '@angular/core';
import { KpisDto, KpiItemDto } from '../../../core/models/kpis.models';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400 font-medium uppercase tracking-wide">{{ label }}</span>
        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
          [class.bg-green-500]="kpi.semaforo === 'Verde'"
          [class.bg-yellow-400]="kpi.semaforo === 'Amarillo'"
          [class.bg-red-500]="kpi.semaforo === 'Rojo'"
          [class.bg-slate-300]="kpi.semaforo !== 'Verde' && kpi.semaforo !== 'Amarillo' && kpi.semaforo !== 'Rojo'"
        ></span>
      </div>

      <div class="flex items-end gap-1.5">
        @if (kpi.unidad === '$') {
          <span class="text-xs text-slate-400 mb-0.5">{{ moneda }}</span>
        }
        <span class="text-2xl font-bold text-slate-900 leading-none">{{ formatValor(kpi.valor, kpi.unidad) }}</span>
        @if (kpi.unidad === '%' || kpi.unidad === 'h') {
          <span class="text-sm text-slate-400 mb-0.5">{{ kpi.unidad }}</span>
        }
        <span class="ml-auto text-sm" [class]="tendenciaClass()">{{ tendenciaIcon() }}</span>
      </div>

      @if (kpi.badgeTexto) {
        <span class="self-start text-xs px-2 py-0.5 rounded-full font-medium"
          [class.bg-green-100]="kpi.semaforo === 'Verde'"
          [class.text-green-700]="kpi.semaforo === 'Verde'"
          [class.bg-yellow-100]="kpi.semaforo === 'Amarillo'"
          [class.text-yellow-700]="kpi.semaforo === 'Amarillo'"
          [class.bg-red-100]="kpi.semaforo === 'Rojo'"
          [class.text-red-700]="kpi.semaforo === 'Rojo'"
          [class.bg-slate-100]="kpi.semaforo !== 'Verde' && kpi.semaforo !== 'Amarillo' && kpi.semaforo !== 'Rojo'"
          [class.text-slate-500]="kpi.semaforo !== 'Verde' && kpi.semaforo !== 'Amarillo' && kpi.semaforo !== 'Rojo'"
        >{{ kpi.badgeTexto }}</span>
      }

      @if (kpi.subtitulo) {
        <p class="text-xs text-slate-400 -mt-1">{{ kpi.subtitulo }}</p>
      }
    </div>
  `,
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() kpi!: KpiItemDto;
  @Input() moneda = 'COP';

  tendenciaIcon() {
    if (this.kpi.tendencia === 'Arriba') return '↑';
    if (this.kpi.tendencia === 'Abajo') return '↓';
    return '—';
  }

  tendenciaClass() {
    if (this.kpi.tendencia === 'Arriba') return 'text-green-500 font-bold';
    if (this.kpi.tendencia === 'Abajo') return 'text-red-500 font-bold';
    return 'text-slate-300';
  }

  formatValor(valor: number, unidad: string | null): string {
    if (unidad === '%') return valor.toFixed(1);
    if (unidad === 'h') return valor.toLocaleString('es-MX', { maximumFractionDigits: 0 });
    if (unidad === '$') {
      if (valor >= 1_000_000) return (valor / 1_000_000).toFixed(1) + 'M';
      if (valor >= 1_000) return (valor / 1_000).toFixed(0) + 'K';
      return valor.toFixed(0);
    }
    return valor.toLocaleString('es-MX');
  }
}

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [KpiCardComponent],
  template: `
    @if (kpis) {
      <div class="grid grid-cols-5 gap-4">
        <app-kpi-card label="Ingreso Total Real"    [kpi]="kpis.ingresoTotalReal"         [moneda]="moneda" />
        <app-kpi-card label="Margen GM"             [kpi]="kpis.margenGM"                 [moneda]="moneda" />
        <app-kpi-card label="Horas Entregadas"      [kpi]="kpis.horasEntregadas"          [moneda]="moneda" />
        <app-kpi-card label="Tarifa Entrega Prom."  [kpi]="kpis.tarifaEntregaPromedio"    [moneda]="moneda" />
        <app-kpi-card label="Cumplimiento Plan"     [kpi]="kpis.cumplimientoIngresosPlan" [moneda]="moneda" />
      </div>
    } @else {
      <div class="grid grid-cols-5 gap-4">
        @for (_ of [1,2,3,4,5]; track $index) {
          <div class="bg-white rounded-xl border border-slate-200 h-28 animate-pulse"></div>
        }
      </div>
    }
  `,
})
export class KpisComponent {
  @Input() kpis: KpisDto | null = null;
  @Input() moneda = 'COP';
}
