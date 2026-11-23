import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { QueryReportExportEvent, QueryReportPageComponent } from '../../../../../shared/components/query-report-page/query-report-page.component';
import type { QueryReportParameters, QueryReportResult, QueryReportRow } from '../../../../../shared/types/query-report.types';
import { CATALOGO_SUBTIPO_ACCION_CONSULTAS_CONFIG } from '../../config/catalogo-subtipo-accion-consultas.config';
import type { RegistroGuardado } from '../../models/catalogo-subtipo-accion.model';
import { RegistrosCatalogoStore } from '../../models/registros-catalogo.store';

/**
 * «Consultas y reportes» del proceso «Catálogo de subtipo de acción» (Figma node 36760-22035). La pantalla entera la
 * arma `siaf-query-report-page` desde `CATALOGO_SUBTIPO_ACCION_CONSULTAS_CONFIG`: panel de parámetros, resultado,
 * tabla, filtros, vista de gráficas y Exportar. Esta página solo responde la consulta (filtra los registros del
 * catálogo con los parámetros) y genera el archivo al exportar.
 */
@Component({
  selector: 'siaf-catalogo-subtipo-accion-consultas',
  standalone: true,
  imports: [QueryReportPageComponent],
  template: `
    <siaf-query-report-page
      [config]="config"
      [result]="resultado()"
      [loading]="cargando()"
      (queried)="consultar($event)"
      (exported)="exportar($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoSubtipoAccionConsultasComponent {
  private readonly registrosStore = inject(RegistrosCatalogoStore);

  readonly config = CATALOGO_SUBTIPO_ACCION_CONSULTAS_CONFIG;
  readonly resultado = signal<QueryReportResult | null>(null);
  readonly cargando = signal(false);

  consultar(parametros: QueryReportParameters): void {
    const estado = String(parametros['estado'] ?? '');
    const desde = String(parametros['desde'] ?? '');
    const hasta = String(parametros['hasta'] ?? '');

    this.cargando.set(true);
    const registros = this.registrosStore.registros();
    const filtrados = registros.filter((r) => {
      const iso = this.aIso(r.fechaDesde);
      return (!estado || this.nombreEstado(r.estado) === estado)
        && (!desde || !iso || iso >= desde)
        && (!hasta || !iso || iso <= hasta);
    });
    // El diseño (Figma node 36760-22083) va directo de «Resultado de reporte» a la tabla, sin tarjeta de resumen.
    this.resultado.set({ rows: filtrados.map((r) => this.aFila(r)), summary: null });
    this.cargando.set(false);
  }

  /** dd/mm/aaaa → aaaa-mm-dd, para comparar con el rango que entrega el selector de fecha. */
  private aIso(fechaPe: string): string {
    return fechaPe ? fechaPe.split('/').reverse().join('-') : '';
  }

  exportar(evento: QueryReportExportEvent): void {
    const desde = String(evento.parameters['desde'] ?? '');
    const hasta = String(evento.parameters['hasta'] ?? '');
    const estado = String(evento.parameters['estado'] ?? '');
    const condiciones: { label: string; value: string }[] = [];
    if (desde || hasta) condiciones.push({ label: 'Fecha', value: `${this.aFechaPe(desde)} - ${this.aFechaPe(hasta)}` });
    if (estado) condiciones.push({ label: 'Estado', value: estado });

    void import('../../utils/catalogo-subtipo-accion-export.util').then((m) =>
      m.exportarSubtiposAccion(evento.format, this.config.columns, evento.rows, {
        titulo: 'Catálogo de subtipo de acción',
        tipoInforme: 'Detallado',
        condiciones,
      }),
    );
  }

  /** aaaa-mm-dd → dd/mm/aaaa (el formato de las condiciones del reporte); vacío si no hay fecha. */
  private aFechaPe(iso: string): string {
    return iso ? iso.split('-').reverse().join('/') : '';
  }

  private nombreEstado(estado: RegistroGuardado['estado']): string {
    return estado === 'si' ? 'Sí' : 'No';
  }

  /** «1 Creador»: código del catálogo seguido de su nombre, como en el diseño. */
  private conCodigo(opcion: { codigo: string; nombre: string }): string {
    return `${opcion.codigo} ${opcion.nombre}`;
  }

  private aFila(r: RegistroGuardado): QueryReportRow {
    return {
      codigo: r.codigo,
      proceso: this.conCodigo(r.proceso),
      rol: this.conCodigo(r.rol),
      perfil: this.conCodigo(r.perfil),
      tipoAccion: this.conCodigo(r.tipoAccion),
      subtipo: r.subtipo,
      estado: this.nombreEstado(r.estado),
      fechaDesde: r.fechaDesde,
      fechaHasta: r.fechaHasta || '—',
    };
  }
}
