import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { DataTableColumn, DataTableRow } from '../../../../../shared/components/data-table/data-table.component';
import { AlertComponent } from '../../../../../shared/ui/alert/alert.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { MessageBoxComponent } from '../../../../../shared/ui/message-box/message-box.component';
import { TableComponent } from '../../../../../shared/ui/table/table.component';
import { TabItem, TabsComponent } from '../../../../../shared/ui/tabs/tabs.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { PROCESO_NOMBRE, PROCESS_ID, PROCESS_ROUTE } from '../../config/generacion-reporte-apm.rutas';
import { ApmCargaMasivaSideNavComponent } from './carga-masiva-side-nav.component';

/** Estado de validación de un archivo cargado en una sección de la estructura. */
type EstadoArchivo = 'validando' | 'validado' | 'error';

interface ArchivoApm {
  id: string;
  nombre: string;
  estado: EstadoArchivo;
  /** Fecha/hora en que terminó la validación (solo si quedó «validado»). */
  validadoEn?: string;
}

/** Fila base de las cadenas de la APM (datos de ejemplo mientras no hay backend). */
interface CadenaApm {
  entidad: string;
  fuente: string;
  categoria: string;
  generica: string;
}

/** Fila de la grilla completa de Gastos (con subfuente y montos por año). */
interface GastoApm {
  linea: string;
  /** La fila tiene un registro erróneo (muestra el ícono rojo en la columna Línea). */
  errada: boolean;
  entidad: string;
  fuente: string;
  subfuente: string;
  categoria: string;
  generica: string;
  m2027: string;
  m2028: string;
  m2029: string;
}

/** Fila de la grilla de Pie de página (descripción + monto). */
interface PiePaginaApm {
  descripcion: string;
  monto: string;
  /** La fila tiene un registro erróneo (muestra el ícono rojo). */
  errada: boolean;
}

/**
 * Pantalla principal del proceso «Generación de reporte APM» (Catálogo de Versiones).
 *
 * Versión activa, pestañas del flujo (Importación · Pendientes · Procesados) y, dentro de Importación,
 * el navegador de secciones (Gastos, Anexos, Pie de página) con el panel de «Registro de estructura».
 *
 * Carga de archivos: al subir y aceptar un archivo la tarjeta entra «validando» (reloj); tras la
 * validación interna (simulada) queda sin ícono si todo está correcto o con «error» (ícono rojo) si falla
 * —no se muestra ningún visto bueno verde ni mensaje de «validando» en el área de trabajo—. Cuando la
 * sección tiene archivos con resultado, debajo aparecen las «Cadenas de la APM» (banner + tabla; en Gastos
 * la grilla completa con años y fila TOTAL) y el «Detalle» (registros erróneos / correctos / total y el
 * estado Fallido o Procesado).
 *
 * La validación es simulada por nombre: un archivo cuyo nombre contenga «error» deja la sección Fallida.
 */
