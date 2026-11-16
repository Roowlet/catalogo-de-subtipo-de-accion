import { Injectable, signal } from '@angular/core';

import { RegistroGuardado, registrosSemilla } from './catalogo-subtipo-accion.model';

/**
 * Store en memoria de los registros del catálogo de subtipo de acción (maqueta del taller). Arranca con la data de
 * prueba (`registrosSemilla`) y acumula los registros que se van aceptando en «Creación». Lo leen la pestaña
 * «Registros» de Documentos y registros y el overlay de la solicitud de Modificación. Como es en memoria, los
 * registros creados se mantienen durante la sesión y se reinician al recargar la página.
 */
@Injectable({ providedIn: 'root' })
export class RegistrosCatalogoStore {
  private readonly _registros = signal<RegistroGuardado[]>(registrosSemilla());

  /** Registros disponibles (data de prueba + creados en la sesión). */
  readonly registros = this._registros.asReadonly();

  /** Suma los registros aceptados de una solicitud de creación, recalculando el código correlativo. */
  agregar(nuevos: RegistroGuardado[]): void {
    if (!nuevos.length) return;
    this._registros.update((lista) => {
      const base = lista.length;
      const conCodigo = nuevos.map((registro, i) => ({ ...registro, codigo: String(base + i + 1) }));
      return [...lista, ...conCodigo];
    });
  }

  /** Reemplaza un registro existente (por código) con su versión modificada al aceptar una solicitud de Modificación. */
  actualizar(registro: RegistroGuardado): void {
    this._registros.update((lista) => lista.map((r) => (r.codigo === registro.codigo ? { ...registro } : r)));
  }
}
