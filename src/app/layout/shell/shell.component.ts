import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

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
  `
})
export class ShellComponent {}
