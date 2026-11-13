import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';

import { PermissionService } from '../../../../../core/auth/permission.service';
import { ESTADO } from '../../../../../core/models/documento.model';
import { SolicitudesFacadeService } from '../../../../../core/state/solicitudes-facade.service';
import { SolicitudesStateService } from '../../../../../core/state/solicitudes-state.service';
import { DocumentsRecordsPageComponent } from '../../../../../shared/components/documents-records-page/documents-records-page.component';
import type { DocumentsQuery, DocumentsRecordsConfig, DocumentsRecordsRow } from '../../../../../shared/types/documents-records.types';
import { createNewDocumentIdsSignal } from '../../../../../shared/utils/new-document-ids.util';
import { CATALOGO_SUBTIPO_ACCION_DOCUMENTS_CONFIG } from '../../config/catalogo-subtipo-accion-documents.config';
import { REQUEST_ROUTE } from '../../config/catalogo-subtipo-accion.rutas';
import { CODIGO_DOCUMENTO } from '../../models/catalogo-subtipo-accion.model';

/**
 * «Documentos y registros» del proceso «Catálogo de subtipo de acción» (Figma node 20016-187919). La pantalla
 * entera la arma `siaf-documents-records-page`: esta página solo carga la bandeja (documentos del tipo SSTA) y las
 * pasa como filas. El botón «Crear documento» abre la solicitud (formulario «Registro del catálogo»).
 */
@Component({
  selector: 'siaf-catalogo-subtipo-accion-documents',
  standalone: true,
  imports: [DocumentsRecordsPageComponent],
  template: `
    <siaf-documents-records-page
      [config]="pageConfig()"
      [loading]="cargando()"
      (documentsQueryChange)="onDocumentsQuery($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoSubtipoAccionDocumentsComponent implements OnInit {
  private readonly solicitudesState = inject(SolicitudesStateService);
  private readonly solicitudesFacade = inject(SolicitudesFacadeService);
  private readonly permissions = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nuevos = createNewDocumentIdsSignal();

  readonly cargando = signal(true);

  ngOnInit(): void {
    this.solicitudesFacade.iniciarBandeja(this.permissions.currentRole(), this.destroyRef, [CODIGO_DOCUMENTO], { page: 1, limit: 10 });
    // No hay API de registros propia en el taller: la pestaña Documentos basta para la maqueta.
    this.cargando.set(false);
  }

  /** Búsqueda y paginación de la pestaña Documentos (Enter, lupa o cambio de página). */
  onDocumentsQuery(q: DocumentsQuery): void {
    const query = { search: q.search, page: q.page, limit: q.limit };
    if (this.permissions.currentRole() === 'approver') this.solicitudesFacade.cargarBandejaAprobador([CODIGO_DOCUMENTO], query);
    else this.solicitudesFacade.cargarBandejaCreador([CODIGO_DOCUMENTO], query);
  }

  readonly pageConfig = computed((): DocumentsRecordsConfig => {
    const solicitudes = this.permissions.currentRole() === 'approver'
      ? this.solicitudesState.bandejaAprobador()
      : this.solicitudesState.bandejaCreador();
    const nuevos = this.nuevos();

    const documentRows: DocumentsRecordsRow[] = solicitudes.map((s) => {
      const verificado = [...s.historial].reverse().find((h) => h.estado === ESTADO.VERIFICADO);
      const aprobado = [...s.historial].reverse().find((h) => h.estado === ESTADO.APROBADO);
      return {
        document: s.tipoDocumento,
        documentId: s.id,
        isNew: nuevos.has(s.id),
        number: s.numero || '—',
        actionType: s.tipoAccion === 'creacion' ? 'Creación' : s.tipoAccion,
        status: s.estado,
        system: 'Presupuesto',
        date: s.fecha,
        entity: s.entidad || '—',
        creator: s.creador,
        subject: s.justificacion,
        evaluationDate: verificado?.fecha ?? '—',
        evaluationUser: verificado?.usuario ?? '—',
        approvalDate: aprobado?.fecha ?? '—',
        approvalUser: aprobado?.usuario ?? '—',
        linkRoute: `${REQUEST_ROUTE}/${s.id}`,
      };
    });

    return {
      ...CATALOGO_SUBTIPO_ACCION_DOCUMENTS_CONFIG,
      documentRows,
      recordRows: [],
      serverQuery: { total: this.solicitudesState.bandejaTotal() },
    };
  });
}
