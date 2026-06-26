import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { PnlFiltersComponent } from './components/pnl-filters/pnl-filters.component';
import { PnlTableComponent } from './components/pnl-table/pnl-table.component';
import { PnlService } from '../../core/services/pnl.service';
import { PnlFiltrosOpciones, PnlFiltros, PnlLineaDto } from '../../core/models/pnl.model';

@Component({
  selector: 'app-pnl',
  standalone: true,
  imports: [CommonModule, PnlFiltersComponent, PnlTableComponent],
  templateUrl: './pnl.component.html'
})
export class PnlComponent implements OnInit, OnDestroy {
  private readonly svc    = inject(PnlService);
  private readonly reload$ = new Subject<PnlFiltros>();
  private readonly destroy$ = new Subject<void>();

  filtrosOpciones = signal<PnlFiltrosOpciones | null>(null);
  datos           = signal<PnlLineaDto[]>([]);
  isLoading       = signal(false);

  ngOnInit() {
    this.svc.getFiltros().subscribe(opts => this.filtrosOpciones.set(opts));

    this.reload$.pipe(
      switchMap(f => {
        this.isLoading.set(true);
        this.datos.set([]);
        return this.svc.getDatos(f);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: data => { this.datos.set(data); this.isLoading.set(false); },
      error: ()   => { this.isLoading.set(false); },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChanged(f: PnlFiltros) {
    this.reload$.next(f);
  }
}
