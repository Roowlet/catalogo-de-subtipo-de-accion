/**
 * Árbol maestro de procesos + utilidad de búsqueda de ruta.
 * Vive en shared/utils/ (no en layout/) porque lo consumen tanto piezas
 * del shell (layout/process-menu-tree, layout/create-document) como
 * utilidades transversales de shared (breadcrumbs.util) — shared no debe
 * depender de layout, así que la fuente de verdad va acá.
 */
export interface ProcessMenuNode {
  id: string;
  label: string;
  selected?: boolean;
  // Solo debe marcarse en nodos raiz: la vista inicial muestra hasta el segundo nivel.
  expanded?: boolean;
  // Ruta de la página principal del módulo (documentos y registros)
  moduleRoute?: string;
  // Si un nodo tiene estas propiedades, Crear documento puede completar documento/tipo y navegar.
  createRoute?: string;
  documentOptions?: string[];
  documentCreateOptions?: Array<{
    label: string;
    route?: string;
    actionTypes?: string[];
  }>;
  actionTypeOptions?: string[];
  /**
   * Marca un nodo como módulo planificado pero aún no implementado.
   * El menú lo renderiza con texto atenuado y badge "Próximamente",
   * y el click no navega (solo expande si tiene hijos).
   */
  comingSoon?: boolean;
  /**
   * Fuerza la flecha de desplegable aunque el nodo todavía no tenga `children`.
   * Sirve para maquetar ramas del diseño cuyo contenido aún no se define: el
   * nodo se ve expandible (como en Figma) pero al no tener hijos no despliega
   * nada. Al agregarle `children`, la flecha ya funcionaría igual.
   */
  expandable?: boolean;
  /**
   * Renderiza el nodo como ENCABEZADO DE SECCIÓN (no como fila clickeable):
   * texto gris en mayúsculas con ícono cuadrado, sin flecha ni navegación.
   * Sus hijos se muestran siempre debajo (no se colapsan). Es el equivalente
   * al subtítulo de sección del diseño de Figma dentro de «Catálogos».
   */
  sectionHeader?: boolean;
  /**
   * Oculta el nodo (y su subárbol) del menú visible, pero lo conserva en el
   * árbol para que `findProcessPathById` siga resolviendo sus IDs (migas de
   * pan). Se usa para procesos implementados que no aparecen en el diseño.
   */
  hiddenInMenu?: boolean;
  children?: ProcessMenuNode[];
}

/**
 * Árbol de procesos del taller. Solo «Registro de cuentas bancarias» está implementado (con datos simulados); el resto
 * son ejemplos de cómo se ve un proceso planificado («Próximamente»). Para sumar un proceso: una hoja con
 * `moduleRoute` (Documentos y registros) y otra para sus consultas, y sus rutas en `app.routes.ts`.
 *
 * IDs consumidos por componentes externos (migas de pan con `findProcessPathById`):
 *   - registro-cuentas-bancarias-documentos
 *   - registro-cuentas-bancarias-consultas
 */
