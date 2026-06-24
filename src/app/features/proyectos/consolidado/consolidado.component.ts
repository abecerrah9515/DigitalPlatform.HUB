import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';

import { GraficasService } from '../../../core/services/graficas.service';
import { KpisService } from '../../../core/services/kpis.service';

import { FiltrosParams, FiltrosValoresDto, BarrasApiladasResponseDto, PlanVsRealResponseDto, TendenciaResponseDto, TopClientesHorasResponseDto, TreemapAreaResponseDto, ScatterBurbujaResponseDto } from '../../../core/models/graficas.models';
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
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Consolidado</h1>
        <p class="text-sm text-slate-500 mt-0.5">Dashboard ejecutivo de Proyectos</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4 sticky top-0 z-20 shadow-sm">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3 items-end">

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
            [selectedValues]="selAnios()"
            (selectionChange)="onDropdownChange($event, 'Anio')"
          />

          <!-- Mes -->
          <app-filter-dropdown
            label="Mes"
            [options]="fvMesesLabel()"
            [selectedValues]="selMeses()"
            (selectionChange)="onMesChange($event)"
          />

          <!-- Cliente -->
          <div class="lg:col-span-2">
            <app-filter-dropdown
              label="Cliente"
              [options]="fvClientes()"
              [selectedValues]="selClientes()"
              (selectionChange)="onDropdownChange($event, 'Cliente')"
            />
          </div>

          <!-- Proyecto -->
          <app-filter-dropdown
            label="Proyecto"
            [options]="fvProyectos()"
            [selectedValues]="selProyectos()"
            (selectionChange)="onDropdownChange($event, 'CodProyecto')"
          />

          <!-- Vertical -->
          <app-filter-dropdown
            label="Vertical"
            [options]="fvVerticales()"
            [selectedValues]="selVerticales()"
            (selectionChange)="onDropdownChange($event, 'Vertical')"
          />

          <!-- Área -->
          <app-filter-dropdown
            label="Área"
            [options]="fvAreas()"
            [selectedValues]="selAreas()"
            (selectionChange)="onDropdownChange($event, 'Area')"
          />

          <!-- Sociedad -->
          <app-filter-dropdown
            label="Sociedad"
            [options]="fvPaises()"
            [selectedValues]="selPaises()"
            (selectionChange)="onDropdownChange($event, 'Pais')"
          />

        </div>

        @if (hayFiltrosActivos()) {
          <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
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
      <app-kpis [kpis]="kpis()" [moneda]="moneda()" [periodoLabel]="periodoLabel()" />

      <!-- Gráficas -->
      <div class="flex flex-col gap-[10px]">

        <!-- Fila 1: Barras apiladas — full width -->
        <app-barras-apiladas [data]="barrasApiladas()" [onToggle]="onToggleBarras" />

        <!-- Fila 2: Plan vs Real (1/3) + Tendencia (2/3) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-[10px]">
          <app-plan-vs-real [data]="planVsReal()" [targetPeriodos]="planVsRealPeriodos()" />
          <div class="lg:col-span-2">
            <app-tendencia [data]="tendencia()" />
          </div>
        </div>

        <!-- Fila 3: Top Clientes (2/3) + Treemap (1/3) — agrupados per HU ID 08 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-[10px] lg:items-stretch">
          <div class="lg:col-span-2">
            <app-top-clientes [data]="topClientes()" />
          </div>
          <app-treemap [data]="treemap()" />
        </div>

        <!-- Fila 4: Scatter — full width -->
        <app-scatter [data]="scatter()" />

        <!-- Fila 5: Heatmap — full width -->
        <app-heatmap [filtros]="filtros()" />

      </div>

      <!-- Tabla Detalle de Proyectos -->
      <div class="mt-[30px]">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-slate-800">Detalle de Proyectos</h2>
          <button (click)="descargar()" [disabled]="descargando()"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
        <app-tabla-proyectos
          [filtros]="tablaFiltros()"
          [moneda]="moneda()"
        />
      </div>

    </div>
  `,
})
export class ConsolidadoComponent implements OnInit {
  private readonly graficasSvc = inject(GraficasService);
  private readonly kpisSvc     = inject(KpisService);

  moneda   = signal('COP');
  filtros  = signal<FiltrosParams>({ Moneda: 'COP' });
  private fv = signal<FiltrosValoresDto | null>(null);

  // Getters para evitar ñ en templates
  fvAnios()      { return ((this.fv() as any)?.['años'] ?? [] as number[]).filter((a: number) => a !== 2024); }
  fvMeses()      { return this.fv()?.meses      ?? [] as number[]; }
  fvClientes()   { return this.fv()?.clientes   ?? [] as string[]; }
  fvProyectos()  { return this.fv()?.proyectos  ?? [] as string[]; }
  fvVerticales() { return this.fv()?.verticales ?? [] as string[]; }
  fvAreas()      { return this.fv()?.areas      ?? [] as string[]; }
  fvPaises()     { return this.fv()?.paises     ?? [] as string[]; }

  kpis              = signal<KpisDto | null>(null);
  barrasApiladas    = signal<BarrasApiladasResponseDto | null>(null);
  planVsReal        = signal<PlanVsRealResponseDto | null>(null);
  planVsRealPeriodos = signal<string[]>([]);
  tendencia      = signal<TendenciaResponseDto | null>(null);
  topClientes    = signal<TopClientesHorasResponseDto | null>(null);
  treemap        = signal<TreemapAreaResponseDto | null>(null);
  scatter        = signal<ScatterBurbujaResponseDto | null>(null);
  descargando    = signal(false);

  // Computed selections para mantener los dropdowns sincronizados con filtros
  selAnios      = computed(() => ((this.filtros() as any)['Año'] as number[] | undefined) ?? []);
  selMeses      = computed(() => (this.filtros().Mes ?? []).map(m => this.mesNombre(m)));
  selClientes   = computed(() => this.filtros().Cliente     ?? []);
  selProyectos  = computed(() => this.filtros().CodProyecto ?? []);
  selVerticales = computed(() => this.filtros().Vertical    ?? []);
  selAreas      = computed(() => this.filtros().Area        ?? []);
  selPaises     = computed(() => this.filtros().Pais        ?? []);

  tablaFiltros = computed<ProyectosFilterParams>(() => {
    const f = this.filtros();
    return {
      Moneda:      f.Moneda,
      Año:         f.Año,
      Mes:         f.Mes,
      Cliente:     f.Cliente,
      CodProyecto: f.CodProyecto,
      Industria:   f.Vertical,
      Area:        f.Area,
      Sociedad:    f.Pais,
    };
  });

  periodoLabel = computed<string | null>(() => {
    const f     = this.filtros();
    const anios = ((f as any)['Año'] as number[] | undefined) ?? [];
    const meses = f.Mes ?? [];

    if (!anios.length && !meses.length) return null;

    const añoSuffix = (a: number[]) => {
      if (!a.length) return '';
      const s = [...a].sort((x, y) => x - y);
      if (s.length === 1) return ` ${s[0]}`;
      const isRange = s.every((v, i) => i === 0 || v === s[i - 1] + 1);
      return isRange ? ` ${s[0]}-${s[s.length - 1]}` : ` ${s.join(', ')}`;
    };

    if (!meses.length) {
      const s = [...anios].sort((a, b) => a - b);
      if (s.length === 1) return String(s[0]);
      const isRange = s.every((v, i) => i === 0 || v === s[i - 1] + 1);
      return isRange ? `${s[0]}-${s[s.length - 1]}` : s.join(', ');
    }

    const sorted = [...meses].sort((a, b) => a - b);
    const suffix = añoSuffix(anios);

    if (sorted.length === 1) {
      return `${this.mesNombre(sorted[0])}${suffix}`;
    }

    const isConsecutive = sorted.every((m, i) => i === 0 || m === sorted[i - 1] + 1);
    if (isConsecutive) {
      return `${this.mesNombre(sorted[0])}-${this.mesNombre(sorted[sorted.length - 1])}${suffix}`;
    }
    return sorted.map(m => `${this.mesNombre(m)}${suffix}`).join(', ');
  });

  private agrupacionBarras = 'industria';

  hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return (f.Año?.length ?? 0) > 0 || (f.Mes?.length ?? 0) > 0 ||
           (f.Cliente?.length ?? 0) > 0 || (f.CodProyecto?.length ?? 0) > 0 ||
           (f.Vertical?.length ?? 0) > 0 || (f.Area?.length ?? 0) > 0 ||
           (f.Pais?.length ?? 0) > 0;
  });

  ngOnInit() { this.cargarFiltrosYDatos(); }

  onMonedaChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.moneda.set(val);
    this.filtros.update(f => ({ ...f, Moneda: val }));
    this.cargarFiltrosYDatos();
  }

  onDropdownChange(vals: (string | number)[], campo: 'Anio' | 'Cliente' | 'CodProyecto' | 'Vertical' | 'Area' | 'Pais') {
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
    const hasMeses = (f.Mes?.length ?? 0) > 0;
    if (anios?.length) {
      const sa = [...anios].sort((a, b) => a - b);
      const isRangeA = sa.length > 1 && sa.every((v, i) => i === 0 || v === sa[i - 1] + 1);
      const labelA = sa.length === 1 ? String(sa[0]) : isRangeA ? `${sa[0]}-${sa[sa.length - 1]}` : sa.join(', ');
      chips.push({ label: labelA, campo: 'Anio' });
    }
    if (hasMeses) {
      const sm = [...(f.Mes ?? [])].sort((a, b) => a - b);
      const isRangeM = sm.length > 1 && sm.every((m, i) => i === 0 || m === sm[i - 1] + 1);
      const labelM = sm.length === 1
        ? this.mesNombre(sm[0])
        : isRangeM ? `${this.mesNombre(sm[0])}-${this.mesNombre(sm[sm.length - 1])}` : sm.map(m => this.mesNombre(m)).join(', ');
      chips.push({ label: labelM, campo: 'Mes' });
    }
    if (f.Cliente?.length) chips.push({ label: f.Cliente.length === 1 ? f.Cliente[0] : `${f.Cliente.length} clientes`, campo: 'Cliente' });
    if (f.CodProyecto?.length) chips.push({ label: f.CodProyecto.length === 1 ? f.CodProyecto[0] : `${f.CodProyecto.length} proyectos`, campo: 'CodProyecto' });
    if (f.Vertical?.length) chips.push({ label: f.Vertical.join(', '), campo: 'Vertical' });
    if (f.Area?.length) chips.push({ label: f.Area.join(', '), campo: 'Area' });
    if (f.Pais?.length) chips.push({ label: f.Pais.join(', '), campo: 'Pais' });
    return chips;
  }

  quitarFiltro(campo: string) {
    const keyMap: Record<string, string> = { Anio: 'Año', Mes: 'Mes', Cliente: 'Cliente', CodProyecto: 'CodProyecto', Vertical: 'Vertical', Area: 'Area', Pais: 'Pais' };
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
      next: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename ?? this.nombreArchivoExcel();
        a.click();
        URL.revokeObjectURL(url);
        this.descargando.set(false);
      },
      error: () => this.descargando.set(false),
    });
  }

  private nombreArchivoExcel(): string {
    const f      = this.filtros();
    const moneda = (f.Moneda ?? 'COP').toUpperCase();
    const anios  = ([...((f as any)['Año'] as number[] | undefined) ?? []]).sort((a, b) => a - b);
    const meses  = ([...(f.Mes ?? [])]).sort((a, b) => a - b);
    const base   = `reporte_ejecutivo_${moneda}`;

    // Sin período → reporte_ejecutivo_moneda
    if (!anios.length && !meses.length) return `${base}.xlsx`;

    // Solo años → reporte_ejecutivo_moneda_YYYY  |  _YYYY_YYYY
    if (!meses.length) {
      const añoPart = anios.length === 1
        ? `${anios[0]}`
        : `${anios[0]}_${anios[anios.length - 1]}`;
      return `${base}_${añoPart}.xlsx`;
    }

    // Con meses (con o sin año)
    const añoPrefix = anios.length === 1 ? `_${anios[0]}`
      : anios.length > 1 ? `_${anios[0]}_${anios[anios.length - 1]}` : '';
    const mesPart = meses.length === 1
      ? String(meses[0]).padStart(2, '0')
      : `${String(meses[0]).padStart(2, '0')}_${String(meses[meses.length - 1]).padStart(2, '0')}`;

    return `${base}${añoPrefix}_${mesPart}.xlsx`;
  }

  mesNombre(m: number) { return MESES[m] ?? String(m); }

  private cargarFiltrosYDatos() {
    const f = this.filtros();

    // Limpiar datos previos para que no persistan al cambiar filtros
    this.kpis.set(null);
    this.barrasApiladas.set(null);
    this.planVsReal.set(null);
    this.tendencia.set(null);
    this.topClientes.set(null);
    this.treemap.set(null);
    this.scatter.set(null);

    this.graficasSvc.filtrosValores(f).pipe(
      catchError(err => { console.error('[filtrosValores]', err); return of(null); })
    ).subscribe(v => { if (v) this.fv.set(v); });

    forkJoin({
      kpis:    this.kpisSvc.getKpis(f).pipe(catchError(err => { console.error('[kpis]', err); return of(null); })),
      barras:  this.graficasSvc.barrasApiladas(f, this.agrupacionBarras).pipe(catchError(err => { console.error('[barrasApiladas]', err); return of(null); })),
      pvr:     this.graficasSvc.planVsReal(this.planVsRealFiltros(f)).pipe(catchError(err => { console.error('[planVsReal]', err); return of(null); })),
      tend:    this.graficasSvc.tendencia(f).pipe(catchError(err => { console.error('[tendencia]', err); return of(null); })),
      top:     this.graficasSvc.topClientesHoras(f).pipe(catchError(err => { console.error('[topClientes]', err); return of(null); })),
      tree:    this.graficasSvc.treemapArea(f).pipe(catchError(err => { console.error('[treemap]', err); return of(null); })),
      scatter: this.graficasSvc.scatterBurbuja(f).pipe(catchError(err => { console.error('[scatter]', err); return of(null); })),
    }).subscribe({
      next: r => {
        this.kpis.set(r.kpis);
        this.barrasApiladas.set(r.barras);
        this.planVsReal.set(r.pvr);
        this.tendencia.set(r.tend);
        this.topClientes.set(r.top);
        this.treemap.set(r.tree);
        this.scatter.set(r.scatter);
      },
      error: err => console.error('[forkJoin global]', err),
    });
  }

  /**
   * El backend ya calcula internamente la ventana de 3 meses consecutivos
   * cuando recibe exactamente Año+Mes. No expandir aquí: enviar los filtros
   * tal como el usuario los seleccionó.
   */
  private planVsRealFiltros(f: FiltrosParams): FiltrosParams {
    this.planVsRealPeriodos.set([]);
    return f;
  }
}
