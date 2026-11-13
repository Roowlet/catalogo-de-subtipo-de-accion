import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { SelectionColumn, SelectionSideNavComponent } from '../../../../../shared/components/selection-side-nav/selection-side-nav.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
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
  TIPOS_ACCION,
  registroVacio,
} from '../../models/catalogo-subtipo-accion.model';
import { CATALOGO_PROCESS_ID, PROCESS_ROUTE } from '../../config/catalogo-subtipo-accion.rutas';

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
    SolicitudePageLayoutComponent,
    SolicitudeInfoCardComponent,
    SolicitudeFormCardComponent,
    SelectionSideNavComponent,
    ButtonComponent,
    IconComponent,
    TextFieldComponent,
    RadioComponent,
    DateTimePickerComponent,
  ],
  templateUrl: './catalogo-subtipo-accion-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoSubtipoAccionRequestComponent {
  private readonly router = inject(Router);

  readonly heading = NOMBRE_SOLICITUD;
  readonly breadcrumbs: BreadcrumbItem[] = buildProcessBreadcrumbs(CATALOGO_PROCESS_ID, PROCESS_ROUTE, 'Registro');

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
  /** Si es true, la sección muestra el formulario; si no, el placeholder con el botón (+). */
  readonly mostrandoFormulario = signal(false);
  /** Campos simples (Código y Vigencia van deshabilitados; Subtipo se escribe a mano). */
  readonly registro = signal<RegistroCatalogo>(registroVacio());

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

  /** Abre el formulario de un registro nuevo (limpia todo). */
  anadir(): void {
    this.reiniciar();
    this.mostrandoFormulario.set(true);
  }

  /** Cierra el formulario sin guardar y vuelve al placeholder. */
  cancelarRegistro(): void {
    this.mostrandoFormulario.set(false);
    this.reiniciar();
  }

  /** Acepta el registro (en el taller solo cierra el formulario). */
  aceptarRegistro(): void {
    if (!this.formValido()) return;
    this.mostrandoFormulario.set(false);
    this.reiniciar();
  }

  private reiniciar(): void {
    this.registro.set(registroVacio());
    this.procesoSel.set(null);
    this.rolSel.set(null);
    this.perfilSel.set(null);
    this.tipoSel.set(null);
  }

  /** Cancelar / Regresar del header: vuelve al escritorio. */
  regresar(): void {
    void this.router.navigate(['/panel']);
  }
}
