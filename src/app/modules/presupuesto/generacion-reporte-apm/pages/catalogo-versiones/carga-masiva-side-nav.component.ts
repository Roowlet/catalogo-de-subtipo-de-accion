import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { UploaderComponent } from '../../../../../shared/ui/uploader/uploader.component';

/**
 * Panel lateral «CARGA MASIVA» del proceso «Generación de reporte APM».
 *
 * Abre un drawer a la derecha con la zona de carga de Excel (.XLS/.XLSX): admite varios archivos,
 * muestra el progreso de cada uno (reutiliza `siaf-uploader`) y confirma con Aceptar/Cancelar.
 * Al aceptar, emite todos los archivos cargados para que la pantalla los coloque en la sección.
 */
@Component({
  selector: 'siaf-apm-carga-masiva-side-nav',
  standalone: true,
  imports: [ButtonComponent, IconComponent, UploaderComponent],
  template: `
    @if (open) {
      <section
        class="fixed inset-0 z-50 bg-black/55 lg:pl-[65px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apm-carga-masiva-title"
        (click)="closed.emit()"
      >
        <aside
          class="absolute bottom-0 right-0 top-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-surface shadow-siaf-lg"
          (click)="$event.stopPropagation()"
        >
          <header class="flex h-14 shrink-0 items-center gap-siaf-xs border-b border-[var(--sys-color-divider-default)] px-siaf-md">
            <h2 id="apm-carga-masiva-title" class="m-0 flex-1 text-base font-bold uppercase tracking-[0.02px] text-text">
              Carga masiva
            </h2>
            <button
              class="inline-flex size-10 items-center justify-center rounded-siaf-md text-text transition hover:bg-surface-muted active:bg-[var(--sys-color-bg-states-light-pressed)]"
              type="button"
              aria-label="Cerrar"
              (click)="closed.emit()"
            >
              <siaf-icon name="close" [size]="24" />
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-siaf-xl py-siaf-md">
            <div class="flex flex-col gap-siaf-lg">
              <p class="m-0 text-sm leading-normal text-[var(--sys-color-text-neutral-medium)]">
                Sube un archivo Excel en el formato correcto. Si no lo tienes,
                <a
                  class="font-bold text-[var(--sys-color-text-brand-primary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-states-focus)]"
                  href="#"
                  (click)="$event.preventDefault()"
                >descárgalo aquí.</a>
              </p>

              <siaf-uploader
                accept=".xls,.xlsx"
                hint="Se permiten archivos de 10 MB como máximo"
                [maxSizeMb]="10"
                (fileSelected)="onFileSelected($event)"
                (fileRemoved)="onFileRemoved($event)"
              />

              <p class="m-0 text-sm text-text">Solo admite archivos .XLS, .XLSX</p>
            </div>
          </div>

          <div class="flex shrink-0 items-center justify-end gap-siaf-xs border-t border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm">
            <button
              class="inline-flex min-h-10 items-center justify-center rounded-siaf-md border border-[var(--sys-color-border-states-enabled)] px-siaf-md py-siaf-xs text-sm font-medium text-text transition hover:bg-surface-muted active:bg-[var(--sys-color-bg-states-light-pressed)]"
              type="button"
              (click)="closed.emit()"
            >
              Cancelar
            </button>
            <siaf-button variant="primary" size="md" [disabled]="archivos().length === 0" (click)="aceptar()">
              Aceptar
            </siaf-button>
          </div>
        </aside>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApmCargaMasivaSideNavComponent {
  @Input()
  set open(value: boolean) {
    this._open = value;
    // Al abrir, el panel arranca vacío (el uploader se recrea dentro del @if).
    if (value) this.archivos.set([]);
  }
  get open(): boolean {
    return this._open;
  }
  private _open = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<File[]>();

  /** Archivos que terminaron de cargar y siguen en su tarjeta. */
  readonly archivos = signal<File[]>([]);

  onFileSelected(file: File): void {
    this.archivos.update((lista) => (lista.includes(file) ? lista : [...lista, file]));
  }

  onFileRemoved(file: File): void {
    this.archivos.update((lista) => lista.filter((archivo) => archivo !== file));
  }

  aceptar(): void {
    if (this.archivos().length) this.confirmed.emit(this.archivos());
  }
}
