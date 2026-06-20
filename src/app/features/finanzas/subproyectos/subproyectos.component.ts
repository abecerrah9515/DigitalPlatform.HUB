import { DecimalPipe } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SubProyectoResumenDto,
  SubProyectoDto,
  DirectorioEmpresaDto,
  NotificacionBRMDto,
} from '../../../core/models/cartera.models';

@Component({
  selector: 'app-subproyectos',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="p-6 space-y-6 max-w-screen-2xl mx-auto">

      <!-- Header -->
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Sub-Proyectos</h1>
        <p class="text-sm text-slate-500 mt-0.5">Gestión de proyectos, directorio y notificaciones</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">Cliente</label>
            <input type="text" [value]="filtroCliente()" (input)="filtroCliente.set($any($event.target).value)"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Buscar por cliente...">
          </div>
          <div class="flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">Proyecto</label>
            <input type="text" [value]="filtroProyecto()" (input)="filtroProyecto.set($any($event.target).value)"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Buscar por proyecto...">
          </div>
          <div class="flex flex-col gap-1">
            <label class="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">Moneda</label>
            <select [value]="moneda()" (change)="onMonedaChange($any($event.target).value)"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Proyectos</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{{ resumen()?.totalProyectos ?? 0 | number }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Proyectos Activos</p>
          <p class="text-2xl font-bold text-green-600 mt-1">{{ resumen()?.proyectosActivos ?? 0 | number }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Pendiente Documentación</p>
          <p class="text-2xl font-bold text-amber-600 mt-1">{{ resumen()?.pendientesDocumentacion ?? 0 | number }}</p>
        </div>
      </div>

      <!-- Project Cards -->
      <div class="space-y-3">
        @for (proy of proyectosFiltrados(); track proy.id) {
          <div>
            <div (click)="seleccionarProyecto(proy)"
              class="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              [class.ring-2]="proyectoSeleccionado()?.id === proy.id"
              [class.ring-blue-500]="proyectoSeleccionado()?.id === proy.id">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900">
                  {{ proy.nombre }}
                  <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-medium text-slate-500">{{ proy.codigo }}</span>
                </p>
                <p class="text-xs text-slate-500 mt-1">{{ proy.cliente }}</p>
              </div>
              <div class="flex items-center gap-4 flex-shrink-0 ml-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  [class.bg-green-100]="proy.estado === 'Activo'"
                  [class.text-green-700]="proy.estado === 'Activo'"
                  [class.bg-slate-100]="proy.estado !== 'Activo'"
                  [class.text-slate-600]="proy.estado !== 'Activo'">
                  {{ proy.estado }}
                </span>
                <span class="text-sm font-semibold text-slate-700 w-28 text-right">{{ formatMonto(proy.valor) }}</span>
                <svg class="w-4 h-4 text-slate-300 transition-transform"
                  [class.rotate-90]="proyectoSeleccionado()?.id === proy.id"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>

            <!-- Inline Detail -->
            @if (proyectoSeleccionado()?.id === proy.id) {
              <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mt-1">
                <div class="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600 text-[10px] font-mono font-medium text-white">{{ proy.codigo }}</span>
                  <span class="text-xs text-slate-600">{{ proy.nombre }}</span>
                  <span class="text-[10px] text-slate-300">|</span>
                  <span class="text-xs text-slate-500">{{ proy.cliente }}</span>
                </div>

                <div class="px-5 py-4">
                  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Directorio</h3>
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                          <th class="px-4 py-3 text-left">Contacto</th>
                          <th class="px-4 py-3 text-left">Cargo</th>
                          <th class="px-4 py-3 text-left">Email</th>
                          <th class="px-4 py-3 text-left">Teléfono</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (contacto of directorio(); track contacto.email) {
                          <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td class="px-4 py-3 text-sm text-slate-700">{{ contacto.contacto }}</td>
                            <td class="px-4 py-3 text-sm text-slate-500">{{ contacto.cargo }}</td>
                            <td class="px-4 py-3 text-sm text-blue-600">{{ contacto.email }}</td>
                            <td class="px-4 py-3 text-sm text-slate-500">{{ contacto.telefono }}</td>
                          </tr>
                        }
                        @if (directorio().length === 0) {
                          <tr>
                            <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400">
                              No hay contactos registrados en el directorio
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="flex items-center justify-between mt-4">
                    <!-- Upload -->
                    <label
                      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Cargar Archivo (informacion clientes, correos, telefonos)
                      <input type="file" (change)="onFileSelected($event)" accept=".xlsx,.xls,.csv" class="hidden">
                    </label>

                    <div class="flex items-center gap-3">
                      @if (subiendoArchivo()) {
                        <span class="text-sm text-slate-400 flex items-center gap-1.5">
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Subiendo...
                        </span>
                      }
                      @if (uploadMensaje(); as msg) {
                        <span class="text-sm"
                          [class.text-green-600]="uploadExitoso()"
                          [class.text-red-600]="!uploadExitoso()">
                          {{ msg }}
                        </span>
                      }

                      <button (click)="showModalNotificacion.set(true)"
                        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Enviar Notificación a Cliente/BRM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
        @if (proyectosFiltrados().length === 0) {
          <div class="text-center py-10 text-sm text-slate-400">No se encontraron proyectos</div>
        }
      </div>

    </div>

    <!-- Notification Modal -->
    @if (showModalNotificacion()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Enviar Notificación a Cliente / BRM</h3>
                @if (proyectoSeleccionado(); as proy) {
                  <p class="text-xs text-slate-400 mt-0.5">{{ proy.nombre }} ({{ proy.codigo }})</p>
                }
              </div>
              <button (click)="cerrarModalNotificacion()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-slate-500">Correo del Cliente</label>
              <input type="email" [(ngModel)]="notificacion().correoCliente"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="cliente@empresa.com">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-slate-500">Correo del BRM</label>
              <input type="email" [(ngModel)]="notificacion().correoBRM"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="brm@softtek.com">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-slate-500">Asunto</label>
              <input type="text" [(ngModel)]="notificacion().asunto"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Asunto del correo">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-slate-500">Enlace SharePoint</label>
              <input type="url" [(ngModel)]="notificacion().sharepointLink"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://softtek.sharepoint.com/...">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-slate-500">Mensaje</label>
              <textarea [(ngModel)]="notificacion().mensaje" rows="4"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Escriba el mensaje..."></textarea>
            </div>
          </div>

          <div class="px-6 pb-6 pt-2 flex-shrink-0 flex items-center gap-3 justify-end">
            <button (click)="cerrarModalNotificacion()"
              class="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button (click)="enviarNotificacion()" [disabled]="enviandoNotificacion()"
              class="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if (enviandoNotificacion()) {
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Enviando...
                </span>
              } @else {
                Aceptar y Enviar
              }
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class SubproyectosComponent implements OnInit {
  private readonly carteraSvc  = inject(CarteraService);
  private readonly notifSvc   = inject(NotificationService);

  moneda         = signal('COP');
  filtroCliente  = signal('');
  filtroProyecto = signal('');
  tasaCambio     = signal(1);

  resumen               = signal<SubProyectoResumenDto | null>(null);
  proyectos             = signal<SubProyectoDto[]>([]);
  proyectoSeleccionado  = signal<SubProyectoDto | null>(null);
  directorio            = signal<DirectorioEmpresaDto[]>([]);

  subiendoArchivo   = signal(false);
  archivoSeleccionado = signal<File | null>(null);
  uploadMensaje     = signal('');
  uploadExitoso     = signal(false);

  showModalNotificacion = signal(false);
  enviandoNotificacion  = signal(false);

  notificacion = signal<NotificacionBRMDto>({
    correoCliente: '',
    correoBRM: '',
    asunto: '',
    sharepointLink: '',
    mensaje: '',
  });

  proyectosFiltrados = computed(() => {
    const proy = this.proyectos();
    const filtroCliente = this.filtroCliente().toLowerCase().trim();
    const filtroProyecto = this.filtroProyecto().toLowerCase().trim();
    return proy.filter(p =>
      (!filtroCliente || p.cliente.toLowerCase().includes(filtroCliente)) &&
      (!filtroProyecto || p.nombre.toLowerCase().includes(filtroProyecto))
    );
  });

  ngOnInit() {
    this.cargarDatos();
  }

  private cargarDatos() {
    this.carteraSvc.getSubProyectosResumen().pipe(catchError(() => of(null))).subscribe(r => { if (r) this.resumen.set(r); });
    this.carteraSvc.getSubProyectosLista().pipe(catchError(() => of([]))).subscribe(r => this.proyectos.set(r));
    this.cargarTasa();
  }

  private cargarTasa() {
    const m = this.moneda();
    if (m === 'COP') { this.tasaCambio.set(1); return; }
    this.carteraSvc.getTasaCambio(m).pipe(catchError(() => of({ moneda: m, tasa: 4200 }))).subscribe(t => {
      this.tasaCambio.set(t.tasa);
    });
  }

  onMonedaChange(moneda: string) {
    this.moneda.set(moneda);
    this.cargarTasa();
  }

  seleccionarProyecto(proy: SubProyectoDto) {
    if (this.proyectoSeleccionado()?.id === proy.id) {
      this.proyectoSeleccionado.set(null);
      return;
    }
    this.proyectoSeleccionado.set(proy);
    this.directorio.set([]);
    this.carteraSvc.getDirectorioEmpresa(proy.empresa).subscribe(r => this.directorio.set(r));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const proy = this.proyectoSeleccionado();
    if (!proy) return;

    this.archivoSeleccionado.set(file);
    this.subiendoArchivo.set(true);
    this.uploadMensaje.set('');
    this.uploadExitoso.set(false);

    this.carteraSvc.uploadDirectorio(proy.empresa, file).subscribe({
      next: () => {
        this.subiendoArchivo.set(false);
        this.uploadExitoso.set(true);
        this.uploadMensaje.set('Directorio actualizado correctamente');
        this.carteraSvc.getDirectorioEmpresa(proy.empresa).subscribe(r => this.directorio.set(r));
      },
      error: () => {
        this.subiendoArchivo.set(false);
        this.uploadExitoso.set(false);
        this.uploadMensaje.set('Error al actualizar el directorio');
      },
    });
  }

  private convertirValor(valor: number): number {
    const tasa = this.tasaCambio();
    const m = this.moneda();
    if (m === 'COP' || tasa <= 0) return valor;
    return valor / tasa;
  }

  formatMonto(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: this.moneda(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.convertirValor(valor));
  }

  enviarNotificacion() {
    this.enviandoNotificacion.set(true);
    this.carteraSvc.enviarNotificacionBRM(this.notificacion()).subscribe({
      next: () => {
        this.enviandoNotificacion.set(false);
        this.cerrarModalNotificacion();
        this.notifSvc.success('Recordatorio automático cada 3 días programado');
      },
      error: () => {
        this.enviandoNotificacion.set(false);
        this.notifSvc.error('Error al enviar la notificación');
      },
    });
  }

  cerrarModalNotificacion() {
    this.showModalNotificacion.set(false);
    this.notificacion.set({
      correoCliente: '',
      correoBRM: '',
      asunto: '',
      sharepointLink: '',
      mensaje: '',
    });
  }
}
