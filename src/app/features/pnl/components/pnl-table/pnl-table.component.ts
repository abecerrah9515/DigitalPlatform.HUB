import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PnlNodoDto } from '../../../../core/models/pnl.model';

export interface PnlDisplayRow {
  dto: PnlNodoDto;
  expanded: boolean;
  visible: boolean;
}

const MES_NOMBRES = ['', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function fmt(v: number): string {
  if (v === 0) return '—';
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
  @Input() data: PnlNodoDto[] = [];

  readonly meses     = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly mesNombre = (m: number) => MES_NOMBRES[m] ?? String(m);

  displayRows: PnlDisplayRow[] = [];

  private childrenOf = new Map<string | null, PnlNodoDto[]>();

  ngOnChanges() { this.buildDisplay(); }

  private buildDisplay() {
    this.childrenOf = new Map<string | null, PnlNodoDto[]>();
    for (const node of this.data) {
      // parentId vacío ('') se trata igual que null → nodo raíz
      const key = node.parentId || null;
      if (!this.childrenOf.has(key)) this.childrenOf.set(key, []);
      this.childrenOf.get(key)!.push(node);
    }
    const roots = this.childrenOf.get(null) ?? [];
    this.displayRows = roots.map(n => ({ dto: n, expanded: false, visible: true }));
  }

  toggleExpand(row: PnlDisplayRow, index: number) {
    if (!row.dto.tieneHijos) return;

    if (row.expanded) {
      row.expanded = false;
      this.collapseChildren(row.dto.lineItemId);
    } else {
      row.expanded = true;
      const children = this.childrenOf.get(row.dto.lineItemId) ?? [];
      const childRows: PnlDisplayRow[] = children.map(c => ({ dto: c, expanded: false, visible: true }));
      // HUE-09: insertar hijos ENCIMA del padre
      this.displayRows.splice(index, 0, ...childRows);
    }
  }

  private collapseChildren(lineItemId: string) {
    const toRemove = new Set<string>();
    this.collectDescendants(lineItemId, toRemove);
    this.displayRows = this.displayRows.filter(r => !toRemove.has(r.dto.lineItemId));
  }

  private collectDescendants(lineItemId: string, result: Set<string>) {
    for (const child of this.childrenOf.get(lineItemId) ?? []) {
      result.add(child.lineItemId);
      this.collectDescendants(child.lineItemId, result);
    }
  }

  expandAll() {
    this.displayRows = this.data.map(n => ({ dto: n, expanded: true, visible: true }));
  }

  collapseAll() {
    const roots = this.childrenOf.get(null) ?? [];
    this.displayRows = roots.map(n => ({ dto: n, expanded: false, visible: true }));
  }

  getVal(dto: PnlNodoDto, mes: number): string {
    return fmt(dto.valores[mes - 1] ?? 0);
  }

  getAcum(dto: PnlNodoDto): string {
    return fmt(dto.acum);
  }

  rowClass(dto: PnlNodoDto): string {
    if (dto.nivel === 1) {
      return dto.tieneFormula
        ? 'bg-sky-100 font-bold'
        : 'bg-yellow-400 font-bold';
    }
    if (dto.esHoja) return 'bg-white';
    switch (dto.nivel) {
      case 2:  return 'bg-green-300 font-semibold';
      case 3:  return 'bg-yellow-100 font-medium';
      default: return 'bg-white';
    }
  }

  stickyClass(dto: PnlNodoDto): string {
    if (dto.nivel === 1) {
      return dto.tieneFormula ? 'bg-sky-100' : 'bg-yellow-400';
    }
    if (dto.esHoja) return 'bg-blue-200';
    switch (dto.nivel) {
      case 2:  return 'bg-green-300';
      case 3:  return 'bg-yellow-100';
      default: return 'bg-white';
    }
  }
}