export const DEFAULT_PROCESS_TREE: ProcessMenuNode[] = [
  {
    // Oculto del menú (el diseño de Figma no lo muestra) pero conservado en el
    // árbol: sus IDs los usan las migas de pan de cuentas bancarias (proceso
    // implementado) vía findProcessPathById.
    id: 'gestion-tesoreria',
    label: 'Gestión de tesorería',
    hiddenInMenu: true,
    children: [
      {
        id: 'registro-cuentas-bancarias',
        label: 'Registro de cuentas bancarias',
        children: [
          {
            id: 'registro-cuentas-bancarias-documentos',
            label: 'Documentos y registros de cuentas bancarias',
            moduleRoute: '/procesos/registro-cuentas-bancarias',
            createRoute: '/procesos/registro-cuentas-bancarias/solicitud',
            documentOptions: ['Solicitud de Registro de Cuenta Bancaria'],
            documentCreateOptions: [
              {
                label: 'Solicitud de Registro de Cuenta Bancaria',
                route: '/procesos/registro-cuentas-bancarias/solicitud',
                actionTypes: ['Creación'],
              },
            ],
            actionTypeOptions: ['Creación'],
          },
          {
            id: 'registro-cuentas-bancarias-consultas',
            label: 'Consultas y reportes de cuentas bancarias',
            moduleRoute: '/procesos/registro-cuentas-bancarias/consultas',
          },
        ],
      },
      {
        id: 'programacion-pagos',
        label: 'Programación de pagos',
        comingSoon: true,
        children: [
          { id: 'programacion-pagos-documentos', label: 'Documentos y registros de programación de pagos', comingSoon: true },
          { id: 'programacion-pagos-consultas', label: 'Consultas y reportes de programación de pagos', comingSoon: true },
        ],
      },
    ],
  },
  // «Procesos presupuesto» (rama APM: Programación multianual, Generación de reporte APM, Modificación de la
  // APM, Desagregación) pertenece a otro proyecto y se excluye de este taller.
  {
    id: 'clasificadores-catalogos',
    label: 'Clasificadores y catálogos',
    children: [
      { id: 'clasificadores', label: 'Clasificadores', comingSoon: true, expandable: true },
      {
        id: 'catalogos',
        label: 'Catálogos',
        children: [
          // Catálogos del diseño (Figma nodes 24938-26018 / 26102): lista plana; cada catálogo es un nodo
          // expandible con sus hojas «Documentos y registros» y «Consultas y reportes». Solo «Catálogo de
          // subtipo de acción» está implementado; el resto queda como «Próximamente».
          {
            id: 'catalogo-subtipo-accion',
            label: 'Catálogo de subtipo de acción',
            children: [
              {
                id: 'catalogo-subtipo-accion-documentos',
                label: 'Documentos y registros de subtipo de acción',
                moduleRoute: '/procesos/catalogo-subtipo-accion',
                createRoute: '/procesos/catalogo-subtipo-accion/solicitud',
                documentOptions: ['Solicitud de Subtipo de Acción'],
                documentCreateOptions: [
                  {
                    label: 'Solicitud de Subtipo de Acción',
                    route: '/procesos/catalogo-subtipo-accion/solicitud',
                    actionTypes: ['Creación', 'Modificación'],
                  },
                ],
                actionTypeOptions: ['Creación', 'Modificación'],
              },
              {
                id: 'catalogo-subtipo-accion-consultas',
                label: 'Consultas y reportes de subtipo de acción',
                comingSoon: true,
              },
            ],
          },
          { id: 'catalogo-actividades', label: 'Catálogo de actividades', comingSoon: true, expandable: true },
          { id: 'catalogo-ambito-institucional', label: 'Catálogo de ámbito institucional', comingSoon: true, expandable: true },
        ],
      },
    ],
  },
  {
    id: 'consultas-reportes',
    label: 'Consultas y reportes',
    comingSoon: true,
    expandable: true,
  },
];

export function findProcessPathById(id: string, nodes: readonly ProcessMenuNode[] = DEFAULT_PROCESS_TREE): ProcessMenuNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }

    const childPath = findProcessPathById(id, node.children || []);

    if (childPath.length > 0) {
      return [node, ...childPath];
    }
  }

  return [];
}

/**
 * Árbol del menú "Ajustes" (módulo de administración). Lo pinta el mismo `siaf-process-menu-tree`
 * que el menú de procesos, con otros textos. En el taller no hay módulo de administración: las hojas
 * van como «Próximamente» y no navegan.
 */
export const ADMIN_MENU_TREE: ProcessMenuNode[] = [
  {
    id: 'administracion',
    label: 'Administración',
    expanded: true,
    children: [
      {
        id: 'usuarios-accesos',
        label: 'Usuarios y accesos',
        expanded: true,
        children: [
          { id: 'gestion-usuarios', label: 'Gestión de usuarios', comingSoon: true },
          { id: 'perfiles-funcionales', label: 'Perfiles funcionales', comingSoon: true },
        ],
      },
      {
        id: 'organizacion',
        label: 'Organización',
        children: [
          { id: 'entidades', label: 'Entidades', comingSoon: true },
          { id: 'unidades', label: 'Unidades orgánicas', comingSoon: true },
        ],
      },
    ],
  },
];