@Component({
  selector: 'siaf-generacion-reporte-apm',
  standalone: true,
  imports: [
    PageShellComponent,
    PageHeaderComponent,
    TabsComponent,
    ButtonComponent,
    IconComponent,
    MessageBoxComponent,
    AlertComponent,
    TableComponent,
    ApmCargaMasivaSideNavComponent,
  ],
  template: `
    <siaf-page-shell [breadcrumbs]="breadcrumbs">
      <div pageHeader>
        <siaf-page-header title="Generación de reportes de la APM" />
        <siaf-tabs
          class="block px-siaf-lg"
          ariaLabel="Etapas de la generación de reporte"
          [tabs]="tabsPrincipales"
          [activeId]="tabPrincipal()"
          [border]="false"
          (activeIdChange)="tabPrincipal.set($any($event))"
        />
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-siaf-md overflow-y-auto">
        <!-- Tarjeta de la versión activa (en las tres pestañas) -->
        <section class="flex flex-col gap-siaf-sm">
          <h2 class="m-0 text-base font-bold text-[var(--sys-color-text-neutral-high)]">VERSIÓN</h2>
          <div
            class="relative flex items-center justify-between gap-siaf-md overflow-hidden rounded-siaf-md border border-[var(--sys-color-divider-default)] bg-surface px-siaf-lg py-siaf-md shadow-siaf-elevation-1"
          >
            <!-- Acento azul corto en el lateral izquierdo (no un borde completo). -->
            <span class="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--sys-color-bg-brand-primary)]" aria-hidden="true"></span>
            <dl class="m-0 grid flex-1 grid-cols-2 gap-x-siaf-xl gap-y-siaf-sm sm:grid-cols-3">
              @for (campo of version; track campo.label) {
                <div class="flex flex-col gap-siaf-xxs">
                  <dt class="text-xs text-[var(--sys-color-text-neutral-medium)]">{{ campo.label }}</dt>
                  <dd class="m-0 text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ campo.value }}</dd>
                </div>
              }
            </dl>
            <siaf-button variant="text" size="md" [iconOnly]="true" icon="more_vert" ariaLabel="Opciones de la versión" />
          </div>
        </section>

        @switch (tabPrincipal()) {
          @case ('importacion') {
          <!-- Navegador de secciones + panel de registro, dentro de una tarjeta blanca de alto completo -->
          <div class="flex flex-1 flex-col rounded-siaf-md bg-surface p-siaf-md shadow-siaf-elevation-1">
          <div class="grid flex-1 grid-cols-1 gap-siaf-md lg:grid-cols-[280px_minmax(0,1fr)]">
            <!-- Navegador de secciones (gap de 8px); la sección activa se expande y muestra sus archivos -->
            <nav class="flex flex-col gap-siaf-xs" aria-label="Secciones de la estructura">
              @for (s of secciones; track s.id) {
                <div
                  class="overflow-hidden rounded-siaf-sm border"
                  [class.border-[var(--sys-color-border-states-enabled)]]="seccionResaltada() !== s.id"
                  [class.border-[var(--sys-color-bg-brand-primary)]]="seccionResaltada() === s.id"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-siaf-sm px-siaf-md py-siaf-sm text-left text-sm transition"
                    [class.hover:bg-[var(--sys-color-bg-states-light-hover)]]="seccionResaltada() !== s.id"
                    [class.bg-[var(--sys-color-bg-states-light-selected)]]="seccionResaltada() === s.id"
                    (click)="abrirSeccion(s.id)"
                  >
                    <siaf-icon
                      name="arrow_right"
                      [size]="20"
                      class="shrink-0 transition-transform duration-150"
                      [class.rotate-90]="seccion() === s.id"
                      [class.text-[var(--sys-color-text-neutral-medium)]]="seccionResaltada() !== s.id"
                      [class.text-[var(--sys-color-text-brand-primary)]]="seccionResaltada() === s.id"
                    />
                    <span
                      class="flex-1"
                      [class.font-normal]="seccionResaltada() !== s.id"
                      [class.text-[var(--sys-color-text-neutral-medium)]]="seccionResaltada() !== s.id"
                      [class.font-bold]="seccionResaltada() === s.id"
                      [class.text-[var(--sys-color-text-brand-primary)]]="seccionResaltada() === s.id"
                    >{{ s.title }}</span>
                  </button>

                  @if (seccion() === s.id && archivosSeccion().length) {
                    <ul class="m-0 flex list-none flex-col p-0">
                      @for (a of archivosSeccion(); track a.id) {
                        <li>
                          <button
                            type="button"
                            class="flex w-full items-center gap-siaf-sm py-siaf-xs pl-9 pr-siaf-md text-left transition hover:bg-[var(--sys-color-bg-states-light-hover)]"
                            [class.bg-[var(--sys-color-bg-states-light-selected)]]="archivoAbierto() === a.id"
                            (click)="archivoAbierto.set(a.id)"
                          >
                            <span
                              class="min-w-0 flex-1 truncate text-sm"
                              [class.text-[var(--sys-color-text-neutral-medium)]]="archivoAbierto() !== a.id"
                              [class.text-[var(--sys-color-text-brand-primary)]]="archivoAbierto() === a.id"
                            >{{ a.nombre }}</span>
                            @switch (a.estado) {
                              @case ('validando') {
                                <siaf-icon name="history" [size]="20" class="shrink-0 text-[var(--sys-color-text-neutral-medium)]" ariaLabel="Validando internamente la estructura" />
                              }
                              @case ('error') {
                                <siaf-icon name="error" [size]="20" class="shrink-0 text-[var(--sys-color-text-feedback-danger)]" ariaLabel="La estructura tiene errores" />
                              }
                            }
                          </button>
                        </li>
                      }
                    </ul>
                  }
                </div>
              }
            </nav>

            <section class="flex flex-col gap-siaf-md lg:border-l lg:border-[var(--sys-color-divider-default)] lg:pl-siaf-lg">
              <header class="flex items-start justify-between gap-siaf-md">
                <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">
                  {{ tituloRegistro() }}
                </h2>
                <siaf-button
                  variant="accent"
                  size="md"
                  [iconOnly]="true"
                  icon="file_upload"
                  ariaLabel="Subir archivo"
                  (click)="cargaPanelAbierto.set(true)"
                />
              </header>

              @if (archivosSeccion().length === 0) {
                <message-box text="No se han adjuntado archivos. Por favor, haga clic en el botón para subir un archivo." />
              } @else {
                <!-- El resultado no se abre solo: aparece al hacer clic en un archivo ya validado -->
                @if (estadoProceso(); as estado) {
                  <section class="flex flex-col gap-siaf-md">
                    <h3 class="m-0 text-sm font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">
                      {{ tituloCadenas() }}
                    </h3>

                    @if (estado === 'fallido') {
                      <siaf-alert tone="error" title="Registros erróneos">
                        <ul class="m-0 list-disc pl-siaf-md text-xs font-normal leading-[normal]">
                          <li>
                            {{ descripcionBanner() }} Para revisar el detalle,
                            <a
                              class="font-bold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                              href="#"
                              (click)="$event.preventDefault()"
                            >descárgalo aquí</a>.
                          </li>
                        </ul>
                      </siaf-alert>
                    } @else {
                      <siaf-alert
                        tone="success"
                        title="Archivo procesado"
                        description="El archivo se procesó correctamente. No se encontraron inconsistencias."
                      />
                    }

                    @if (usaGrillaCompleta()) {
                      <!-- Grilla completa (Gastos y Anexo 1): cabeceras agrupadas, años y fila TOTAL -->
                      <div class="siaf-table-shell">
                        <table class="siaf-table min-w-[1400px]">
                          <thead>
                            <tr class="siaf-table-head-row">
                              <th class="siaf-table-th whitespace-nowrap" rowspan="2">Línea</th>
                              <th class="siaf-table-th whitespace-nowrap" colspan="1">Clasificador institucional</th>
                              <th class="siaf-table-th whitespace-nowrap" colspan="2">Clasificador fuente de financiamiento</th>
                              <th class="siaf-table-th whitespace-nowrap" rowspan="2">Categoría del gasto</th>
                              <th class="siaf-table-th whitespace-nowrap" colspan="1">Clasificador objeto del gasto</th>
                              <th class="siaf-table-th whitespace-nowrap" colspan="3">Asignación presupuestaria</th>
                            </tr>
                            <tr class="siaf-table-head-row">
                              <th class="siaf-table-th whitespace-nowrap">Entidad / Pliego</th>
                              <th class="siaf-table-th whitespace-nowrap">Fuente de financiamiento</th>
                              <th class="siaf-table-th whitespace-nowrap">Subfuente de financiamiento</th>
                              <th class="siaf-table-th whitespace-nowrap">Genérica</th>
                              <th class="siaf-table-th whitespace-nowrap text-right">2027</th>
                              <th class="siaf-table-th whitespace-nowrap text-right">2028</th>
                              <th class="siaf-table-th whitespace-nowrap text-right">2029</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (g of gastosFilas(); track g.linea) {
                              <tr class="siaf-table-row">
                                <td class="siaf-table-td">
                                  <span class="inline-flex items-center gap-siaf-xs whitespace-nowrap">
                                    {{ g.linea }}
                                    @if (g.errada) {
                                      <siaf-icon name="error" [size]="18" class="text-[var(--sys-color-text-feedback-danger)]" ariaLabel="Registro erróneo" />
                                    }
                                  </span>
                                </td>
                                <td class="siaf-table-td min-w-[220px]">{{ g.entidad }}</td>
                                <td class="siaf-table-td whitespace-nowrap">{{ g.fuente }}</td>
                                <td class="siaf-table-td whitespace-nowrap">{{ g.subfuente }}</td>
                                <td class="siaf-table-td whitespace-nowrap">{{ g.categoria }}</td>
                                <td class="siaf-table-td whitespace-nowrap">{{ g.generica }}</td>
                                <td class="siaf-table-td whitespace-nowrap text-right">{{ g.m2027 }}</td>
                                <td class="siaf-table-td whitespace-nowrap text-right">{{ g.m2028 }}</td>
                                <td class="siaf-table-td whitespace-nowrap text-right">{{ g.m2029 }}</td>
                              </tr>
                            }
                            <tr class="siaf-table-row font-bold">
                              <td class="siaf-table-td whitespace-nowrap text-right" colspan="6">Total</td>
                              <td class="siaf-table-td whitespace-nowrap text-right">{{ gastosTotales.m2027 }}</td>
                              <td class="siaf-table-td whitespace-nowrap text-right">{{ gastosTotales.m2028 }}</td>
                              <td class="siaf-table-td whitespace-nowrap text-right">{{ gastosTotales.m2029 }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    } @else if (seccion() === 'pie') {
                      <!-- Grilla de Pie de página: descripción + monto -->
                      <div class="siaf-table-shell">
                        <table class="siaf-table min-w-[720px]">
                          <thead>
                            <tr class="siaf-table-head-row">
                              <th class="siaf-table-th">Pie de página</th>
                              <th class="siaf-table-th whitespace-nowrap">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (p of piePaginaFilas(); track $index) {
                              <tr class="siaf-table-row">
                                <td class="siaf-table-td">
                                  <span class="flex items-start gap-siaf-xs">
                                    @if (p.errada) {
                                      <siaf-icon name="error" [size]="18" class="mt-[2px] shrink-0 text-[var(--sys-color-text-feedback-danger)]" ariaLabel="Registro erróneo" />
                                    }
                                    <span>{{ p.descripcion }}</span>
                                  </span>
                                </td>
                                <td class="siaf-table-td whitespace-nowrap align-top">{{ p.monto }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <siaf-table [columns]="columnasCadenas" [rows]="cadenasRows()" idKey="linea" />
                    }

                    <!-- Detalle -->
                    <div class="flex flex-col gap-siaf-sm">
                      <h3 class="m-0 text-sm font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">Detalle</h3>
                      <dl class="m-0 grid grid-cols-2 gap-siaf-md sm:grid-cols-4">
                        <div class="flex flex-col gap-siaf-xxs">
                          <dt class="text-xs text-[var(--sys-color-text-neutral-medium)]">Registros erróneos</dt>
                          <dd class="m-0 text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ detalle().erroneos }} Items</dd>
                        </div>
                        <div class="flex flex-col gap-siaf-xxs">
                          <dt class="text-xs text-[var(--sys-color-text-neutral-medium)]">Registros correctos</dt>
                          <dd class="m-0 text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ detalle().correctos }} Items</dd>
                        </div>
                        <div class="flex flex-col gap-siaf-xxs">
                          <dt class="text-xs text-[var(--sys-color-text-neutral-medium)]">Total de registros</dt>
                          <dd class="m-0 text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ detalle().total }} Items</dd>
                        </div>
                        <div class="flex flex-col gap-siaf-xxs">
                          <dt class="text-xs text-[var(--sys-color-text-neutral-medium)]">Estado</dt>
                          <dd class="m-0 text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ estado === 'fallido' ? 'Fallido' : 'Procesado' }}</dd>
                        </div>
                      </dl>
                    </div>
                  </section>
                } @else {
                  <message-box text="Seleccione un archivo de la lista para ver su resultado." />
                }
              }
            </section>
          </div>
          </div>
          }

          @case ('pendientes') {
            <!-- Mismo armazón que Importación: menú lateral de secciones + tabla de pendientes -->
            <div class="flex flex-1 flex-col rounded-siaf-md bg-surface p-siaf-md shadow-siaf-elevation-1">
              <div class="grid flex-1 grid-cols-1 gap-siaf-md lg:grid-cols-[280px_minmax(0,1fr)]">
                <nav class="flex flex-col gap-siaf-xs" aria-label="Secciones pendientes">
                  @for (s of secciones; track s.id) {
                    <div
                      class="overflow-hidden rounded-siaf-sm border"
                      [class.border-[var(--sys-color-border-states-enabled)]]="seccionPendiente() !== s.id"
                      [class.border-[var(--sys-color-bg-brand-primary)]]="seccionPendiente() === s.id"
                    >
                      <button
                        type="button"
                        class="flex w-full items-center gap-siaf-sm px-siaf-md py-siaf-sm text-left text-sm transition"
                        [class.hover:bg-[var(--sys-color-bg-states-light-hover)]]="seccionPendiente() !== s.id"
                        [class.bg-[var(--sys-color-bg-states-light-selected)]]="seccionPendiente() === s.id"
                        (click)="seccionPendiente.set(s.id)"
                      >
                        <siaf-icon
                          name="arrow_right"
                          [size]="20"
                          class="shrink-0"
                          [class.text-[var(--sys-color-text-neutral-medium)]]="seccionPendiente() !== s.id"
                          [class.text-[var(--sys-color-text-brand-primary)]]="seccionPendiente() === s.id"
                        />
                        <span
                          class="flex-1"
                          [class.font-normal]="seccionPendiente() !== s.id"
                          [class.text-[var(--sys-color-text-neutral-medium)]]="seccionPendiente() !== s.id"
                          [class.font-bold]="seccionPendiente() === s.id"
                          [class.text-[var(--sys-color-text-brand-primary)]]="seccionPendiente() === s.id"
                        >{{ s.title }}</span>
                      </button>
                    </div>
                  }
                </nav>

                <section class="flex flex-col gap-siaf-md lg:border-l lg:border-[var(--sys-color-divider-default)] lg:pl-siaf-lg">
                  <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">Pendientes</h2>
                  <siaf-table [columns]="columnasPendientes" [rows]="pendientesRows" idKey="codigo" />
                </section>
              </div>
            </div>
          }

          @case ('procesados') {
            <section class="flex flex-col gap-siaf-md rounded-siaf-md bg-surface p-siaf-lg">
              <div class="flex items-center justify-between gap-siaf-md">
                <siaf-tabs
                  class="min-w-0 flex-1"
                  ariaLabel="Secciones procesadas"
                  [tabs]="subTabs"
                  [activeId]="subTab()"
                  [border]="false"
                  (activeIdChange)="subTab.set($any($event))"
                />
                <siaf-button variant="accent" size="md" icon="picture_as_pdf" (click)="generarPdf()">Generar PDF</siaf-button>
              </div>
              <h3 class="m-0 text-sm font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">
                Registro de estructura de {{ subTabLabel() }}
              </h3>
              <siaf-table [columns]="columnasProcesados" [rows]="procesadosRows" idKey="linea" />
            </section>
          }
        }
      </div>

      <!-- Panel «Carga masiva»: lo abre el botón de subir de la sección activa -->
      <siaf-apm-carga-masiva-side-nav
        [open]="cargaPanelAbierto()"
        (closed)="cargaPanelAbierto.set(false)"
        (confirmed)="onCargaConfirmada($event)"
      />
    </siaf-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneracionReporteApmComponent {
  readonly breadcrumbs: BreadcrumbItem[] = buildProcessBreadcrumbs(PROCESS_ID, PROCESS_ROUTE, PROCESO_NOMBRE);

  // ── Versión activa (datos de ejemplo mientras no hay backend) ──
  readonly version: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Año', value: '2026' },
    { label: 'Código', value: '1' },
    { label: 'Nombre', value: 'Versión Nro 1' },
  ];

  // ── Pestañas del flujo ──
  readonly tabsPrincipales: TabItem[] = [
    { id: 'importacion', label: 'Importación' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'procesados', label: 'Procesados' },
  ];
  readonly tabPrincipal = signal('importacion');

  // ── Navegador de secciones (izquierda) ──
  readonly secciones: ReadonlyArray<{ id: string; title: string }> = [
    { id: 'gastos', title: 'Gastos' },
    { id: 'anexo-1', title: 'Anexo 1' },
    { id: 'anexo-2', title: 'Anexo 2' },
    { id: 'pie', title: 'Pié de página' },
  ];
  readonly seccion = signal('gastos');

  /** Secciones que usan la grilla completa (Línea, clasificadores, años y TOTAL). Gastos y Anexo 1 comparten formato. */
  readonly usaGrillaCompleta = computed(() => this.seccion() === 'gastos' || this.seccion() === 'anexo-1');

  /** Sección elegida en el menú lateral de la pestaña «Pendientes». */
  readonly seccionPendiente = signal('gastos');

  /** Sección elegida en el menú lateral de la pestaña «Procesados». */
  readonly seccionProcesado = signal('gastos');
  readonly nombreSeccionProcesado = computed(() => this.secciones.find((s) => s.id === this.seccionProcesado())?.title ?? '');

  /** Panel «Carga masiva» abierto. */
  readonly cargaPanelAbierto = signal(false);

  /** Archivos cargados por sección. */
  private readonly archivos = signal<Record<string, ArchivoApm[]>>({});

  /** Archivos de la sección elegida. */
  readonly archivosSeccion = computed<ArchivoApm[]>(() => this.archivos()[this.seccion()] ?? []);

  /** Nombre de la sección elegida (p. ej. «Gastos»). */
  private readonly nombreSeccion = computed(() => this.secciones.find((s) => s.id === this.seccion())?.title ?? '');

  /** Título del panel de registro según la sección elegida. */
  readonly tituloRegistro = computed(() => `Registro de estructura de ${this.nombreSeccion()}`);
  readonly tituloCadenas = computed(() => `Cadenas de la APM de ${this.nombreSeccion()}`);

  // ── Cadenas de la APM (datos de ejemplo) ──
  readonly columnasCadenas: DataTableColumn[] = [
    { key: 'linea', label: 'Línea' },
    { key: 'entidad', label: 'Entidad / Pliego' },
    { key: 'fuente', label: 'Fuente de financiamiento' },
    { key: 'categoria', label: 'Categoría de gasto' },
    { key: 'generica', label: 'Genérica' },
  ];

  private readonly CADENAS_BASE: CadenaApm[] = [
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', categoria: '5. Gastos corrientes', generica: '2.1 Personal y obligaciones sociales' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', categoria: '5. Gastos corrientes', generica: '2.3 Bienes y servicios' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', categoria: '6. Gastos de capital', generica: '2.6 Adquisición de activos no financieros' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', categoria: '6. Gastos de capital', generica: '2.4 Donaciones y transferencias' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', categoria: '5. Gastos corrientes', generica: '2.5 Otros gastos' },
  ];

  /** Índices (base 0) de las filas con error cuando la sección queda Fallida (coincide con el Figma: filas 3 y 4). */
  private readonly FILAS_ERRONEAS = [2, 3];

  /** Archivo cuyo resultado está abierto (null hasta que el usuario hace clic en uno de la lista). */
  readonly archivoAbierto = signal<string | null>(null);

  /**
   * Sección que se muestra resaltada en el navegador: ninguna mientras se inspecciona un archivo
   * (la sección sigue expandida, pero su cabecera deja de verse seleccionada).
   */
  readonly seccionResaltada = computed<string | null>(() => (this.archivoAbierto() ? null : this.seccion()));

  /** Archivo abierto que pertenece a la sección activa (null si no hay o es de otra sección). */
  private readonly archivoActivo = computed<ArchivoApm | null>(() => {
    const id = this.archivoAbierto();
    return id ? this.archivosSeccion().find((a) => a.id === id) ?? null : null;
  });

  /**
   * Estado del resultado mostrado: null mientras no se abra un archivo ya validado. El resultado NO se
   * abre solo al terminar la validación; requiere clic en el archivo. «fallido» si el archivo tiene error.
   */
  readonly estadoProceso = computed<'fallido' | 'procesado' | null>(() => {
    const a = this.archivoActivo();
    if (!a || a.estado === 'validando') return null;
    return a.estado === 'error' ? 'fallido' : 'procesado';
  });

  readonly cadenasRows = computed<DataTableRow[]>(() => {
    const fallido = this.estadoProceso() === 'fallido';
    return this.CADENAS_BASE.map((c, i) => {
      const errada = fallido && this.FILAS_ERRONEAS.includes(i);
      return { linea: errada ? `${i + 1} ⚠` : `${i + 1}`, entidad: c.entidad, fuente: c.fuente, categoria: c.categoria, generica: c.generica };
    });
  });

  // ── Grilla completa de Gastos (datos de ejemplo, tal como llega el archivo) ──
  private readonly GASTOS_BASE: ReadonlyArray<Omit<GastoApm, 'linea' | 'errada'>> = [
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', subfuente: '19. Recursos por operaciones oficiales de crédito', categoria: '5. Gastos corrientes', generica: '1. Personal y obligaciones sociales', m2027: 'S/ 183,115,348.00', m2028: 'S/ 183,313,009.00', m2029: 'S/ 184,043,956.00' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', subfuente: '19. Recursos por operaciones oficiales de crédito', categoria: '5. Gastos corrientes', generica: '1. Personal y obligaciones sociales', m2027: 'S/ 1,501,030.00', m2028: 'S/ 1,501,030.00', m2029: 'S/ 1,501,030.00' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', subfuente: '19. Recursos por operaciones oficiales de crédito', categoria: '5. Gastos corrientes', generica: '1. Personal y obligaciones sociales', m2027: 'S/ 165,642,053.00', m2028: 'S/ 165,642,053.00', m2029: 'S/ 165,642,053.00' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', subfuente: '19. Recursos por operaciones oficiales de crédito', categoria: '5. Gastos corrientes', generica: '1. Personal y obligaciones sociales', m2027: 'S/ 147,977,758.00', m2028: 'S/ 147,977,758.00', m2029: 'S/ 147,977,758.00' },
    { entidad: '037. Ministerio de vivienda, construcción y saneamiento', fuente: '1. Recursos ordinarios', subfuente: '19. Recursos por operaciones oficiales de crédito', categoria: '5. Gastos corrientes', generica: '1. Personal y obligaciones sociales', m2027: 'S/ 374,077,456.00', m2028: 'S/ 374,077,456.00', m2029: 'S/ 374,077,456.00' },
  ];

  /** Totales por año de la sección Gastos (tal como llega en el archivo de ejemplo). */
  readonly gastosTotales = { m2027: 'S/ 872,313,645.00', m2028: 'S/ 872,313,645.00', m2029: 'S/ 872,313,645.00' };

  /** Filas de Gastos con su número de línea y la marca de error (ícono rojo) cuando la sección queda Fallida. */
  readonly gastosFilas = computed<GastoApm[]>(() => {
    const fallido = this.estadoProceso() === 'fallido';
    return this.GASTOS_BASE.map((g, i) => ({
      ...g,
      linea: `${i + 1}`,
      errada: fallido && this.FILAS_ERRONEAS.includes(i),
    }));
  });

  // ── Grilla de Pie de página (datos de ejemplo) ──
  private readonly PIE_DESCRIPCION =
    'Considera la asignación, para el año 2026, en la genérica de gasto 2.6 Adquisición de Activos No ' +
    'Financieros, del programa de endeudamiento CREACIÓN DE UN SISTEMA DE ATENCIÓN DE EMERGENCIAS, ' +
    'URGENCIAS E INFORMACIÓN MEDIANTE UN NÚMERO ÚNICO 911 EN LIMA METROPOLITANA Y CALLAO.';

  private readonly PIE_BASE: ReadonlyArray<Omit<PiePaginaApm, 'errada'>> = [
    { descripcion: this.PIE_DESCRIPCION, monto: 'S/ 30,777,777.00' },
    { descripcion: this.PIE_DESCRIPCION, monto: 'S/ 12,500,000.00' },
    { descripcion: this.PIE_DESCRIPCION, monto: 'S/ 8,340,120.00' },
    { descripcion: this.PIE_DESCRIPCION, monto: 'S/ 5,120,000.00' },
    { descripcion: this.PIE_DESCRIPCION, monto: 'S/ 2,000,000.00' },
  ];

  /** Filas de Pie de página con la marca de error (ícono rojo) cuando la sección queda Fallida. */
  readonly piePaginaFilas = computed<PiePaginaApm[]>(() => {
    const fallido = this.estadoProceso() === 'fallido';
    return this.PIE_BASE.map((p, i) => ({ ...p, errada: fallido && this.FILAS_ERRONEAS.includes(i) }));
  });

  readonly detalle = computed(() => {
    const total = this.CADENAS_BASE.length;
    const erroneos = this.estadoProceso() === 'fallido' ? this.FILAS_ERRONEAS.length : 0;
    return { total, erroneos, correctos: total - erroneos };
  });

  readonly descripcionBanner = computed(
    () =>
      `El archivo no puede procesarse porque presenta ${this.detalle().erroneos} registros erróneos. ` +
      'Corrige la data y vuelve a cargarla; para continuar, todas las inconsistencias deben estar resueltas.',
  );

  // ── Pestañas Pendientes / Procesados ──
  readonly subTabs: TabItem[] = [
    { id: 'gastos', label: 'Gastos' },
    { id: 'anexos', label: 'Anexos' },
    { id: 'pie', label: 'Pie de página' },
  ];
  readonly subTab = signal('gastos');
  readonly subTabLabel = computed(() => this.subTabs.find((t) => t.id === this.subTab())?.label ?? '');

  /** Pendientes: cadenas aún sin procesar (datos de ejemplo). */
  readonly columnasPendientes: DataTableColumn[] = [
    { key: 'codigo', label: 'Código clasificador' },
    { key: 'subgrupo', label: 'Subgrupo' },
    { key: 'entidad', label: 'Entidad / Pliego' },
  ];
  readonly pendientesRows: DataTableRow[] = [
    { codigo: '1.1.1.1.0011.011', subgrupo: 'Gobierno Nacional', entidad: 'MINISTERIO DE SALUD' },
    { codigo: '1.1.1.1.0011.012', subgrupo: 'Gobierno Nacional', entidad: 'MINISTERIO DE VIVIENDA, CONSTRUCCIÓN Y SANEAMIENTO' },
  ];

  /** Procesados: estructura consolidada lista para el reporte (datos de ejemplo). */
  readonly columnasProcesados: DataTableColumn[] = [
    { key: 'linea', label: 'Línea' },
    { key: 'entidad', label: 'Entidad / Pliego' },
    { key: 'fuente', label: 'Fuente de financiamiento' },
    { key: 'subfuente', label: 'Subfuente de financiamiento' },
  ];
  readonly procesadosRows: DataTableRow[] = this.CADENAS_BASE.map((c, i) => ({
    linea: `${i + 1}`,
    entidad: c.entidad,
    fuente: c.fuente,
    subfuente: '19. Recursos por operaciones oficiales de crédito',
  }));

  /** Pendiente: generar el PDF del reporte procesado. */
  generarPdf(): void {
    // Placeholder hasta conectar la generación real del PDF.
  }

  subtitulo(archivo: ArchivoApm): string {
    switch (archivo.estado) {
      case 'validando':
        return 'Validando estructura…';
      case 'error':
        return 'Se encontraron errores en la estructura.';
      default:
        return `Validado el ${archivo.validadoEn}`;
    }
  }

  /**
   * Confirmación del panel «Carga masiva»: coloca los archivos en la sección activa en estado
   * «validando» (ícono de reloj) y lanza la validación interna simulada de cada uno.
   */
  /** Cuántos archivos se han cargado en cada sección (para la prueba: el 2.º siempre falla). */
  private readonly cargasPorSeccion: Record<string, number> = {};

  onCargaConfirmada(archivos: File[]): void {
    const seccionId = this.seccion();
    for (const archivo of archivos) {
      const orden = (this.cargasPorSeccion[seccionId] ?? 0) + 1;
      this.cargasPorSeccion[seccionId] = orden;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      this.agregar(seccionId, { id, nombre: archivo.name, estado: 'validando' });
      // Prueba de la DEMO: el 2.º archivo que se carga en la sección queda con error.
      this.validarEstructura(seccionId, id, orden === 2);
    }
    this.cargaPanelAbierto.set(false);
  }

  /** Cambia de sección y cierra el resultado abierto (vuelve al estado sin resultado). */
  abrirSeccion(id: string): void {
    this.seccion.set(id);
    this.archivoAbierto.set(null);
  }

  quitarArchivo(id: string): void {
    const seccionId = this.seccion();
    this.archivos.update((mapa) => ({
      ...mapa,
      [seccionId]: (mapa[seccionId] ?? []).filter((a) => a.id !== id),
    }));
    if (this.archivoAbierto() === id) this.archivoAbierto.set(null);
  }

  private agregar(seccionId: string, archivo: ArchivoApm): void {
    this.archivos.update((mapa) => ({ ...mapa, [seccionId]: [...(mapa[seccionId] ?? []), archivo] }));
  }

  /** Validación interna simulada: `falla` decide si la estructura queda con error o validada. */
  private validarEstructura(seccionId: string, id: string, falla: boolean): void {
    setTimeout(() => {
      this.archivos.update((mapa) => ({
        ...mapa,
        [seccionId]: (mapa[seccionId] ?? []).map((a) =>
          a.id === id
            ? { ...a, estado: falla ? 'error' : 'validado', validadoEn: falla ? undefined : this.ahora() }
            : a,
        ),
      }));
    }, 2200);
  }

  private ahora(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
}
