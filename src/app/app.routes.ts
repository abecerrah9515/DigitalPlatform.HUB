import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'finanzas/cartera',
        loadComponent: () =>
          import('./features/finanzas/cartera/cartera.component').then(m => m.CarteraComponent)
      },
      {
        path: 'finanzas/facturacion',
        loadComponent: () =>
          import('./features/finanzas/facturacion/facturacion.component').then(m => m.FacturacionComponent)
      },
      {
        path: 'finanzas/clientes',
        loadComponent: () =>
          import('./features/finanzas/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'finanzas/subproyectos',
        loadComponent: () =>
          import('./features/finanzas/subproyectos/subproyectos.component').then(m => m.SubproyectosComponent)
      },
      {
        path: 'finanzas/consolidar',
        loadComponent: () =>
          import('./features/finanzas/consolidar/consolidar-finanzas.component').then(m => m.ConsolidarFinanzasComponent)
      },
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
        redirectTo: 'finanzas/cartera',
        pathMatch: 'full'
      }
    ]
  }
];
