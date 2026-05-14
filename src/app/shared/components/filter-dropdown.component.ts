import { Component, Input, Output, EventEmitter, signal, HostListener, ElementRef, inject, OnChanges } from '@angular/core';

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  template: `
    <div class="relative">
      <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
        {{ label }}
      </label>

      <!-- Trigger -->
      <button
        type="button"
        (click)="toggle()"
        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-colors bg-white text-left"
        [class.border-blue-500]="open()"
        [class.ring-2]="open()"
        [class.ring-blue-100]="open()"
        [class.border-slate-200]="!open()"
      >
        <span class="truncate" [class.text-slate-700]="selected().length > 0" [class.text-slate-400]="selected().length === 0">
          @if (selected().length === 0) {
            Todos
          } @else if (selected().length === 1) {
            {{ selected()[0] }}
          } @else {
            {{ selected().length }} seleccionados
          }
        </span>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          @if (selected().length > 0) {
            <span class="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {{ selected().length }}
            </span>
          }
          <svg class="w-3.5 h-3.5 text-slate-400 transition-transform duration-150"
            [class.rotate-180]="open()"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      <!-- Dropdown panel -->
      @if (open()) {
        <div class="absolute z-50 top-full mt-1 left-0 min-w-full w-max max-w-xs bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto">

          @if (options.length > 6) {
            <div class="px-3 py-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Buscar..."
                class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                [value]="search()"
                (input)="search.set($any($event.target).value)"
                (click)="$event.stopPropagation()"
              />
            </div>
          }

          @if (selected().length > 0) {
            <button
              type="button"
              (click)="clearAll()"
              class="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 border-b border-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Limpiar selección
            </button>
          }

          @for (opt of filtered(); track opt) {
            <label
              class="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
              (click)="$event.preventDefault(); toggle(opt)"
            >
              <span
                class="w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors"
                [class.bg-blue-600]="isSelected(opt)"
                [class.border-blue-600]="isSelected(opt)"
                [class.border-slate-300]="!isSelected(opt)"
              >
                @if (isSelected(opt)) {
                  <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                }
              </span>
              <span class="text-sm text-slate-700 truncate">{{ opt }}</span>
            </label>
          }

          @if (filtered().length === 0) {
            <p class="px-3 py-3 text-xs text-slate-400 text-center">Sin resultados</p>
          }
        </div>
      }
    </div>
  `,
})
export class FilterDropdownComponent implements OnChanges {
  @Input() label = '';
  @Input() options: (string | number)[] = [];
  @Input() initialSelected: (string | number)[] = [];
  @Output() selectionChange = new EventEmitter<(string | number)[]>();

  private readonly el = inject(ElementRef);

  open   = signal(false);
  search = signal('');
  selected = signal<(string | number)[]>([]);

  ngOnChanges() {
    if (this.initialSelected?.length) {
      this.selected.set([...this.initialSelected]);
    }
  }

  filtered(): (string | number)[] {
    const q = this.search().toLowerCase();
    if (!q) return this.options;
    return this.options.filter(o => String(o).toLowerCase().includes(q));
  }

  isSelected(opt: string | number) {
    return this.selected().includes(opt);
  }

  toggle(opt?: string | number) {
    if (opt === undefined) {
      this.open.update(v => !v);
      if (!this.open()) this.search.set('');
      return;
    }
    const cur = this.selected();
    const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt];
    this.selected.set(next);
    this.selectionChange.emit(next);
  }

  clearAll() {
    this.selected.set([]);
    this.selectionChange.emit([]);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(e.target)) {
      this.open.set(false);
      this.search.set('');
    }
  }
}
