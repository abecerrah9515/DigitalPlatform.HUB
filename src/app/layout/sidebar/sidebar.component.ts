import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CarteraService } from '../../core/services/cartera.service';
import type { CarteraNotificacionDto } from '../../core/models/cartera.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-[210px] min-h-screen bg-[#0d1117] flex flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-40">

      <!-- Logo -->
      <div class="px-4 pt-5 pb-4 border-b border-white/5">
        <img src="/logo-softtek.png" alt="Softtek" class="w-full object-contain" style="max-height:48px;" />
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        <!-- Finanzas -->
        <div>
          <button
            type="button"
            (click)="finanzasOpen.set(!finanzasOpen())"
            class="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:text-white hover:bg-white/5"
            [class.text-slate-200]="isFinanzasSection()"
            [class.text-slate-400]="!isFinanzasSection()"
          >
            <div class="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span>Finanzas</span>
            </div>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"
              class="transition-transform duration-200"
              [class.rotate-90]="finanzasOpen()"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          @if (finanzasOpen()) {
            <div class="ml-1 mt-0.5 space-y-0.5 pl-2 border-l border-white/10">
              <!-- Cartera -->
              <a
                routerLink="/finanzas/cartera"
                routerLinkActive
                #carteraLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="carteraLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6z"/>
                  <path d="M16 16v4H8v-4"/>
                  <path d="M12 12v4"/>
                </svg>
                <span>Cartera</span>
                @if (carteraLink.isActive) {
                  <button (click)="$event.preventDefault(); $event.stopPropagation(); toggleNotificacionesSidebar()"
                    class="ml-auto relative w-6 h-6 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
                    title="Notificaciones">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    @if (notificacionesSidebar().length > 0) {
                      <span class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                        {{ notificacionesSidebar().length }}
                      </span>
                    }
                  </button>
                }
              </a>

              <!-- Facturación -->
              <a
                routerLink="/finanzas/facturacion"
                routerLinkActive
                #facturacionLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="facturacionLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Facturación</span>
              </a>

              <!-- Clientes -->
              <a
                routerLink="/finanzas/clientes"
                routerLinkActive
                #clientesLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="clientesLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <span>Clientes</span>
              </a>

              <!-- Sub-Proyectos -->
              <a
                routerLink="/finanzas/subproyectos"
                routerLinkActive
                #subproyectosLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="subproyectosLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Sub-Proyectos</span>
              </a>

              <!-- Consolidar -->
              <a
                routerLink="/finanzas/consolidar"
                routerLinkActive
                #consolidarFinLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="consolidarFinLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>Consolidar</span>
              </a>

            </div>
          }
        </div>

        <!-- Proyectos -->
        <div>
          <button
            type="button"
            (click)="proyectosOpen.set(!proyectosOpen())"
            class="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:text-white hover:bg-white/5"
            [class.text-slate-200]="isProyectosSection()"
            [class.text-slate-400]="!isProyectosSection()"
          >
            <div class="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Proyectos</span>
            </div>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"
              class="transition-transform duration-200"
              [class.rotate-90]="proyectosOpen()"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          @if (proyectosOpen()) {
            <div class="ml-1 mt-0.5 space-y-0.5 pl-2 border-l border-white/10">

              <!-- Consolidar -->
              <a
                routerLink="/proyectos/consolidar"
                routerLinkActive
                #consolidarLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="consolidarLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>Consolidar</span>
              </a>

              <!-- Consolidado -->
              <a
                routerLink="/proyectos/consolidado"
                routerLinkActive
                #consolidadoLink="routerLinkActive"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="consolidadoLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>Consolidado</span>
              </a>

            </div>
          }
        </div>

        <!-- People -->
        <button
          type="button"
          (click)="peopleOpen.set(!peopleOpen())"
          class="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors"
        >
          <div class="flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>People</span>
          </div>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"
            class="transition-transform duration-200"
            [class.rotate-90]="peopleOpen()"
          >
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

      </nav>

      <!-- Modal Notificaciones (ventana emergente centrada full-screen) -->
      @if (showNotificacionesSidebar()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" (click)="showNotificacionesSidebar.set(false)">
          <div class="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 class="text-sm font-semibold text-slate-900">Notificaciones Cartera</h3>
              <button (click)="showNotificacionesSidebar.set(false)" class="text-slate-400 hover:text-slate-700 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            @for (n of notificacionesSidebar(); track n.id) {
              <div class="px-5 py-3 border-b border-slate-50 last:border-0">
                <div class="flex items-start gap-3">
                  <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    [class.bg-red-500]="n.tipo === 'Vencida'"
                    [class.bg-yellow-400]="n.tipo === 'PorVencer'">
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700">{{ n.cliente }}</p>
                    <p class="text-xs text-slate-500">{{ n.factura }} — {{ '$' + n.monto.toLocaleString('es-MX') }}</p>
                    <p class="text-xs"
                      [class.text-red-600]="n.tipo === 'Vencida'"
                      [class.text-yellow-600]="n.tipo === 'PorVencer'">
                      @if (n.tipo === 'Vencida') {
                        Vencida hace {{ n.diasMora }} días
                      } @else {
                        Vence el {{ n.fechaVencimiento }}
                      }
                    </p>
                  </div>
                </div>
              </div>
            }
            @if (notificacionesSidebar().length === 0) {
              <p class="px-5 py-8 text-sm text-slate-500 text-center">Sin notificaciones pendientes</p>
            }
          </div>
        </div>
      }
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private carteraSvc = inject(CarteraService);

  proyectosOpen = signal(true);
  finanzasOpen = signal(false);
  peopleOpen = signal(false);
  isProyectosSection = signal(false);
  isFinanzasSection = signal(false);

  notificacionesSidebar = signal<CarteraNotificacionDto[]>([]);
  showNotificacionesSidebar = signal(false);

  readonly activeLinkClass = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-blue-600 text-white font-medium';
  readonly inactiveLinkClass = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5';

  constructor() {
    const url = this.router.url;
    this.isProyectosSection.set(url.startsWith('/proyectos'));
    this.isFinanzasSection.set(url.startsWith('/finanzas'));

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      const u = (e as NavigationEnd).url;
      this.isProyectosSection.set(u.startsWith('/proyectos'));
      this.isFinanzasSection.set(u.startsWith('/finanzas'));
      if (u.startsWith('/finanzas')) {
        this.finanzasOpen.set(true);
        this.cargarNotificaciones();
      }
    });
  }

  ngOnInit() {
    if (this.router.url.startsWith('/finanzas')) {
      this.cargarNotificaciones();
    }
  }

  toggleNotificacionesSidebar() {
    this.showNotificacionesSidebar.update(v => !v);
  }

  private cargarNotificaciones() {
    this.carteraSvc.getNotificaciones().pipe(
      catchError(() => of([] as CarteraNotificacionDto[]))
    ).subscribe(d => this.notificacionesSidebar.set(d));
  }
}
