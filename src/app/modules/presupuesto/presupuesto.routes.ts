import { Routes } from '@angular/router';

/** Procesos del área de presupuesto: «Generación de reporte APM», «Modificación de la APM» y «Catálogo de subtipo de acción». */
export const PRESUPUESTO_ROUTES: Routes = [
  {
    // Proceso «Catálogo de subtipo de acción»: Documentos y registros (pantalla principal).
    path: 'procesos/catalogo-subtipo-accion',
    loadComponent: () =>
      import('./catalogo-subtipo-accion/pages/documents/catalogo-subtipo-accion-documents.component').then(
        (m) => m.CatalogoSubtipoAccionDocumentsComponent,
      ),
  },
  {
    // Solicitud (formulario «Registro del catálogo»), que abre «Crear documento».
    path: 'procesos/catalogo-subtipo-accion/solicitud',
    loadComponent: () =>
      import('./catalogo-subtipo-accion/pages/solicitud/catalogo-subtipo-accion-request.component').then(
        (m) => m.CatalogoSubtipoAccionRequestComponent,
      ),
  },
  {
    path: 'procesos/catalogo-subtipo-accion/solicitud/:id',
    loadComponent: () =>
      import('./catalogo-subtipo-accion/pages/solicitud/catalogo-subtipo-accion-request.component').then(
        (m) => m.CatalogoSubtipoAccionRequestComponent,
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
