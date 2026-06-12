import { Component, signal, inject, NgZone } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CargaArchivoService } from '../../../core/services/carga-archivo.service';
import { CargaArchivoDto } from '../../../core/models/carga-archivo.models';

interface UploadSlot {
  key: string;
  label: string;
  desc: string;
  file: File | null;
  dragOver: boolean;
  uploading: boolean;
  result: string | null;
  error: boolean;
}

@Component({
  selector: 'app-consolidar-finanzas',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="p-6 max-w-5xl mx-auto">

      <div class="mb-7">
        <h1 class="text-xl font-semibold text-slate-900">Consolidar Finanzas</h1>
        <p class="text-sm text-slate-500 mt-0.5">Carga los archivos fuente para consolidar los datos de Finanzas</p>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-8">
        @for (slot of slots(); track slot.key) {
          <div
            class="rounded-xl border-2 transition-all p-5"
            [class.border-slate-200]="!slot.file && !slot.dragOver && !slot.uploading"
            [class.bg-white]="!slot.file && !slot.dragOver && !slot.uploading"
            [class.border-blue-400]="slot.dragOver"
            [class.bg-blue-50]="slot.dragOver"
            [class.border-green-300]="slot.file && !slot.dragOver && !slot.uploading"
            [class.bg-green-50]="slot.file && !slot.dragOver && !slot.uploading"
            [class.border-yellow-300]="slot.uploading"
            [class.bg-yellow-50]="slot.uploading"
          >
            <div class="flex items-start justify-between mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                [class.bg-green-100]="slot.file !== null && !slot.uploading"
                [class.bg-slate-100]="slot.file === null && !slot.uploading"
                [class.bg-yellow-100]="slot.uploading"
              >
                @if (slot.uploading) {
                  <svg class="w-5 h-5 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                } @else if (slot.file) {
                  <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                }
              </div>
              @if (slot.file && !slot.uploading) {
                <button (click)="removeFile($event, slot.key)"
                  class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex-shrink-0">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
            <p class="text-sm font-semibold text-slate-700 mb-1">{{ slot.label }}</p>
            <p class="text-xs text-slate-400 mb-3">{{ slot.desc }}</p>

            @if (slot.uploading) {
              <p class="text-xs text-yellow-700 font-medium">Subiendo...</p>
            } @else if (slot.result) {
              <p class="text-xs" [class.text-green-700]="!slot.error" [class.text-red-600]="slot.error">{{ slot.result }}</p>
            } @else if (slot.file) {
              <div class="flex items-center gap-2 mt-1">
                <p class="text-xs text-green-700 font-medium truncate flex-1" [title]="slot.file.name">{{ slot.file.name }}</p>
                <button (click)="subirIndividual(slot.key)"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  Subir
                </button>
              </div>
            } @else {
              <div>
                <button (click)="selectFile(slot.key)"
                  (dragover)="onDragOver($event, slot.key)"
                  (dragleave)="onDragLeave(slot.key)"
                  (drop)="onDrop($event, slot.key)"
                  class="w-full text-left">
                  <p class="text-xs text-slate-400">
                    {{ slot.dragOver ? 'Suelta el archivo aquí' : 'Arrastra o haz clic para seleccionar' }}
                  </p>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Historial de cargas</h2>
          </div>
          <button (click)="loadHistorial()"
            class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>
        </div>

        @if (loadingHistorial()) {
          <div class="flex items-center justify-center py-14 gap-2 text-slate-400">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-sm">Cargando historial...</span>
          </div>
        } @else if (historial().length === 0) {
          <div class="py-14 text-center">
            <svg class="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-sm text-slate-400">No hay cargas registradas</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  <th class="px-5 py-3 text-left">Fecha</th>
                  <th class="px-5 py-3 text-left">Tipo</th>
                  <th class="px-5 py-3 text-left">Archivo</th>
                  <th class="px-5 py-3 text-right">Registros</th>
                </tr>
              </thead>
              <tbody>
                @for (item of historial(); track item.id) {
                  <tr class="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">{{ item.fechaCarga | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {{ tipoLabel(item.tipo) }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-slate-600 truncate max-w-[200px]" [title]="item.nombreArchivo">{{ item.nombreArchivo }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-700 text-right">{{ item.totalRegistros }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class ConsolidarFinanzasComponent {
  private readonly svc = inject(CargaArchivoService);
  private readonly zone = inject(NgZone);

  slots = signal<UploadSlot[]>([
    { key: 'base-clientes', label: 'Base de datos de clientes', desc: 'BASE DE DATOS CLIENTES.xls', file: null, dragOver: false, uploading: false, result: null, error: false },
    { key: 'control-facturas', label: 'Control de facturas', desc: 'Control de Facturas-Notas creditos.xlsx', file: null, dragOver: false, uploading: false, result: null, error: false },
    { key: 'reporte-cartera', label: 'Reporte de cartera', desc: 'Reporte de cartera.xlsm', file: null, dragOver: false, uploading: false, result: null, error: false },
  ]);

  historial = signal<CargaArchivoDto[]>([]);
  loadingHistorial = signal(false);

  constructor() {
    this.loadHistorial();
  }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      'base-clientes': 'Base Clientes',
      'control-facturas': 'Control Fact.',
      'reporte-cartera': 'Reporte Cartera',
    };
    return map[tipo] ?? tipo;
  }

  selectFile(key: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) this.zone.run(() => this.setFile(key, file));
      document.body.removeChild(input);
    });
    input.click();
  }

  removeFile(event: MouseEvent, key: string) {
    event.stopPropagation();
    this.setFile(key, null);
  }

  private setFile(key: string, file: File | null) {
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, file, result: null, error: false } : s));
  }

  onDragOver(event: DragEvent, key: string) {
    event.preventDefault();
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: true } : s));
  }

  onDragLeave(key: string) {
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: false } : s));
  }

  onDrop(event: DragEvent, key: string) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(key, file);
    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, dragOver: false } : s));
  }

  subirIndividual(key: string) {
    const slot = this.slots().find(s => s.key === key);
    if (!slot || !slot.file || slot.uploading) return;

    this.slots.update(arr => arr.map(s => s.key === key ? { ...s, uploading: true, result: null, error: false } : s));

    this.svc.upload(key, slot.file).subscribe({
      next: msg => {
        this.slots.update(arr => arr.map(s => s.key === key ? { ...s, uploading: false, result: msg ?? null, error: false } : s));
        this.loadHistorial();
      },
      error: err => {
        this.slots.update(arr => arr.map(s => s.key === key ? { ...s, uploading: false, result: err.message || 'Error al subir', error: true } : s));
      },
    });
  }

  loadHistorial() {
    this.loadingHistorial.set(true);
    this.svc.getHistorial().subscribe({
      next: d => { this.historial.set(d); this.loadingHistorial.set(false); },
      error: () => this.loadingHistorial.set(false),
    });
  }
}
