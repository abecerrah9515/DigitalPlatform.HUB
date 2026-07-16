import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef, inject } from '@angular/core';
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
  private readonly elRef = inject(ElementRef);

  @Input() options!: PnlFiltrosOpciones;
  @Output() filtersChanged = new EventEmitter<PnlFiltros>();

  filtros: PnlFiltros = { clientes: [], proyectos: [], verticales: [], anio: null, moneda: 'COP' };

  searchCliente  = '';
  searchProyecto = '';

  // Estado abierto/cerrado de cada panel
  open = { cliente: false, proyecto: false, vertical: false, anio: false };

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.open = { cliente: false, proyecto: false, vertical: false, anio: false };
    }
  }

  toggle(panel: keyof typeof this.open) {
    const wasOpen = this.open[panel];
    this.open = { cliente: false, proyecto: false, vertical: false, anio: false };
    this.open[panel] = !wasOpen;
  }

  get clientesFiltrados(): string[] {
    const term = this.searchCliente.toLowerCase();
    return (this.options?.clientes ?? []).filter(c => !term || c.toLowerCase().includes(term));
  }

  get proyectosFiltrados(): string[] {
    const term = this.searchProyecto.toLowerCase();
    return (this.options?.proyectos ?? []).filter(p => !term || p.toLowerCase().includes(term));
  }

  selectedLabel(field: 'clientes' | 'proyectos' | 'verticales'): string {
    const arr = this.filtros[field];
    if (!arr.length) return 'Todas';
    if (arr.length === 1) return arr[0];
    return `${arr.length} seleccionados`;
  }

  setAnio(a: number)           { this.filtros = { ...this.filtros, anio: a };         this.emit(); }
  setMoneda(m: 'COP' | 'USD') { this.filtros = { ...this.filtros, moneda: m };        this.emit(); }

  toggleCliente(v: string)  { this.filtros = { ...this.filtros, clientes:   this.toggleArr(this.filtros.clientes,   v) }; this.emit(); }
  toggleProyecto(v: string) { this.filtros = { ...this.filtros, proyectos:  this.toggleArr(this.filtros.proyectos,  v) }; this.emit(); }
  toggleVertical(v: string) { this.filtros = { ...this.filtros, verticales: this.toggleArr(this.filtros.verticales, v) }; this.emit(); }

  clearClientes()   { this.filtros = { ...this.filtros, clientes:   [] }; this.emit(); }
  clearProyectos()  { this.filtros = { ...this.filtros, proyectos:  [] }; this.emit(); }

  clearFilters() {
    this.searchCliente = '';
    this.searchProyecto = '';
    this.filtros = { clientes: [], proyectos: [], verticales: [], anio: this.filtros.anio, moneda: this.filtros.moneda };
    this.open = { cliente: false, proyecto: false, vertical: false, anio: false };
    this.emit();
  }

  private toggleArr(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  }

  private emit() { this.filtersChanged.emit({ ...this.filtros }); }
}
