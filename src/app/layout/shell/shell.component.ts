import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar />
      <main class="ml-[210px] flex-1 min-h-screen overflow-auto bg-slate-50">
        <router-outlet />
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-fade-in"
          [class.bg-red-50]="toast.type === 'error'"
          [class.border-red-200]="toast.type === 'error'"
          [class.text-red-800]="toast.type === 'error'"
          [class.bg-yellow-50]="toast.type === 'warning'"
          [class.border-yellow-200]="toast.type === 'warning'"
          [class.text-yellow-800]="toast.type === 'warning'"
          [class.bg-green-50]="toast.type === 'success'"
          [class.border-green-200]="toast.type === 'success'"
          [class.text-green-800]="toast.type === 'success'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.text-blue-800]="toast.type === 'info'"
        >
          <!-- Icono -->
          @if (toast.type === 'error') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          } @else if (toast.type === 'warning') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          } @else if (toast.type === 'success') {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          } @else {
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"/>
            </svg>
          }
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <button (click)="notify.dismiss(toast.id)"
            class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ShellComponent {
  protected readonly notify = inject(NotificationService);
}
