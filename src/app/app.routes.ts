import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'proyectos/consolidar',
        loadComponent: () =>
          import('./features/proyectos/consolidar/consolidar.component').then(m => m.ConsolidarComponent)
      },
      {
        path: 'proyectos/consolidado',
        loadComponent: () =>
          import('./features/proyectos/consolidado/consolidado.component').then(m => m.ConsolidadoComponent)
      },
      {
        path: '',
        redirectTo: 'proyectos/consolidar',
        pathMatch: 'full'
      }
    ]
  }
];
