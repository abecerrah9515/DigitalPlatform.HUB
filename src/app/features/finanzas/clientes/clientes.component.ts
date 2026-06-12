import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FilterDropdownComponent } from '../../../shared/components/filter-dropdown.component';
import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClienteDetalleDto } from '../../../core/models/cartera.models';

interface NuevoContactoForm {
  nombre: string;
  cargo: string;
  departamento: string;
  email: string;
  telefono: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FilterDropdownComponent],
  template: `
    <div class="p-6 space-y-6 max-w-screen-2xl mx-auto">

      @if (!clienteSeleccionado()) {
        <!-- Header -->
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Clientes</h1>
          <p class="text-sm text-slate-500 mt-0.5">Directorio y detalle de clientes</p>
        </div>

        <!-- Search & Filter -->
        <div class="flex items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o factura…"
              class="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [value]="busqueda()"
              (input)="filtrarClientes($any($event.target).value)"
            />
          </div>
          <app-filter-dropdown
            label="Grupo"
            [options]="gruposOptions()"
            [selectedValues]="selectedGrupos()"
            (selectionChange)="onGrupoFilterChange($event)"
          />
        </div>

        <!-- Client Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (cliente of clientesFiltrados(); track cliente.id) {
            <div
              (click)="seleccionarCliente(cliente)"
              class="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <h3 class="text-sm font-semibold text-slate-900 mb-2">{{ cliente.nombre }}</h3>
              <div class="space-y-1 text-xs text-slate-500">
                <p><span class="text-slate-400">NIT:</span> {{ cliente.nit }}</p>
                <p><span class="text-slate-400">Grupo:</span> {{ cliente.grupo }}</p>
                <p><span class="text-slate-400">Ciudad:</span> {{ cliente.ciudad }}</p>
              </div>
            </div>
          } @empty {
            <div class="col-span-full py-16 text-center">
              <svg class="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p class="text-sm text-slate-400">No se encontraron clientes</p>
            </div>
          }
        </div>
      }

      <!-- Detail View -->
      @if (clienteSeleccionado(); as c) {
        <!-- Back button -->
        <button
          (click)="volver()"
          class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver a lista de clientes
        </button>

        <!-- Client Info Banner -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ c.nombre }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">NIT</p>
              <p class="text-slate-700 mt-0.5">{{ c.nit }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Grupo</p>
              <p class="text-slate-700 mt-0.5">{{ c.grupo }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Dirección</p>
              <p class="text-slate-700 mt-0.5">{{ c.direccion }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Ciudad</p>
              <p class="text-slate-700 mt-0.5">{{ c.ciudad }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Región</p>
              <p class="text-slate-700 mt-0.5">{{ c.region }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">País</p>
              <p class="text-slate-700 mt-0.5">{{ c.pais }}</p>
            </div>
          </div>
        </div>

        <!-- Contact Info Section -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h3 class="text-sm font-semibold text-slate-900 mb-4">Información de Contacto</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Teléfono</p>
              <p class="text-slate-700 mt-0.5">{{ c.telefono || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Email Contabilidad</p>
              <p class="text-slate-700 mt-0.5">{{ c.emailContabilidad || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Contabilidad</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoContabilidad || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Tesorería</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoTesoreria || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Finanzas</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoFinanzas || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Operación</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoOperacion || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Comercial</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoComercial || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Contacto Compras</p>
              <p class="text-slate-700 mt-0.5">{{ c.contactoCompras || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h3 class="text-sm font-semibold text-slate-900 mb-4">Notas</h3>

          @if (c.notas?.length) {
            <div class="space-y-3 mb-4">
              @for (nota of c.notas; track nota.id) {
                <div class="flex gap-3 p-3 rounded-lg bg-slate-50">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-medium text-blue-700">{{ nota.autor.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-700">{{ nota.autor }}</span>
                      <span class="text-xs text-slate-400">{{ formatDate(nota.fecha) }}</span>
                    </div>
                    <p class="text-sm text-slate-600 mt-0.5">{{ nota.texto }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-slate-400 mb-4">Sin notas registradas</p>
          }

          <!-- Add note form -->
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Agregar una nota…"
              class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [value]="nuevaNota()"
              (input)="nuevaNota.set($any($event.target).value)"
              [disabled]="enviando()"
            />
            <button
              (click)="agregarNota()"
              [disabled]="!nuevaNota().trim() || enviando()"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (enviando()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              }
              Agregar
            </button>
          </div>
        </div>

        <!-- Contacts Directory Section -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-900">Directorio de Contactos</h3>
            <button
              (click)="showAddContact.set(!showAddContact())"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              {{ showAddContact() ? 'Cancelar' : 'Agregar Contacto' }}
            </button>
          </div>

          <!-- Existing contacts table -->
          @if (c.contactos?.length) {
            <div class="overflow-x-auto mb-4">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                    <th class="px-3 py-2.5 text-left">Nombre</th>
                    <th class="px-3 py-2.5 text-left">Cargo</th>
                    <th class="px-3 py-2.5 text-left">Departamento</th>
                    <th class="px-3 py-2.5 text-left">Email</th>
                    <th class="px-3 py-2.5 text-left">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  @for (contacto of c.contactos; track contacto.id) {
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td class="px-3 py-2.5 text-slate-700 font-medium">{{ contacto.nombre }}</td>
                      <td class="px-3 py-2.5 text-slate-600">{{ contacto.cargo }}</td>
                      <td class="px-3 py-2.5 text-slate-600">{{ contacto.departamento }}</td>
                      <td class="px-3 py-2.5 text-blue-600">
                        <a href="mailto:{{ contacto.email }}" class="hover:underline">{{ contacto.email }}</a>
                      </td>
                      <td class="px-3 py-2.5 text-slate-600">{{ contacto.telefono }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="text-sm text-slate-400 mb-4">Sin contactos registrados</p>
          }

          <!-- Add Contact Form -->
          @if (showAddContact()) {
            <div class="border-t border-slate-100 pt-4">
              <h4 class="text-sm font-medium text-slate-700 mb-3">Nuevo Contacto</h4>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    [value]="nuevoContacto().nombre"
                    (input)="nuevoContacto.update(n => ({ ...n, nombre: $any($event.target).value }))"
                    [disabled]="enviando()"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Cargo</label>
                  <input
                    type="text"
                    placeholder="Cargo"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    [value]="nuevoContacto().cargo"
                    (input)="nuevoContacto.update(n => ({ ...n, cargo: $any($event.target).value }))"
                    [disabled]="enviando()"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    placeholder="Departamento"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    [value]="nuevoContacto().departamento"
                    (input)="nuevoContacto.update(n => ({ ...n, departamento: $any($event.target).value }))"
                    [disabled]="enviando()"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    [value]="nuevoContacto().email"
                    (input)="nuevoContacto.update(n => ({ ...n, email: $any($event.target).value }))"
                    [disabled]="enviando()"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Teléfono"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    [value]="nuevoContacto().telefono"
                    (input)="nuevoContacto.update(n => ({ ...n, telefono: $any($event.target).value }))"
                    [disabled]="enviando()"
                  />
                </div>
              </div>
              <button
                (click)="agregarContacto()"
                [disabled]="!nuevoContacto().nombre.trim() || !nuevoContacto().email.trim() || enviando()"
                class="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                @if (enviando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                Guardar Contacto
              </button>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class ClientesComponent implements OnInit {
  private readonly svc    = inject(CarteraService);
  private readonly notify = inject(NotificationService);

  clientes            = signal<ClienteDetalleDto[]>([]);
  clienteSeleccionado = signal<ClienteDetalleDto | null>(null);
  busqueda            = signal('');
  nuevaNota           = signal('');
  showAddContact      = signal(false);
  nuevoContacto       = signal<NuevoContactoForm>({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
  enviando            = signal(false);
  selectedGrupos      = signal<string[]>([]);

  gruposOptions = computed(() => {
    const grupos = new Set(this.clientes().map(c => c.grupo).filter(Boolean));
    return [...grupos].sort();
  });

  clientesFiltrados = computed(() => {
    let result = this.clientes();
    const q = this.busqueda().toLowerCase().trim();
    if (q) {
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
      );
    }
    const grupos = this.selectedGrupos();
    if (grupos.length) {
      result = result.filter(c => grupos.includes(c.grupo));
    }
    return result;
  });

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes(busqueda?: string) {
    this.svc.getClientes(busqueda).pipe(
      catchError(() => {
        this.notify.error('Error al cargar clientes');
        return of([]);
      }),
    ).subscribe(data => this.clientes.set(data));
  }

  filtrarClientes(busqueda: string) {
    this.busqueda.set(busqueda);
    this.cargarClientes(busqueda || undefined);
  }

  onGrupoFilterChange(vals: (string | number)[]) {
    this.selectedGrupos.set(vals as string[]);
  }

  seleccionarCliente(cliente: ClienteDetalleDto) {
    this.clienteSeleccionado.set(cliente);
    this.nuevaNota.set('');
    this.showAddContact.set(false);
    this.nuevoContacto.set({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
  }

  volver() {
    this.clienteSeleccionado.set(null);
  }

  agregarNota() {
    const texto = this.nuevaNota().trim();
    if (!texto || this.enviando()) return;
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    this.enviando.set(true);
    this.svc.agregarNotaCliente(cliente.id, texto).pipe(
      catchError(() => {
        this.notify.error('Error al agregar nota');
        return of(null);
      }),
    ).subscribe(nota => {
      this.enviando.set(false);
      if (nota) {
        this.clienteSeleccionado.update(c =>
          c ? { ...c, notas: [...(c.notas || []), nota] } : c
        );
        this.nuevaNota.set('');
        this.notify.success('Nota agregada correctamente');
      }
    });
  }

  agregarContacto() {
    const form = this.nuevoContacto();
    if (!form.nombre.trim() || !form.email.trim() || this.enviando()) return;
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    this.enviando.set(true);
    this.svc.agregarContacto(cliente.id, form).pipe(
      catchError(() => {
        this.notify.error('Error al agregar contacto');
        return of(null);
      }),
    ).subscribe(contacto => {
      this.enviando.set(false);
      if (contacto) {
        this.clienteSeleccionado.update(c =>
          c ? { ...c, contactos: [...(c.contactos || []), contacto] } : c
        );
        this.nuevoContacto.set({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
        this.showAddContact.set(false);
        this.notify.success('Contacto agregado correctamente');
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
