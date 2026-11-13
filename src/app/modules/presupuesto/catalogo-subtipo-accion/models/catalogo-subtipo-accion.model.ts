/**
 * Proceso «Catálogo de subtipo de acción».
 *
 * La solicitud (documento SSTA) registra un subtipo de acción del catálogo: un código, el proceso/rol/perfil/tipo de
 * acción al que aplica, su nombre y su vigencia. En el taller es una maqueta con datos simulados: el flujo llega hasta
 * mostrar el formulario de «Añadir» (sin persistencia en el backend simulado todavía).
 */

/** Código del documento en el catálogo de tipos de documento. */
export const CODIGO_DOCUMENTO = 'SSTA';
/** Nombre del tipo de documento (columna «Documento» de la grilla y opción de «Crear documento»). */
export const NOMBRE_DOCUMENTO = 'Solicitud de catálogo de subtipo de acción';
/** Título de la pantalla de solicitud (Figma node 20021-198029). */
export const NOMBRE_SOLICITUD = 'Solicitud de Subtipo de Acción';

/** Un registro del catálogo (formulario «Detalles del catálogo»). */
export interface RegistroCatalogo {
  codigo: string;
  proceso: string;
  rol: string;
  perfil: string;
  tipoAccion: string;
  subtipoAccion: string;
  /** Estado de la vigencia: activo ('si') o inactivo ('no'). */
  estado: 'si' | 'no';
  fechaDesde: string;
  fechaHasta: string;
}

/** Una opción de los catálogos de selección (Proceso, Rol, Perfil, Tipo de acción). */
export interface OpcionCatalogo {
  id: string;
  codigo: string;
  nombre: string;
}

/** Procesos seleccionables (Figma node 20209-84921). */
export const PROCESOS: OpcionCatalogo[] = [
  { id: 'proc-12', codigo: '12', nombre: 'Clasificador Institucional' },
  { id: 'proc-13', codigo: '13', nombre: 'Clasificador de Ingresos' },
  { id: 'proc-14', codigo: '14', nombre: 'Clasificador de Objeto de Gasto' },
  { id: 'proc-15', codigo: '15', nombre: 'Clasificador de Mancomunidades' },
  { id: 'proc-16', codigo: '16', nombre: 'Clasificador Fuentes de Financiamiento' },
  { id: 'proc-17', codigo: '17', nombre: 'Clasificador Funcional' },
];

/** Roles seleccionables (Figma node 22849-69778). */
export const ROLES: OpcionCatalogo[] = [
  { id: 'rol-1', codigo: '1', nombre: 'Creador' },
  { id: 'rol-2', codigo: '2', nombre: 'Aprobador' },
  { id: 'rol-3', codigo: '3', nombre: 'Evaluador' },
  { id: 'rol-4', codigo: '4', nombre: 'Visualizador de Consultas' },
  { id: 'rol-5', codigo: '5', nombre: 'Asignador' },
  { id: 'rol-6', codigo: '6', nombre: 'Reasignador' },
];

/** Perfiles seleccionables (Figma node 22849-73630). */
export const PERFILES: OpcionCatalogo[] = [
  { id: 'perf-1', codigo: '1', nombre: 'Entidad' },
  { id: 'perf-2', codigo: '2', nombre: 'Dirección General de Presupuesto Público' },
  { id: 'perf-3', codigo: '3', nombre: 'Dirección General del Tesoro Público' },
  { id: 'perf-4', codigo: '4', nombre: 'Dirección General del Gasto Público de la Dirección General de Presupuesto Público' },
];

/** Tipos de acción seleccionables (datos simulados del taller). */
export const TIPOS_ACCION: OpcionCatalogo[] = [
  { id: 'tacc-1', codigo: '1', nombre: 'Creación' },
  { id: 'tacc-2', codigo: '2', nombre: 'Modificación' },
];

/** Registro vacío de partida para el formulario «Añadir». */
export function registroVacio(): RegistroCatalogo {
  return {
    codigo: '',
    proceso: '',
    rol: '',
    perfil: '',
    tipoAccion: '',
    subtipoAccion: '',
    estado: 'si',
    fechaDesde: '',
    fechaHasta: '',
  };
}
