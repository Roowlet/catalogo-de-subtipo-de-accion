import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CurrentUserService } from '../../../../../core/auth/current-user.service';
import { ActionTrackerComponent, ActionTrackerSummary } from '../../../../../shared/ui/action-tracker/action-tracker.component';

import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RequestApprovalModalsComponent } from '../../../../../shared/components/request-approval-modals/request-approval-modals.component';
import { DocumentSummaryCardComponent } from '../../../../../shared/ui/document-summary-card/document-summary-card.component';
import { ESTADO } from '../../../../../core/models/documento.model';
import { FlowStatus } from '../../../../../shared/ui/flow-status-tag/flow-status-tag.component';
import { SnackbarVariant } from '../../../../../shared/ui/snackbar/snackbar.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { TableControlsComponent } from '../../../../../shared/components/table-controls/table-controls.component';
import { SelectionColumn, SelectionSideNavComponent } from '../../../../../shared/components/selection-side-nav/selection-side-nav.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CheckboxComponent } from '../../../../../shared/ui/checkbox/checkbox.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ReadonlyFieldComponent } from '../../../../../shared/ui/readonly-field/readonly-field.component';
import { SummaryCardComponent } from '../../../../../shared/ui/summary-card/summary-card.component';
import { SnackbarComponent } from '../../../../../shared/ui/snackbar/snackbar.component';
import { DateTimePickerComponent } from '../../../../../shared/ui/date-time-picker/date-time-picker.component';
import { RadioComponent, RadioOption } from '../../../../../shared/ui/radio/radio.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import {
  NOMBRE_SOLICITUD,
  OpcionCatalogo,
  PERFILES,
  PROCESOS,
  ROLES,
  RegistroCatalogo,
  RegistroGuardado,
  TIPOS_ACCION,
  registroVacio,
} from '../../models/catalogo-subtipo-accion.model';
import { RegistrosCatalogoStore } from '../../models/registros-catalogo.store';
import { CATALOGO_PROCESS_ID, PROCESS_ROUTE } from '../../config/catalogo-subtipo-accion.rutas';

/** Una fila del overlay «Seleccionar registro» de la solicitud de Modificación. */
interface FilaRegistro {
  id: string;
  codigo: string;
  proceso: string;
  rol: string;
  perfil: string;
  tipoAccion: string;
  subtipo: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
}

/**
 * Solicitud de Subtipo de Acción (SSTA): pantalla del proceso «Catálogo de subtipo de acción».
 *
 * La sección «Registro del catálogo» parte con un botón (+) «Añadir»; al pulsarlo muestra el formulario «Detalles del
 * catálogo». Código y la sección Vigencia van deshabilitados (se asignan al aceptar la solicitud). Proceso, Rol, Perfil
 * y Tipo de acción se eligen con un overlay de selección (`siaf-selection-side-nav`) y se habilitan en cadena: hasta no
 * elegir Proceso no se habilita Rol, luego Perfil, luego Tipo de acción; recién con los cuatro y el Subtipo escrito a
 * mano se habilita «Aceptar».
 */
