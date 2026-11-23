import type { QueryReportConfig } from '../../../../shared/types/query-report.types';
import { buildProcessBreadcrumbs } from '../../../../shared/utils/breadcrumbs.util';
import { PROCESOS } from '../models/catalogo-subtipo-accion.model';
import { CONSULTAS_PROCESS_ID, CONSULTAS_ROUTE } from './catalogo-subtipo-accion.rutas';

/** Opciones de los selectores de parámetros y de los filtros predeterminados. */
const procesoOptions = PROCESOS.map((p) => ({ label: `${p.codigo} ${p.nombre}`, value: `${p.codigo} ${p.nombre}` }));
const estadoOptions = [
  { label: 'Sí', value: 'Sí' },
  { label: 'No', value: 'No' },
];

/**
 * «Consultas y reportes» del proceso «Catálogo de subtipo de acción» (Figma node 36760-22035 / 22083). La pantalla
 * entera la arma `siaf-query-report-page` desde esta configuración: panel de parámetros, resultado, tabla, filtros,
 * vista de gráficas y Exportar. La página solo responde la consulta sobre los registros del catálogo y genera el
 * archivo al exportar.
 *
 * Columnas del diseño (Figma node 36760-21984, «Columnas visibles»): grupo «Datos generales» (Código, Proceso, Rol,
 * Perfil, Tipo de acción, Subtipo de acción) y grupo «Vigencia» (Estado, Fecha desde, Fecha hasta). «Código» es la
 * llave de la fila y queda siempre visible.
 */
export const CATALOGO_SUBTIPO_ACCION_CONSULTAS_CONFIG: QueryReportConfig = {
  title: 'Catálogo de subtipo de acción',
  breadcrumbs: buildProcessBreadcrumbs(CONSULTAS_PROCESS_ID, CONSULTAS_ROUTE, 'Consulta de subtipo de acción'),
  parameterFields: [
    { key: 'estado', label: 'Estado', type: 'select', icon: 'toggle_on', options: estadoOptions },
    { key: 'desde', label: 'Fecha desde', type: 'date', required: true, icon: 'calendar_today' },
    { key: 'hasta', label: 'Fecha hasta', type: 'date', required: true, icon: 'event' },
  ],
  columns: [
    { key: 'codigo', label: 'Código', group: 'Datos generales', width: 110 },
    { key: 'proceso', label: 'Proceso', group: 'Datos generales', width: 260 },
    { key: 'rol', label: 'Rol', group: 'Datos generales', width: 160 },
    { key: 'perfil', label: 'Perfil', group: 'Datos generales', width: 180 },
    { key: 'tipoAccion', label: 'Tipo de acción', group: 'Datos generales', width: 160 },
    { key: 'subtipo', label: 'Subtipo de acción', group: 'Datos generales', width: 200 },
    { key: 'estado', label: 'Estado', group: 'Vigencia', width: 110 },
    { key: 'fechaDesde', label: 'Fecha desde', group: 'Vigencia', width: 140 },
    { key: 'fechaHasta', label: 'Fecha hasta', group: 'Vigencia', width: 140 },
  ],
  rowKey: 'codigo',
  resultTitle: 'Resultado de reporte',
  tableLabel: 'Subtipos de acción consultados',
  presetFilters: [
    { key: 'proceso', label: 'Proceso', options: procesoOptions },
    { key: 'estado', label: 'Estado', options: estadoOptions },
  ],
  charts: {
    kpis: [
      { title: 'Subtipos de acción', icon: 'fact_check', tone: 'informative', aggregate: 'count' },
      { title: 'Vigentes', icon: 'check_circle', tone: 'success', aggregate: 'count', where: { column: 'estado', value: 'Sí' } },
      { title: 'No vigentes', icon: 'cancel', tone: 'warning', aggregate: 'count', where: { column: 'estado', value: 'No' } },
    ],
    charts: [
      { title: 'Subtipos por proceso', description: 'Cantidad de subtipos de acción en cada proceso.', type: 'bar', groupBy: 'proceso', aggregate: 'count', seriesName: 'Subtipos', categoryLabel: 'Proceso', width: 'wide' },
      { title: 'Por tipo de acción', type: 'donut', groupBy: 'tipoAccion', aggregate: 'count', seriesName: 'Subtipos' },
      { title: 'Por rol', description: 'Subtipos de acción asociados a cada rol.', type: 'bar', groupBy: 'rol', aggregate: 'count', seriesName: 'Subtipos', categoryLabel: 'Rol', width: 'wide' },
    ],
  },
  emptyTitle: 'Aún no se encontraron resultados',
  emptyDescription: 'Ingrese los parámetros de consulta para visualizar la información disponible.',
};
