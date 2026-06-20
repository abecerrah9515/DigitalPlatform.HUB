import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClienteDetalleDto, FacturaDto, DocumentoClienteDto, ClienteUpdateDto, ContactoClienteDto, DepartamentoFinanzasDto } from '../../../core/models/cartera.models';

interface NuevoContactoForm {
  nombre: string;
  cargo: string;
  departamento: string;
  email: string;
  telefono: string;
}

interface ClientInvoiceSummary {
  total: number;
  count: number;
  pendienteCount: number;
  estados: { estado: string; count: number }[];
}

interface ClienteCardData {
  cliente: ClienteDetalleDto;
  resumen: ClientInvoiceSummary;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
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

        </div>

        <!-- Client Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (item of clientesCardData(); track item.cliente.id) {
            <div
              (click)="seleccionarCliente(item.cliente)"
              class="bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all flex flex-col"
            >
              <div class="p-5 flex-1">
                <h3 class="text-sm font-semibold text-slate-900 mb-3">{{ item.cliente.nombre }}</h3>
                <div class="space-y-1.5 text-xs text-slate-500">
                  <p class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span>{{ item.cliente.contactoContabilidad || item.cliente.contactoFinanzas || '—' }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>{{ item.cliente.emailContabilidad || '—' }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>{{ item.cliente.telefono || '—' }}</span>
                  </p>
                </div>
              </div>

              <div class="border-t border-slate-100 px-5 py-3 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-1.5 text-slate-500">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {{ item.resumen.pendienteCount }} factura(s) pendiente(s)
                  </span>
                  <span class="font-semibold text-slate-900">{{ item.resumen.total | number:'1.2-2' }}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  @for (est of item.resumen.estados; track est.estado) {
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                      [class.bg-red-100]="est.estado === 'Vencida'"
                      [class.text-red-700]="est.estado === 'Vencida'"
                      [class.bg-emerald-100]="est.estado === 'Confirmada'"
                      [class.text-emerald-700]="est.estado === 'Confirmada'"
                      [class.bg-amber-100]="est.estado === 'Pendiente'"
                      [class.text-amber-700]="est.estado === 'Pendiente'"
                      [class.bg-slate-100]="est.estado === 'Cancelada'"
                      [class.text-slate-600]="est.estado === 'Cancelada'"
                    >
                      {{ est.estado }} ({{ est.count }})
                    </span>
                  }
                </div>
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

        <!-- Client Info Card -->
        <div class="bg-white rounded-xl border border-slate-200 max-w-md">
          <div class="p-5 flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-sm font-semibold text-slate-900">{{ c.nombre }}</h3>
                <span class="text-xs text-slate-400">· {{ c.nit }}</span>
              </div>
              <div class="space-y-1.5 text-xs text-slate-500">
                <p class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>{{ c.contactoContabilidad || c.contactoFinanzas || '—' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ c.emailContabilidad || '—' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>{{ c.telefono || '—' }}</span>
                </p>
              </div>
            </div>
            @if (!editando()) {
              <button (click)="iniciarEdicion()"
                class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0" title="Editar">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            }
          </div>
          @if (editando()) {
            @let f = editForm();
            <div class="border-t border-slate-100 px-5 py-4 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">NIT</label>
                  <input type="text" [value]="f.nit" (input)="editForm.update(v => ({ ...v, nit: $any($event.target).value }))"
                    class="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div>
                  <label class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Persona a cargo</label>
                  <input type="text" [value]="f.contactoContabilidad" (input)="editForm.update(v => ({ ...v, contactoContabilidad: $any($event.target).value }))"
                    class="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div>
                  <label class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Correo</label>
                  <input type="text" [value]="f.emailContabilidad" (input)="editForm.update(v => ({ ...v, emailContabilidad: $any($event.target).value }))"
                    class="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div>
                  <label class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Teléfono</label>
                  <input type="text" [value]="f.telefono" (input)="editForm.update(v => ({ ...v, telefono: $any($event.target).value }))"
                    class="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button (click)="cancelarEdicion()"
                  class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button (click)="guardarEdicion()" [disabled]="guardando()"
                  class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (guardando()) {
                    <svg class="w-3.5 h-3.5 animate-spin inline" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  }
                  Guardar cambios
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Directorio de la Empresa -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900">Directorio de la Empresa</h3>
            <div class="flex items-center gap-3">
              <select [value]="departamentoFiltro()" (change)="departamentoFiltro.set($any($event.target).value)"
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <option value="">Todos los departamentos</option>
                @for (dep of departamentosDisponibles(); track dep) {
                  <option [value]="dep">{{ dep }}</option>
                }
              </select>
              <button (click)="showAddContact.set(!showAddContact())"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Agregar Contacto
              </button>
            </div>
          </div>

          <!-- Add Contact Form -->
          @if (showAddContact()) {
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h4 class="text-sm font-medium text-slate-700 mb-3">Nuevo Contacto</h4>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Nombre</label>
                  <input type="text" placeholder="Nombre" [value]="nuevoContacto().nombre"
                    (input)="nuevoContacto.update(n => ({ ...n, nombre: $any($event.target).value }))"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Cargo</label>
                  <input type="text" placeholder="Cargo" [value]="nuevoContacto().cargo"
                    (input)="nuevoContacto.update(n => ({ ...n, cargo: $any($event.target).value }))"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Departamento</label>
                  <select [value]="nuevoContacto().departamento"
                    (change)="nuevoContacto.update(n => ({ ...n, departamento: $any($event.target).value }))"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    <option value="">Seleccionar</option>
                    @for (dep of departamentos(); track dep.id) {
                      <option [value]="dep.nombre">{{ dep.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Email</label>
                  <input type="email" placeholder="Email" [value]="nuevoContacto().email"
                    (input)="nuevoContacto.update(n => ({ ...n, email: $any($event.target).value }))"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Teléfono</label>
                  <input type="text" placeholder="Teléfono" [value]="nuevoContacto().telefono"
                    (input)="nuevoContacto.update(n => ({ ...n, telefono: $any($event.target).value }))"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                </div>
              </div>
              <button (click)="agregarContacto()"
                [disabled]="!nuevoContacto().nombre.trim() || !nuevoContacto().email.trim() || enviando()"
                class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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

          <!-- Contacts grouped by department -->
          <div class="p-6 space-y-6">
            @for (grupo of contactosAgrupados(); track grupo.departamento) {
              <div>
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{{ grupo.departamento }}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (contacto of grupo.contactos; track contacto.id) {
                    @let editando = contactoEditando() === contacto.id;
                    <div class="border border-slate-200 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all relative group">
                      @if (!editando) {
                        <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button (click)="iniciarEdicionContacto(contacto)"
                            class="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button (click)="eliminarContacto(contacto)"
                            class="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                        <p class="text-sm font-medium text-slate-900">{{ contacto.nombre }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">{{ contacto.cargo }}</p>
                        <div class="mt-2 space-y-1 text-xs text-slate-500">
                          <p class="flex items-center gap-1.5">
                            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <a href="mailto:{{ contacto.email }}" class="text-blue-600 hover:underline">{{ contacto.email }}</a>
                          </p>
                          <p class="flex items-center gap-1.5">
                            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            {{ contacto.telefono }}
                          </p>
                        </div>
                      } @else {
                        <div class="space-y-2">
                          <input type="text" placeholder="Nombre" [value]="editContactoForm().nombre"
                            (input)="editContactoForm.update(f => ({ ...f, nombre: $any($event.target).value }))"
                            class="w-full px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                          <input type="text" placeholder="Cargo" [value]="editContactoForm().cargo"
                            (input)="editContactoForm.update(f => ({ ...f, cargo: $any($event.target).value }))"
                            class="w-full px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                          <select [value]="editContactoForm().departamento"
                            (change)="editContactoForm.update(f => ({ ...f, departamento: $any($event.target).value }))"
                            class="w-full px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                            <option value="">Departamento</option>
                            @for (dep of departamentos(); track dep.id) {
                              <option [value]="dep.nombre">{{ dep.nombre }}</option>
                            }
                          </select>
                          <input type="email" placeholder="Email" [value]="editContactoForm().email"
                            (input)="editContactoForm.update(f => ({ ...f, email: $any($event.target).value }))"
                            class="w-full px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                          <input type="text" placeholder="Teléfono" [value]="editContactoForm().telefono"
                            (input)="editContactoForm.update(f => ({ ...f, telefono: $any($event.target).value }))"
                            class="w-full px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                          <div class="flex items-center justify-end gap-2 pt-1">
                            <button (click)="cancelarEdicionContacto()"
                              class="px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                              Cancelar
                            </button>
                            <button (click)="guardarEdicionContacto(contacto.id)" [disabled]="!editContactoForm().nombre.trim() || !editContactoForm().email.trim() || enviando()"
                              class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              @if (enviando()) {
                                <svg class="w-3 h-3 animate-spin inline" fill="none" viewBox="0 0 24 24">
                                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              }
                              Guardar
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <p class="text-sm text-slate-400 text-center py-4">Sin contactos registrados</p>
            }
          </div>
        </div>

        <!-- Bottom row: Documentos + Historial de Notas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Documentos -->
          <div class="bg-white rounded-xl border border-slate-200">
            <div class="px-6 py-4 border-b border-slate-100">
              <h3 class="text-sm font-semibold text-slate-900">Documentos</h3>
            </div>
            <div class="p-6">
              @if (documentos().length) {
                <div class="space-y-2">
                  @for (doc of documentos(); track doc.id) {
                    <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div class="flex items-center gap-3 min-w-0">
                        <svg class="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-slate-700 truncate">{{ doc.nombre }}</p>
                          <p class="text-xs text-slate-400">{{ doc.fechaCarga | date:'shortDate' }}</p>
                        </div>
                      </div>
                      @if (doc.url) {
                        <a [href]="doc.url" target="_blank"
                          class="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Descargar">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                        </a>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-400 text-center py-4">Sin documentos registrados</p>
              }
            </div>
          </div>

          <!-- Historial de Notas -->
          <div class="bg-white rounded-xl border border-slate-200">
            <div class="px-6 py-4 border-b border-slate-100">
              <h3 class="text-sm font-semibold text-slate-900">Historial de Notas</h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- Add note -->
              <div class="flex gap-2">
                <input type="text" placeholder="Agregar una nota…"
                  class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  [value]="nuevaNota()" (input)="nuevaNota.set($any($event.target).value)" [disabled]="enviando()">
                <button (click)="agregarNota()" [disabled]="!nuevaNota().trim() || enviando()"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (enviando()) {
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  }
                  Agregar
                </button>
              </div>

              <!-- Notes list -->
              @if (c.notas?.length) {
                <div class="space-y-3 max-h-80 overflow-y-auto">
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
                <p class="text-sm text-slate-400 text-center py-4">Sin notas registradas</p>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class ClientesComponent implements OnInit {
  private readonly svc    = inject(CarteraService);
  private readonly notify = inject(NotificationService);

  clientes            = signal<ClienteDetalleDto[]>([]);
  facturas            = signal<FacturaDto[]>([]);
  clienteSeleccionado = signal<ClienteDetalleDto | null>(null);
  busqueda            = signal('');
  nuevaNota           = signal('');
  showAddContact      = signal(false);
  nuevoContacto       = signal<NuevoContactoForm>({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
  enviando            = signal(false);
  contactoEditando    = signal<number | null>(null);
  editContactoForm    = signal<NuevoContactoForm>({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
  editando    = signal(false);
  guardando   = signal(false);
  editForm    = signal<ClienteUpdateDto>(this.emptyEditForm());
  documentos  = signal<DocumentoClienteDto[]>([]);
  departamentoFiltro = signal('');
  departamentos = signal<DepartamentoFinanzasDto[]>([]);

  private buildResumen(facturas: FacturaDto[]): ClientInvoiceSummary {
    const total = facturas.reduce((s, f) => s + f.monto, 0);
    const count = facturas.length;
    const pendienteCount = facturas.filter(f => f.estado?.toLowerCase() !== 'anulada').length;
    const estadoMap = new Map<string, number>();
    for (const f of facturas) {
      const key = f.estado || 'Pendiente';
      estadoMap.set(key, (estadoMap.get(key) ?? 0) + 1);
    }
    const estados = [...estadoMap.entries()].map(([estado, cnt]) => ({ estado, count: cnt }));
    return { total, count, pendienteCount, estados };
  }

  facturasPorCliente = computed(() => {
    const map = new Map<string, FacturaDto[]>();
    for (const f of this.facturas()) {
      const key = f.cliente.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return map;
  });

  clientesCardData = computed<ClienteCardData[]>(() => {
    let result = this.clientes();
    const q = this.busqueda().toLowerCase().trim();
    if (q) {
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
      );
    }
    const porCliente = this.facturasPorCliente();
    return result.map(cliente => {
      const facturas = porCliente.get(cliente.nombre.toLowerCase().trim()) ?? [];
      return { cliente, resumen: this.buildResumen(facturas) };
    });
  });

  departamentosDisponibles = computed(() =>
    this.departamentos().map(d => d.nombre)
  );

  contactosAgrupados = computed(() => {
    const c = this.clienteSeleccionado();
    const filtro = this.departamentoFiltro();
    let contactos = c?.contactos ?? [];
    if (filtro) contactos = contactos.filter(ct => ct.departamento === filtro);
    const map = new Map<string, ContactoClienteDto[]>();
    for (const ct of contactos) {
      const dep = ct.departamento || 'Sin departamento';
      if (!map.has(dep)) map.set(dep, []);
      map.get(dep)!.push(ct);
    }
    return [...map.entries()].map(([departamento, ctos]) => ({ departamento, contactos: ctos }));
  });

  private emptyEditForm(): ClienteUpdateDto {
    return {
      nombre: '', nit: '', grupo: '', direccion: '', ciudad: '', region: '', pais: '',
      telefono: '', emailContabilidad: '', contactoContabilidad: '', contactoTesoreria: '',
      contactoFinanzas: '', contactoOperacion: '', contactoComercial: '', contactoCompras: '',
    };
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    forkJoin([
      this.svc.getClientes().pipe(catchError(() => of([]))),
      this.svc.getFacturas().pipe(catchError(() => of([]))),
      this.svc.getDepartamentos().pipe(catchError(() => of([]))),
    ]).subscribe(([clientes, facturas, deps]) => {
      this.clientes.set(clientes);
      this.facturas.set(facturas);
      this.departamentos.set(deps);
    });
  }

  filtrarClientes(busqueda: string) {
    this.busqueda.set(busqueda);
  }

  seleccionarCliente(cliente: ClienteDetalleDto) {
    this.nuevaNota.set('');
    this.showAddContact.set(false);
    this.nuevoContacto.set({ nombre: '', cargo: '', departamento: '', email: '', telefono: '' });
    this.editando.set(false);
    this.departamentoFiltro.set('');
    this.svc.getClienteById(cliente.id).pipe(
      catchError(() => of(null)),
    ).subscribe(fresh => {
      this.clienteSeleccionado.set(fresh ?? cliente);
    });
    this.svc.getDocumentos(cliente.id).pipe(catchError(() => of([]))).subscribe(d => this.documentos.set(d));
  }

  volver() {
    this.clienteSeleccionado.set(null);
  }

  iniciarEdicion() {
    const c = this.clienteSeleccionado();
    if (!c) return;
    this.editForm.set({
      nombre: c.nombre, nit: c.nit, grupo: c.grupo, direccion: c.direccion,
      ciudad: c.ciudad, region: c.region, pais: c.pais, telefono: c.telefono || '',
      emailContabilidad: c.emailContabilidad || '', contactoContabilidad: c.contactoContabilidad || '',
      contactoTesoreria: c.contactoTesoreria || '', contactoFinanzas: c.contactoFinanzas || '',
      contactoOperacion: c.contactoOperacion || '', contactoComercial: c.contactoComercial || '',
      contactoCompras: c.contactoCompras || '',
    });
    this.editando.set(true);
  }

  cancelarEdicion() {
    this.editando.set(false);
  }

  guardarEdicion() {
    const c = this.clienteSeleccionado();
    if (!c) return;
    this.guardando.set(true);
    this.svc.actualizarCliente(c.id, this.editForm()).pipe(
      catchError(() => {
        this.notify.error('Error al guardar los cambios');
        return of(null);
      }),
    ).subscribe(actualizado => {
      this.guardando.set(false);
      if (actualizado) {
        this.clienteSeleccionado.set(actualizado);
        this.clientes.update(list => list.map(cl => cl.id === actualizado.id ? actualizado : cl));
        this.editando.set(false);
        this.notify.success('Cliente actualizado correctamente');
      }
    });
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

  iniciarEdicionContacto(contacto: ContactoClienteDto) {
    this.editContactoForm.set({
      nombre: contacto.nombre,
      cargo: contacto.cargo,
      departamento: contacto.departamento,
      email: contacto.email,
      telefono: contacto.telefono,
    });
    this.contactoEditando.set(contacto.id);
  }

  cancelarEdicionContacto() {
    this.contactoEditando.set(null);
  }

  guardarEdicionContacto(contactoId: number) {
    const form = this.editContactoForm();
    if (!form.nombre.trim() || !form.email.trim() || this.enviando()) return;
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    this.enviando.set(true);
    this.svc.actualizarContacto(cliente.id, contactoId, form).pipe(
      catchError(() => {
        this.notify.error('Error al actualizar contacto');
        return of(null);
      }),
    ).subscribe(actualizado => {
      this.enviando.set(false);
      if (actualizado) {
        this.clienteSeleccionado.update(c =>
          c ? { ...c, contactos: (c.contactos || []).map(ct => ct.id === contactoId ? actualizado : ct) } : c
        );
        this.contactoEditando.set(null);
        this.notify.success('Contacto actualizado correctamente');
      }
    });
  }

  eliminarContacto(contacto: ContactoClienteDto) {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;
    if (!confirm(`¿Eliminar contacto "${contacto.nombre}"?`)) return;

    this.enviando.set(true);
    this.svc.eliminarContacto(cliente.id, contacto.id).pipe(
      catchError(() => {
        this.notify.error('Error al eliminar contacto');
        return of(void 0);
      }),
    ).subscribe(() => {
      this.enviando.set(false);
      this.clienteSeleccionado.update(c =>
        c ? { ...c, contactos: (c.contactos || []).filter(ct => ct.id !== contacto.id) } : c
      );
      this.contactoEditando.set(null);
      this.notify.success('Contacto eliminado correctamente');
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
