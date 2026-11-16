import { ESTADO } from '../../../../core/models/documento.model';
import type {
  DocumentsRecordsColumn,
  DocumentsRecordsConfig,
  DocumentsRecordsFilterOption,
  DocumentsRecordsMenuOption,
} from '../../../../shared/types/documents-records.types';
import { buildProcessBreadcrumbs } from '../../../../shared/utils/breadcrumbs.util';
import { NOMBRE_DOCUMENTO } from '../models/catalogo-subtipo-accion.model';
import { CREATE_DOCUMENT_OPTIONS, PROCESS_ID, PROCESS_ROUTE, REQUEST_ROUTE } from './catalogo-subtipo-accion.rutas';

/**
 * Configuración de «Documentos y registros» del proceso «Catálogo de subtipo de acción». La pantalla completa la
 * pinta `siaf-documents-records-page` (Figma node 20016-187919): aquí solo se declara qué columnas, filtros y
 * opciones tiene. Las filas las aporta el componente de página desde el backend simulado.
 */

const documentColumns: DocumentsRecordsColumn[] = [
  { key: 'document', label: 'Documento', visibility: 'visible', group: 'default', widthClass: 'w-[320px]', kind: 'document-link' },
  { key: 'number', label: 'Número', visibility: 'visible', group: 'default', widthClass: 'w-[120px]' },
  { key: 'actionType', label: 'Tipo de acción', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'status', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[150px]', kind: 'flow-status' },
  { key: 'system', label: 'Sistema', visibility: 'visible', group: 'default', widthClass: 'w-[200px]' },
  { key: 'date', label: 'Fecha de recepción', visibility: 'visible', group: 'default', widthClass: 'w-[180px]' },
  { key: 'entity', label: 'Entidad', visibility: 'visible', group: 'default', widthClass: 'w-[360px]' },
  { key: 'creator', label: 'Creador', visibility: 'hidden', group: 'more', widthClass: 'w-[220px]' },
  { key: 'subject', label: 'Asunto/Motivo', visibility: 'hidden', group: 'more', widthClass: 'w-[280px]' },
];

// Columnas del diseño (Figma node 22921-48063): Código / Proceso / Rol / Perfil / Tipo de acción / Subtipo y el
// grupo Vigencia (Estado / Fecha desde / Fecha hasta). El ícono de historial va en la columna fija de la derecha,
// que pinta la propia `siaf-documents-records-table`.
const recordColumns: DocumentsRecordsColumn[] = [
  { key: 'codigo', label: 'Código', visibility: 'visible', group: 'default', widthClass: 'w-[110px]' },
  { key: 'proceso', label: 'Proceso', visibility: 'visible', group: 'default', widthClass: 'min-w-[220px]' },
  { key: 'rol', label: 'Rol', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'perfil', label: 'Perfil', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'tipoAccion', label: 'Tipo de acción', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'subtipoAccion', label: 'Subtipo de acción', visibility: 'visible', group: 'default', widthClass: 'min-w-[220px]' },
  { key: 'estado', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[110px]' },
  { key: 'fechaDesde', label: 'Fecha desde', visibility: 'visible', group: 'default', widthClass: 'w-[140px]' },
  { key: 'fechaHasta', label: 'Fecha hasta', visibility: 'visible', group: 'default', widthClass: 'w-[140px]' },
];

const fieldsMenuOptions: DocumentsRecordsMenuOption[] = [
  { label: 'Documento' },
  { label: 'Tipo de acción' },
  { label: 'Estado' },
  { label: 'Fecha de recepción', hasChildren: true },
  { label: 'Entidad' },
];

const filterCampoOptions: DocumentsRecordsFilterOption[] = [
  { label: 'Documento', value: 'document' },
  { label: 'Número', value: 'number' },
  { label: 'Tipo de acción', value: 'actionType' },
  { label: 'Estado', value: 'status' },
  { label: 'Fecha', value: 'date' },
  { label: 'Entidad', value: 'entity' },
];

const filterValorOptions: DocumentsRecordsFilterOption[] = [
  { label: ESTADO.ELABORADO, value: ESTADO.ELABORADO },
  { label: ESTADO.VERIFICADO, value: ESTADO.VERIFICADO },
  { label: ESTADO.APROBADO, value: ESTADO.APROBADO },
  { label: 'Creación', value: 'Creación' },
  { label: 'Modificación', value: 'Modificación' },
];

export const CATALOGO_SUBTIPO_ACCION_DOCUMENTS_CONFIG: DocumentsRecordsConfig = {
  title: 'Catálogo de subtipo de acción',
  processId: PROCESS_ID,
  defaultRequestRoute: REQUEST_ROUTE,
  createDocumentOptions: CREATE_DOCUMENT_OPTIONS,
  breadcrumbs: buildProcessBreadcrumbs(PROCESS_ID, PROCESS_ROUTE),
  documentRows: [],
  recordRows: [],
  documentColumns,
  recordColumns,
  documentTableMinWidthClass: 'min-w-[1690px]',
  recordTableMinWidthClass: 'min-w-[1430px]',
  recordTrackKey: 'recordId',
  recordHistoryDocumentLabel: NOMBRE_DOCUMENTO,
  recordHistoryKind: 'documento',
  statusFilterOptions: [ESTADO.ELABORADO, ESTADO.VERIFICADO, ESTADO.OBSERVADO, ESTADO.APROBADO, ESTADO.RECHAZADO],
  actionTypeFilterOptions: ['Creación', 'Modificación'],
  filterCampoOptions,
  filterValorOptions,
  fieldsMenuOptions,
  recordFilter1Label: 'Estado del registro',
  recordFilter1Key: 'estado',
  recordFilter1Options: ['Sí', 'No'],
  recordFilterCampoOptions: [
    { label: 'Estado', value: 'estado' },
    { label: 'Tipo de acción', value: 'tipoAccion' },
  ],
  recordFilterValorOptions: [
    { label: 'Sí', value: 'Sí' },
    { label: 'No', value: 'No' },
  ],
};
