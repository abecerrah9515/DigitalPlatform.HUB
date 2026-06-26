import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PnlLineaDto } from '../../../../core/models/pnl.model';

export interface PnlDisplayRow {
  linea: PnlLineaDto;
  expanded: boolean;
  visible: boolean;
}

const MESES = [1,2,3,4,5,6,7,8,9,10,11,12];
const MES_NOMBRES = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function fmt(v: number): string {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000)     return (v / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000)         return (v / 1_000).toFixed(0) + 'K';
  return v.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

@Component({
  selector: 'app-pnl-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pnl-table.component.html',
  styleUrls: ['./pnl-table.component.scss']
})
export class PnlTableComponent implements OnChanges {
  @Input() data: PnlLineaDto[] = [];

  readonly meses     = MESES;
  readonly mesNombre = (m: number) => MES_NOMBRES[m] ?? String(m);

  displayRows: PnlDisplayRow[] = [];

  ngOnChanges() { this.buildDisplay(); }

  private buildDisplay() {
    this.displayRows = this.data.map(l => ({ linea: l, expanded: false, visible: true }));
  }

  toggleExpand(row: PnlDisplayRow, index: number) {
    if (!row.linea.children?.length) return;

    if (row.expanded) {
      row.expanded = false;
      this.collapseChildren(row.linea);
    } else {
      row.expanded = true;
      // HUE-09: insertar hijos ENCIMA del padre
      const childRows: PnlDisplayRow[] = row.linea.children.map(c => ({
        linea: c, expanded: false, visible: true,
      }));
      this.displayRows.splice(index, 0, ...childRows);
    }
  }

  private collapseChildren(node: PnlLineaDto) {
    if (!node.children?.length) return;
    for (const child of node.children) {
      const idx = this.displayRows.findIndex(r => r.linea === child);
      if (idx !== -1) {
        const childRow = this.displayRows[idx];
        if (childRow.expanded) { childRow.expanded = false; this.collapseChildren(child); }
        this.displayRows.splice(idx, 1);
      }
    }
  }

  hasWarning(row: PnlDisplayRow): boolean {
    const kids = row.linea.children;
    if (!kids?.length) return false;
    const sum = kids.reduce((s, c) => s + c.acum, 0);
    return Math.abs(row.linea.acum - sum) > 0.01;
  }

  getVal(linea: PnlLineaDto, mes: number): string { return fmt(linea.months[mes] ?? 0); }
  getAcum(linea: PnlLineaDto): string             { return fmt(linea.acum); }

  rowClass(level: number): string {
    switch (level) {
      case 1:  return 'bg-yellow-400 font-bold';
      case 2:  return 'bg-green-300 font-semibold';
      case 3:  return 'bg-yellow-100 font-medium';
      default: return 'bg-white';
    }
  }

  stickyClass(level: number): string {
    switch (level) {
      case 1:  return 'bg-yellow-400';
      case 2:  return 'bg-green-300';
      case 3:  return 'bg-yellow-100';
      default: return level === 4 ? 'bg-blue-200' : 'bg-white';
    }
  }
}
