import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
        <button
          type="button"
          (click)="finanzasOpen.set(!finanzasOpen())"
          class="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors"
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

              <!-- P&L -->
              <a
                routerLink="/proyectos/pnl"
                routerLinkActive
                #pnlLink="routerLinkActive"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                [class]="pnlLink.isActive ? activeLinkClass : inactiveLinkClass"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>P&L</span>
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
    </aside>
  `
})
export class SidebarComponent {
  private router = inject(Router);

  proyectosOpen = signal(true);
  finanzasOpen = signal(false);
  peopleOpen = signal(false);
  isProyectosSection = signal(false);

  readonly activeLinkClass = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-blue-600 text-white font-medium';
  readonly inactiveLinkClass = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5';

  constructor() {
    this.isProyectosSection.set(this.router.url.startsWith('/proyectos'));

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.isProyectosSection.set((e as NavigationEnd).url.startsWith('/proyectos'));
    });
  }
}
