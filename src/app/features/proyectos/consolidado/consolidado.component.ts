import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';

import { GraficasService } from '../../../core/services/graficas.service';
import { KpisService } from '../../../core/services/kpis.service';

import { FiltrosParams, FiltrosValoresDto, BarrasApiladasResponseDto, PlanVsRealResponseDto, TendenciaResponseDto, TopClientesHorasResponseDto, TreemapAreaResponseDto, ScatterBurbujaResponseDto, HeatmapGmResponseDto } from '../../../core/models/graficas.models';
import { KpisDto } from '../../../core/models/kpis.models';
import { ProyectosFilterParams } from '../../../core/models/proyectos.models';

import { KpisComponent } from './kpis.component';
import { BarrasApiladasComponent } from './graficas/barras-apiladas.component';
import { PlanVsRealComponent } from './graficas/plan-vs-real.component';
import { TendenciaComponent } from './graficas/tendencia.component';
import { TopClientesComponent } from './graficas/top-clientes.component';
import { TreemapComponent } from './graficas/treemap.component';
import { ScatterComponent } from './graficas/scatter.component';
import { HeatmapComponent } from './graficas/heatmap.component';
import { TablaProyectosComponent } from './tabla-proyectos.component';

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

@Component({
  selector: 'app-consolidado',
  standalone: true,
  imports: [
    FilterDropdownComponent,
    KpisComponent,
    BarrasApiladasComponent,
    PlanVsRealComponent,
    TendenciaComponent,
    TopClientesComponent,
    TreemapComponent,
    ScatterComponent,
    HeatmapComponent,
    TablaProyectosComponent,
  ],
  template: `
    <div class="p-6 space-y-6 max-w-screen-2xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Consolidado</h1>
          <p class="text-sm text-slate-500 mt-0.5">Dashboard ejecutivo de Proyectos</p>
        </div>
        <button (click)="descargar()" [disabled]="descargando()"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          @if (descargando()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          }
          Exportar Excel
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div class="grid grid-cols-8 gap-3 items-end">

          <!-- Moneda -->
          <div class="flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Moneda</label>
            <select
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [value]="moneda()" (change)="onMonedaChange($event)">
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <!-- Año -->
          <app-filter-dropdown
            label="Año"
            [options]="fvAnios()"
            (selectionChange)="onDropdownChange($event, 'Anio')"
          />

          <!-- Mes -->
          <app-filter-dropdown
            label="Mes"
            [options]="fvMesesLabel()"
            (selectionChange)="onMesChange($event)"
          />

          <!-- Cliente -->
          <div class="col-span-2">
            <app-filter-dropdown
              label="Cliente"
              [options]="fvClientes()"
              (selectionChange)="onDropdownChange($event, 'Cliente')"
            />
          </div>

          <!-- Vertical -->
          <app-filter-dropdown
            label="Vertical"
            [options]="fvVerticales()"
            (selectionChange)="onDropdownChange($event, 'Vertical')"
          />

          <!-- Área -->
          <app-filter-dropdown
            label="Área"
            [options]="fvAreas()"
            (selectionChange)="onDropdownChange($event, 'Area')"
          />

          <!-- País -->
          <app-filter-dropdown
            label="País"
            [options]="fvPaises()"
            (selectionChange)="onDropdownChange($event, 'Pais')"
          />

        </div>

        @if (hayFiltrosActivos()) {
          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <span class="text-xs text-slate-400">Filtros activos:</span>
            @for (chip of filtrosChips(); track chip.label) {
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
                {{ chip.label }}
                <button (click)="quitarFiltro(chip.campo)" class="hover:text-blue-900 transition-colors">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            }
            <button (click)="limpiarFiltros()" class="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Limpiar todo
            </button>
          </div>
        }
      </div>

      <!-- KPIs -->
      <app-kpis [kpis]="kpis()" [moneda]="moneda()" />

      <!-- Gráficas fila 1 -->
      <div class="grid grid-cols-2 gap-4">
        <app-barras-apiladas [data]="barrasApiladas()" [onToggle]="onToggleBarras" />
        <app-plan-vs-real    [data]="planVsReal()" />
      </div>

      <!-- Gráficas fila 2 -->
      <div class="grid grid-cols-2 gap-4">
        <app-tendencia    [data]="tendencia()" />
        <app-top-clientes [data]="topClientes()" />
      </div>

      <!-- Gráficas fila 3 -->
      <div class="grid grid-cols-3 gap-4">
        <app-treemap [data]="treemap()" />
        <app-scatter [data]="scatter()" />
        <app-heatmap [data]="heatmap()" />
      </div>

      <!-- Tabla -->
      <app-tabla-proyectos
        [filtros]="tablaFiltros()"
        [moneda]="moneda()"
      />

    </div>
  `,
})
export class ConsolidadoComponent implements OnInit {
  private readonly graficasSvc = inject(GraficasService);
  private readonly kpisSvc     = inject(KpisService);

  moneda = signal('COP');
  filtros = signal<FiltrosParams>({ Moneda: 'COP' });
  private fv = signal<FiltrosValoresDto | null>(null);

  // Getters para evitar ñ en templates
  fvAnios()      { return (this.fv() as any)?.['años']    ?? [] as number[]; }
  fvMeses()      { return this.fv()?.meses      ?? [] as number[]; }
  fvClientes()   { return this.fv()?.clientes   ?? [] as string[]; }
  fvVerticales() { return this.fv()?.verticales ?? [] as string[]; }
  fvAreas()      { return this.fv()?.areas      ?? [] as string[]; }
  fvPaises()     { return this.fv()?.paises     ?? [] as string[]; }