@Component({
  selector: 'siaf-catalogo-subtipo-accion-request',
  standalone: true,
  imports: [
    NgClass,
    SolicitudePageLayoutComponent,
    SolicitudeInfoCardComponent,
    SolicitudeFormCardComponent,
    SelectionSideNavComponent,
    TableControlsComponent,
    PaginationComponent,
    RequestApprovalModalsComponent,
    DocumentSummaryCardComponent,
    ActionTrackerComponent,
    ButtonComponent,
    CheckboxComponent,
    IconComponent,
    ReadonlyFieldComponent,
    SummaryCardComponent,
    SnackbarComponent,
    TextFieldComponent,
    RadioComponent,
    DateTimePickerComponent,
  ],
  templateUrl: './catalogo-subtipo-accion-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoSubtipoAccionRequestComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly currentUser = inject(CurrentUserService);
  private readonly registrosStore = inject(RegistrosCatalogoStore);

  readonly heading = NOMBRE_SOLICITUD;
  readonly breadcrumbs: BreadcrumbItem[] = buildProcessBreadcrumbs(CATALOGO_PROCESS_ID, PROCESS_ROUTE, 'Registro');

  /** Tipo de acción de la solicitud (del «Crear documento»): creación por defecto, o modificación. */
  readonly esModificacion = signal(this.route.snapshot.queryParamMap.get('actionType') === 'modificacion');
  /** Subtítulo de la cabecera (Creación / Modificación). */
  readonly subtitulo = computed(() => (this.esModificacion() ? 'Modificación' : 'Creación'));

  // ── Solicitud de Modificación: registro elegido con el overlay «Seleccionar registro» ──
  readonly registroModif = signal<RegistroGuardado | null>(null);
  readonly buscarRegistroAbierto = signal(false);
  readonly busquedaRegistro = signal('');
  readonly idsRegistro = signal<string[]>([]);
  readonly columnasRegistro: SelectionColumn<FilaRegistro>[] = [
    { key: 'codigo', label: 'Código', widthClass: 'w-[90px]' },
    { key: 'proceso', label: 'Proceso', widthClass: 'min-w-[220px]' },
    { key: 'rol', label: 'Rol', widthClass: 'w-[140px]' },
    { key: 'perfil', label: 'Perfil', widthClass: 'w-[140px]' },
    { key: 'tipoAccion', label: 'Tipo de acción', widthClass: 'w-[150px]' },
    { key: 'subtipo', label: 'Subtipo de acción', widthClass: 'min-w-[160px]' },
    { key: 'estado', label: 'Estado', widthClass: 'w-[90px]' },
    { key: 'fechaDesde', label: 'Fecha desde', widthClass: 'w-[130px]' },
    { key: 'fechaHasta', label: 'Fecha hasta', widthClass: 'w-[130px]' },
  ];
  /** Filas del overlay: todos los registros del store (data de prueba + creados). */
  readonly filasRegistro = computed<FilaRegistro[]>(() =>
    this.filtrarRegistros(this.registrosStore.registros(), this.busquedaRegistro()),
  );

  // ── Solicitud de Modificación: grilla y edición del registro elegido ──
  /** Fila de la grilla de modificación marcada con el checkbox (habilita Editar / Eliminar). */
  readonly filaModifSel = signal(false);
  /** En edición: el formulario «Detalles del catálogo» con solo Subtipo y Estado habilitados. */
  readonly editando = signal(false);
  /** El registro ya fue editado y aceptado (marca la fila con el ícono «modificado»). */
  readonly registroModificado = signal(false);
  /** Valores editables en modo edición (los únicos que se pueden cambiar). */
  readonly editSubtipo = signal('');
  readonly editEstado = signal<'si' | 'no'>('si');
  /** «Aceptar» de la edición: el Subtipo no puede quedar vacío. */
  readonly edicionValida = computed(() => !!this.editSubtipo().trim());

  /** Opciones del estado de vigencia (Sí / No). */
  readonly opcionesEstado: RadioOption[] = [
    { label: 'Si', value: 'si' },
    { label: 'No', value: 'no' },
  ];

  // ── Cabecera de la solicitud ──
  readonly camposEntidad = computed<SolicitudeInfoField[]>(() => [
    { label: 'Fecha', value: '' },
    { label: 'Ente rector', value: 'DIRECCIÓN GENERAL DE PRESUPUESTO PÚBLICO' },
  ]);

  // ── Formulario «Detalles del catálogo» ──
  /** Si es true, la sección muestra el formulario; si no, la tabla de registros o el placeholder. */
  readonly mostrandoFormulario = signal(false);
  /** Campos simples (Código y Vigencia van deshabilitados; Subtipo se escribe a mano). */
  readonly registro = signal<RegistroCatalogo>(registroVacio());

  /** Registros ya aceptados que se listan en la tabla de «Registro del catálogo». */
  readonly registros = signal<RegistroGuardado[]>([]);

  /** Registro en modo detalle (solo lectura); si no es null, la pantalla muestra el detalle en vez de la grilla. */
  readonly detalle = signal<RegistroGuardado | null>(null);

  // ── Ciclo del documento ──
  /** La solicitud ya fue grabada (ELABORADO): se asigna N° de documento y cambian la cabecera y la botonera. */
  readonly elaborada = signal(false);
  /** La solicitud fue verificada y aceptada automáticamente (estado final). */
  readonly aceptada = signal(false);
  readonly numeroDocumento = signal('');
  /** Fecha/hora en que se grabó el documento (para la trazabilidad). */
  readonly fechaDocumento = signal('');
  readonly estadoDocumento = computed<FlowStatus>(() => (this.aceptada() ? 'Aceptado' : ESTADO.ELABORADO));

  /** En Elaborado o Aceptado la grilla de registros es de solo lectura (sin selección múltiple ni checkbox). */
  readonly soloLectura = computed(() => this.elaborada() || this.aceptada());

  /** Trazabilidad (Elaborado / Verificado / Aceptado por). */
  readonly trazabilidad = computed<ActionTrackerSummary[]>(() => {
    const usuario = this.currentUser.user().name.toUpperCase();
    const fecha = this.fechaDocumento();
    return [
      { label: 'Elaborado por', actionBy: usuario, date: fecha },
      { label: 'Verificado por', actionBy: this.aceptada() ? usuario : '', date: this.aceptada() ? fecha : '' },
      { label: 'Aceptado por', actionBy: this.aceptada() ? 'SISTEMA SIAF-RP' : '', date: this.aceptada() ? fecha : '' },
    ];
  });

  // ── Modales de confirmación y aviso ──
  readonly modalGrabar = signal(false);
  readonly modalVerificar = signal(false);
  readonly modalEliminar = signal(false);
  readonly avisoAbierto = signal(false);
  readonly aviso = signal<SnackbarVariant>('creation-elaborated');
  readonly avisoMensaje = signal('');

  /** Snackbar «El registro se ha realizado con éxito». */
  readonly snackbarAbierto = signal(false);
  private snackbarTimer?: ReturnType<typeof setTimeout>;

  // ── Selecciones con overlay (Proceso → Rol → Perfil → Tipo de acción) ──
  readonly procesoSel = signal<OpcionCatalogo | null>(null);
  readonly rolSel = signal<OpcionCatalogo | null>(null);
  readonly perfilSel = signal<OpcionCatalogo | null>(null);
  readonly tipoSel = signal<OpcionCatalogo | null>(null);

  /** Habilitado en cadena de cada campo. */
  readonly rolHabilitado = computed(() => !!this.procesoSel());
  readonly perfilHabilitado = computed(() => !!this.rolSel());
  readonly tipoHabilitado = computed(() => !!this.perfilSel());
  readonly subtipoHabilitado = computed(() => !!this.tipoSel());

  /** Columnas de cada overlay (Código / Nombre). */
  readonly columnasProceso: SelectionColumn<OpcionCatalogo>[] = [
    { key: 'codigo', label: 'Código proceso', widthClass: 'w-[220px]' },
    { key: 'nombre', label: 'Nombre proceso' },
  ];
  readonly columnasRol: SelectionColumn<OpcionCatalogo>[] = [
    { key: 'codigo', label: 'Código rol', widthClass: 'w-[220px]' },
    { key: 'nombre', label: 'Nombre rol' },
  ];
  readonly columnasPerfil: SelectionColumn<OpcionCatalogo>[] = [
    { key: 'codigo', label: 'Código perfil', widthClass: 'w-[220px]' },
    { key: 'nombre', label: 'Nombre perfil' },
  ];
  readonly columnasTipo: SelectionColumn<OpcionCatalogo>[] = [
    { key: 'codigo', label: 'Código tipo de acción', widthClass: 'w-[220px]' },
    { key: 'nombre', label: 'Nombre tipo de acción' },
  ];

  // ── Estado de cada overlay (abierto, búsqueda, selección temporal) ──
  readonly procesoAbierto = signal(false);
  readonly rolAbierto = signal(false);
  readonly perfilAbierto = signal(false);
  readonly tipoAbierto = signal(false);

  readonly busquedaProceso = signal('');
  readonly busquedaRol = signal('');
  readonly busquedaPerfil = signal('');
  readonly busquedaTipo = signal('');

  readonly idsProceso = signal<string[]>([]);
  readonly idsRol = signal<string[]>([]);
  readonly idsPerfil = signal<string[]>([]);
  readonly idsTipo = signal<string[]>([]);

  readonly filasProceso = computed(() => this.filtrar(PROCESOS, this.busquedaProceso()));
  readonly filasRol = computed(() => this.filtrar(ROLES, this.busquedaRol()));
  readonly filasPerfil = computed(() => this.filtrar(PERFILES, this.busquedaPerfil()));
  readonly filasTipo = computed(() => this.filtrar(TIPOS_ACCION, this.busquedaTipo()));

  private filtrar(opciones: OpcionCatalogo[], termino: string): OpcionCatalogo[] {
    const q = termino.trim().toLowerCase();
    return q ? opciones.filter((o) => `${o.codigo} ${o.nombre}`.toLowerCase().includes(q)) : opciones;
  }

  /** Mapea los registros del store a filas del overlay y los filtra por el buscador. */
  private filtrarRegistros(registros: readonly RegistroGuardado[], termino: string): FilaRegistro[] {
    const filas = registros.map((r) => ({
      id: r.codigo,
      codigo: r.codigo,
      proceso: `${r.proceso.codigo} ${r.proceso.nombre}`,
      rol: `${r.rol.codigo} ${r.rol.nombre}`,
      perfil: `${r.perfil.codigo} ${r.perfil.nombre}`,
      tipoAccion: `${r.tipoAccion.codigo} ${r.tipoAccion.nombre}`,
      subtipo: r.subtipo,
      estado: r.estado === 'si' ? 'Sí' : 'No',
      fechaDesde: r.fechaDesde || '--/--/----',
      fechaHasta: r.fechaHasta || '--/--/----',
    }));
    const q = termino.trim().toLowerCase();
    return q ? filas.filter((f) => Object.values(f).join(' ').toLowerCase().includes(q)) : filas;
  }

  // ── Solicitud de Modificación: overlay «Seleccionar registro» ──
  abrirBuscarRegistro(): void {
    this.idsRegistro.set(this.registroModif() ? [this.registroModif()!.codigo] : []);
    this.buscarRegistroAbierto.set(true);
  }

  aceptarRegistroModif(ids: string[]): void {
    const registro = this.registrosStore.registros().find((r) => r.codigo === ids[0]) ?? null;
    this.registroModif.set(registro);
    this.buscarRegistroAbierto.set(false);
    // Un registro recién elegido parte sin selección de fila, sin editar y sin marca de modificado.
    this.filaModifSel.set(false);
    this.editando.set(false);
    this.registroModificado.set(false);
  }

  limpiarRegistroModif(): void {
    this.registroModif.set(null);
    this.idsRegistro.set([]);
    this.filaModifSel.set(false);
    this.editando.set(false);
    this.registroModificado.set(false);
  }

  // ── Grilla de «Registro de modificación»: seleccionar, editar o eliminar la fila ──
  /** Entra al formulario de edición (solo con la fila marcada). Carga Subtipo y Estado actuales. */
  iniciarEdicion(): void {
    const r = this.registroModif();
    if (!this.filaModifSel() || !r) return;
    this.editSubtipo.set(r.subtipo);
    this.editEstado.set(r.estado);
    this.editando.set(true);
  }

  /** Cancela la edición y vuelve a la grilla sin cambios. */
  cancelarEdicion(): void {
    this.editando.set(false);
  }

  /** Acepta la edición: aplica Subtipo y Estado al registro y marca la fila como modificada. */
  aceptarEdicion(): void {
    if (!this.edicionValida()) return;
    this.registroModif.update((r) => (r ? { ...r, subtipo: this.editSubtipo().trim(), estado: this.editEstado() } : r));
    this.registroModificado.set(true);
    this.editando.set(false);
    this.filaModifSel.set(false);
  }

  /** Quita el registro elegido y vuelve al placeholder con la lupa. */
  eliminarRegistroModif(): void {
    this.limpiarRegistroModif();
  }

  /** «Aceptar» del registro: los cuatro selectores y el Subtipo escrito. */
  readonly formValido = computed(() =>
    !!this.procesoSel() && !!this.rolSel() && !!this.perfilSel() && !!this.tipoSel() && !!this.registro().subtipoAccion.trim(),
  );

  /** Actualiza un campo simple del registro (Subtipo de acción). */
  actualizar<K extends keyof RegistroCatalogo>(campo: K, valor: RegistroCatalogo[K]): void {
    this.registro.update((r) => ({ ...r, [campo]: valor }));
  }

  // ── Abrir cada overlay (respeta el habilitado en cadena) ──
  abrirProceso(): void {
    this.idsProceso.set(this.procesoSel() ? [this.procesoSel()!.id] : []);
    this.procesoAbierto.set(true);
  }
  abrirRol(): void {
    if (!this.rolHabilitado()) return;
    this.idsRol.set(this.rolSel() ? [this.rolSel()!.id] : []);
    this.rolAbierto.set(true);
  }
  abrirPerfil(): void {
    if (!this.perfilHabilitado()) return;
    this.idsPerfil.set(this.perfilSel() ? [this.perfilSel()!.id] : []);
    this.perfilAbierto.set(true);
  }
  abrirTipo(): void {
    if (!this.tipoHabilitado()) return;
    this.idsTipo.set(this.tipoSel() ? [this.tipoSel()!.id] : []);
    this.tipoAbierto.set(true);
  }

  // ── Aceptar cada overlay: fija la selección y limpia las dependientes ──
  aceptarProceso(ids: string[]): void {
    const opcion = PROCESOS.find((o) => o.id === ids[0]) ?? null;
    this.procesoSel.set(opcion);
    this.rolSel.set(null);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
    this.procesoAbierto.set(false);
  }
  aceptarRol(ids: string[]): void {
    const opcion = ROLES.find((o) => o.id === ids[0]) ?? null;
    this.rolSel.set(opcion);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
    this.rolAbierto.set(false);
  }
  aceptarPerfil(ids: string[]): void {
    const opcion = PERFILES.find((o) => o.id === ids[0]) ?? null;
    this.perfilSel.set(opcion);
    this.tipoSel.set(null);
    this.perfilAbierto.set(false);
  }
  aceptarTipo(ids: string[]): void {
    const opcion = TIPOS_ACCION.find((o) => o.id === ids[0]) ?? null;
    this.tipoSel.set(opcion);
    this.tipoAbierto.set(false);
  }

  // ── Quitar (X de la card): borra la selección y las dependientes de abajo ──
  limpiarProceso(): void {
    this.procesoSel.set(null);
    this.rolSel.set(null);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
    this.limpiarSubtipo();
  }
  limpiarRol(): void {
    this.rolSel.set(null);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
    this.limpiarSubtipo();
  }
  limpiarPerfil(): void {
    this.perfilSel.set(null);
    this.tipoSel.set(null);
    this.limpiarSubtipo();
  }
  limpiarTipo(): void {
    this.tipoSel.set(null);
    this.limpiarSubtipo();
  }

  /** Al perder el Tipo de acción, el Subtipo (que depende de él) queda vacío. */
  private limpiarSubtipo(): void {
    this.registro.update((r) => ({ ...r, subtipoAccion: '' }));
  }

  /** Abre el formulario de un registro nuevo (limpia los campos; conserva los ya aceptados). */
  anadir(): void {
    this.reiniciar();
    this.mostrandoFormulario.set(true);
  }

  /** Cierra el formulario sin guardar y vuelve a la tabla (o al placeholder). */
  cancelarRegistro(): void {
    this.mostrandoFormulario.set(false);
    this.reiniciar();
  }

  /** Acepta el registro: lo agrega a la tabla, cierra el formulario y avisa con el snackbar. */
  aceptarRegistro(): void {
    if (!this.formValido()) return;
    const r = this.registro();
    this.registros.update((lista) => [
      ...lista,
      {
        // El código lo asigna el backend al aceptar la solicitud; en el registro aún va vacío.
        codigo: '-',
        proceso: this.procesoSel()!,
        rol: this.rolSel()!,
        perfil: this.perfilSel()!,
        tipoAccion: this.tipoSel()!,
        subtipo: r.subtipoAccion.trim(),
        estado: r.estado,
        fechaDesde: r.fechaDesde,
        fechaHasta: r.fechaHasta,
      },
    ]);
    this.mostrandoFormulario.set(false);
    this.reiniciar();
    this.mostrarSnackbar();
  }

  /** Quita un registro de la tabla. */
  quitarRegistro(indice: number): void {
    this.registros.update((lista) => lista.filter((_, i) => i !== indice));
  }

  private mostrarSnackbar(): void {
    this.snackbarAbierto.set(true);
    clearTimeout(this.snackbarTimer);
    // Se cierra solo a los ~2 s (o con la X del snackbar).
    this.snackbarTimer = setTimeout(() => this.snackbarAbierto.set(false), 2500);
  }

  cerrarSnackbar(): void {
    clearTimeout(this.snackbarTimer);
    this.snackbarAbierto.set(false);
  }

  private reiniciar(): void {
    this.registro.set(registroVacio());
    this.procesoSel.set(null);
    this.rolSel.set(null);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
  }

  /** Abre el detalle de un registro (solo lectura) al hacer click en la fila. */
  verDetalle(registro: RegistroGuardado): void {
    this.detalle.set(registro);
  }

  /** Vuelve del detalle a la grilla (flecha de regreso). */
  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  // ── Grabar → ELABORADO ──
  /** Confirma el modal «¿Grabar solicitud?»: pasa a ELABORADO, asigna el N° de documento y avisa. */
  onConfirmarGrabar(): void {
    this.modalGrabar.set(false);
    this.elaborada.set(true);
    this.numeroDocumento.set('0001');
    this.fechaDocumento.set(this.fechaHora());
    this.aviso.set('creation-elaborated');
    this.avisoMensaje.set('');
    this.avisoAbierto.set(true);
  }

  /** Confirma el modal «¿Verificar solicitud?»: verifica y acepta automáticamente (estado final). */
  onConfirmarVerificar(): void {
    this.modalVerificar.set(false);
    this.aceptada.set(true);
    // El backend asigna el código del registro y la fecha de inicio de vigencia al aceptar; en el taller va
    // correlativo simple y la «Fecha desde» toma la fecha de aceptación (ver nota del formulario).
    const aceptados = this.registros().map((r, i) => ({ ...r, codigo: String(i + 1), fechaDesde: this.fechaHoy() }));
    this.registros.set(aceptados);
    // Los registros aceptados en «Creación» alimentan la pestaña «Registros» y el overlay de Modificación.
    this.registrosStore.agregar(aceptados);

    // Modificación: al aceptar, si la vigencia quedó en «No» la «Fecha hasta» toma la fecha de aceptación
    // (antes de aceptar se mostraba «--/--/----»). Se refleja en la grilla, el detalle y la pestaña «Registros».
    const modificado = this.registroModif();
    if (this.esModificacion() && modificado) {
      const actualizado: RegistroGuardado = {
        ...modificado,
        fechaHasta: modificado.estado === 'no' ? this.fechaHoy() : modificado.fechaHasta,
      };
      this.registroModif.set(actualizado);
      this.registrosStore.actualizar(actualizado);
    }
    this.aviso.set('custom');
    this.avisoMensaje.set(`La solicitud de tipo ${this.subtitulo().toLowerCase()} número ${this.numeroDocumento()} se ha aceptado con éxito.`);
    this.avisoAbierto.set(true);
  }

  /** «Editar» del documento elaborado: vuelve al modo edición de la solicitud. */
  volverAEditar(): void {
    this.elaborada.set(false);
  }

  /** Fecha y hora actual (dd/mm/yyyy hh:mm:ss) para la trazabilidad. */
  private fechaHora(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}  ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  /** Convierte una fecha dd/mm/yyyy a ISO (yyyy-mm-dd) para alimentar `siaf-date-time-picker`. */
  aIso(fecha: string): string {
    const [d, m, y] = (fecha ?? '').split('/');
    return d && m && y ? `${y}-${m}-${d}` : '';
  }

  /** Fecha actual (dd/mm/yyyy) para la «Fecha desde» de vigencia al aceptar la solicitud. */
  private fechaHoy(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /** Flecha de regreso del header: desde el detalle vuelve a la grilla; si no, al escritorio. */
  onReturn(): void {
    if (this.detalle()) {
      this.cerrarDetalle();
      return;
    }
    this.regresar();
  }

  /** Cancelar / Regresar del header: vuelve al escritorio. */
  regresar(): void {
    void this.router.navigate(['/panel']);
  }
}
