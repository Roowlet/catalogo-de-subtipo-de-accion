import { Routes } from '@angular/router';

/** Procesos del área de presupuesto: «Generación de reporte APM» y «Modificación de la APM». */
export const PRESUPUESTO_ROUTES: Routes = [
  {
    // Proceso «Generación de reporte APM»: Catálogo de Versiones (importación de estructura).
    path: 'procesos/generacion-reporte-apm',
    loadComponent: () =>
      import('./generacion-reporte-apm/pages/catalogo-versiones/generacion-reporte-apm.component').then(
        (m) => m.GeneracionReporteApmComponent,
      ),
  },
  {
    // La ruta base del proceso redirige a la solicitud (no hay página de Documentos y registros).
    path: 'procesos/modificacion-apm',
    pathMatch: 'full',
    redirectTo: 'procesos/modificacion-apm/solicitud',
  },
  {
    path: 'procesos/modificacion-apm/solicitud',
    loadComponent: () =>
      import('./modificacion-apm/pages/solicitud/modificacion-apm-request.component').then(
        (m) => m.ModificacionApmRequestComponent,
      ),
  },
  {
    path: 'procesos/modificacion-apm/solicitud/:id',
    loadComponent: () =>
      import('./modificacion-apm/pages/solicitud/modificacion-apm-request.component').then(
        (m) => m.ModificacionApmRequestComponent,
      ),
  },
];
