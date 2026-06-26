import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PnlFiltrosOpciones, PnlFiltros } from '../../../../core/models/pnl.model';

@Component({
  selector: 'app-pnl-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pnl-filters.component.html',
  styleUrls: ['./pnl-filters.component.scss']
})
export class PnlFiltersComponent implements OnInit, OnChanges {
  @Input() options!: PnlFiltrosOpciones;
  @Output() filtersChanged = new EventEmitter<PnlFiltros>();

  filtros: PnlFiltros = { clientes: [], proyectos: [], verticales: [], anio: null };

  searchCliente  = '';
  searchProyecto = '';

  ngOnInit() { this.initDefaultYear(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && !changes['options'].firstChange && this.filtros.anio === null) {
      this.initDefaultYear();
    }
  }

  private initDefaultYear() {
    if (this.options?.anios?.length) {
      this.filtros.anio = Math.max(...this.options.anios);
      this.emit();
    }
  }

  get clientesFiltrados(): string[] {
    const term = this.searchCliente.toLowerCase();
    return (this.options?.clientes ?? []).filter(c => !term || c.toLowerCase().includes(term));
  }

  get proyectosFiltrados(): string[] {
    const term = this.searchProyecto.toLowerCase();
    return (this.options?.proyectos ?? []).filter(p => !term || p.toLowerCase().includes(term));
  }

  setAnio(a: number) { this.filtros.anio = a; this.emit(); }

  toggleCliente(v: string)  { this.filtros = { ...this.filtros, clientes:  this.toggle(this.filtros.clientes,  v) }; this.emit(); }
  toggleProyecto(v: string) { this.filtros = { ...this.filtros, proyectos: this.toggle(this.filtros.proyectos, v) }; this.emit(); }
  toggleVertical(v: string) { this.filtros = { ...this.filtros, verticales: this.toggle(this.filtros.verticales, v) }; this.emit(); }

  clearFilters() {
    this.searchCliente = '';
    this.searchProyecto = '';
    this.filtros = { clientes: [], proyectos: [], verticales: [], anio: this.filtros.anio };
    this.emit();
  }

  private toggle(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  }

  private emit() { this.filtersChanged.emit({ ...this.filtros }); }
}