  kpis           = signal<KpisDto | null>(null);
  barrasApiladas = signal<BarrasApiladasResponseDto | null>(null);
  planVsReal     = signal<PlanVsRealResponseDto | null>(null);
  tendencia      = signal<TendenciaResponseDto | null>(null);
  topClientes    = signal<TopClientesHorasResponseDto | null>(null);
  treemap        = signal<TreemapAreaResponseDto | null>(null);
  scatter        = signal<ScatterBurbujaResponseDto | null>(null);
  heatmap        = signal<HeatmapGmResponseDto | null>(null);
  descargando    = signal(false);

  tablaFiltros = computed<ProyectosFilterParams>(() => {
    const f = this.filtros();
    return {
      Moneda:    f.Moneda,
      Año:       f.Año,
      Mes:       f.Mes,
      Cliente:   f.Cliente,
      Industria: f.Vertical,
      Area:      f.Area,
    };
  });

  private agrupacionBarras = 'industria';

  hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return (f.Año?.length ?? 0) > 0 || (f.Mes?.length ?? 0) > 0 ||
           (f.Cliente?.length ?? 0) > 0 || (f.Vertical?.length ?? 0) > 0 ||
           (f.Area?.length ?? 0) > 0 || (f.Pais?.length ?? 0) > 0;
  });

  ngOnInit() { this.cargarFiltrosYDatos(); }

  onMonedaChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.moneda.set(val);
    this.filtros.update(f => ({ ...f, Moneda: val }));
    this.cargarFiltrosYDatos();
  }

  onDropdownChange(vals: (string | number)[], campo: 'Anio' | 'Cliente' | 'Vertical' | 'Area' | 'Pais') {
    if (campo === 'Anio') {
      this.filtros.update(f => ({ ...f, ['Año']: vals.map(Number) }));
    } else {
      this.filtros.update(f => ({ ...f, [campo]: vals as string[] }));
    }
    this.cargarFiltrosYDatos();
  }

  onMesChange(vals: (string | number)[]) {
    const nums = vals.map(v => this.fvMeses().find((_, i) => MESES[this.fvMeses()[i]] === v || this.fvMeses()[i] === v) ?? Number(v));
    this.filtros.update(f => ({ ...f, Mes: nums as number[] }));
    this.cargarFiltrosYDatos();
  }

  fvMesesLabel(): string[] {
    return this.fvMeses().map(m => this.mesNombre(m));
  }

  filtrosChips(): { label: string; campo: string }[] {
    const f = this.filtros();
    const chips: { label: string; campo: string }[] = [];
    const anios = (f as any)['Año'] as number[] | undefined;
    if (anios?.length) chips.push({ label: anios.join(', '), campo: 'Anio' });
    if (f.Mes?.length) chips.push({ label: f.Mes.map(m => this.mesNombre(m)).join(', '), campo: 'Mes' });
    if (f.Cliente?.length) chips.push({ label: f.Cliente.length === 1 ? f.Cliente[0] : `${f.Cliente.length} clientes`, campo: 'Cliente' });
    if (f.Vertical?.length) chips.push({ label: f.Vertical.join(', '), campo: 'Vertical' });
    if (f.Area?.length) chips.push({ label: f.Area.join(', '), campo: 'Area' });
    if (f.Pais?.length) chips.push({ label: f.Pais.join(', '), campo: 'Pais' });
    return chips;
  }

  quitarFiltro(campo: string) {
    const keyMap: Record<string, string> = { Anio: 'Año', Mes: 'Mes', Cliente: 'Cliente', Vertical: 'Vertical', Area: 'Area', Pais: 'Pais' };
    const key = keyMap[campo];
    if (key) {
      this.filtros.update(f => { const n = { ...f }; delete (n as any)[key]; return n; });
      this.cargarFiltrosYDatos();
    }
  }

  onToggleBarras = (agrupacion: string) => {
    this.agrupacionBarras = agrupacion;
    this.graficasSvc.barrasApiladas(this.filtros(), agrupacion)
      .subscribe(d => this.barrasApiladas.set(d));
  };

  limpiarFiltros() {
    this.filtros.set({ Moneda: this.moneda() });
    this.cargarFiltrosYDatos();
  }

  descargar() {
    this.descargando.set(true);
    this.graficasSvc.descargar(this.filtros()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'consolidado.xlsx'; a.click();
        URL.revokeObjectURL(url);
        this.descargando.set(false);
      },
      error: () => this.descargando.set(false),
    });
  }

  mesNombre(m: number) { return MESES[m] ?? String(m); }

  private cargarFiltrosYDatos() {
    const f = this.filtros();
    this.graficasSvc.filtrosValores(f).subscribe(v => this.fv.set(v));

    forkJoin({
      kpis:    this.kpisSvc.getKpis(f),
      barras:  this.graficasSvc.barrasApiladas(f, this.agrupacionBarras),
      pvr:     this.graficasSvc.planVsReal(f),
      tend:    this.graficasSvc.tendencia(f),
      top:     this.graficasSvc.topClientesHoras(f),
      tree:    this.graficasSvc.treemapArea(f),
      scatter: this.graficasSvc.scatterBurbuja(f),
      heat:    this.graficasSvc.heatmapGm(f),
    }).subscribe({
      next: r => {
        this.kpis.set(r.kpis);
        this.barrasApiladas.set(r.barras);
        this.planVsReal.set(r.pvr);
        this.tendencia.set(r.tend);
        this.topClientes.set(r.top);
        this.treemap.set(r.tree);
        this.scatter.set(r.scatter);
        this.heatmap.set(r.heat);
      },
    });

  }
}
