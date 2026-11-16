import { Routes } from '@angular/router';

/** Procesos del área de presupuesto: «Catálogo de subtipo de acción». */
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
];
