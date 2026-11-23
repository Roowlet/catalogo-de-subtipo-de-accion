import type { CreateDocumentProcessOption } from '../../../../shared/components/create-document/create-document.component';
import { NOMBRE_DOCUMENTO } from '../models/catalogo-subtipo-accion.model';

/** Rutas e ids del proceso «Catálogo de subtipo de acción». Los ids existen en `DEFAULT_PROCESS_TREE`. */
export const PROCESS_ROUTE = '/procesos/catalogo-subtipo-accion';
export const REQUEST_SEGMENT = 'solicitud';
export const REQUEST_ROUTE = `${PROCESS_ROUTE}/${REQUEST_SEGMENT}`;
export const CONSULTAS_ROUTE = `${PROCESS_ROUTE}/consultas`;

/** Hoja «Documentos y registros»: arma las migas de pan de la página de documentos. */
export const PROCESS_ID = 'catalogo-subtipo-accion-documentos';
/** Hoja «Consultas y reportes»: arma las migas de pan de la página de reportes. */
export const CONSULTAS_PROCESS_ID = 'catalogo-subtipo-accion-consultas';
/** Nodo padre «Catálogo de subtipo de acción»: migas de pan del formulario de solicitud. */
export const CATALOGO_PROCESS_ID = 'catalogo-subtipo-accion';

export const PROCESO_CODIGO = 'catalogo-subtipo-accion';
export const PROCESO_NOMBRE = 'Catálogo de subtipo de acción';

/** Opción del panel «Crear documento» (shell y pestaña Documentos). */
export const CREATE_DOCUMENT_OPTIONS: CreateDocumentProcessOption[] = [
  {
    id: PROCESO_CODIGO,
    label: PROCESO_NOMBRE,
    route: REQUEST_ROUTE,
    documents: [NOMBRE_DOCUMENTO],
    documentOptions: [{ label: NOMBRE_DOCUMENTO, route: REQUEST_ROUTE, actionTypes: ['Creación', 'Modificación'] }],
    actionTypes: ['Creación', 'Modificación'],
  },
];
