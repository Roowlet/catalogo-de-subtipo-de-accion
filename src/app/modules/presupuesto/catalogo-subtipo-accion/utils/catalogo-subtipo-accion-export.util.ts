import type { QueryReportColumn, QueryReportExportFormat, QueryReportRow } from '../../../../shared/types/query-report.types';

/** Encabezado del reporte (Figma node 36760-22584): título, tipo de informe y condiciones de búsqueda. */
export interface SubtiposAccionReporte {
  titulo: string;
  /** «Detallado» en el diseño. */
  tipoInforme: string;
  /** Condiciones aplicadas, p. ej. { label: 'Fecha', value: '01/08/2025 - 30/11/2026' }. */
  condiciones: { label: string; value: string }[];
}

/** Azul institucional del SIAF-RP para títulos y cabecera de la tabla. */
const AZUL = 'FF13326B';
const LOGO_URL = 'assets/figma/login/siaf-logo.png';

/** Descarga un Blob como archivo. */
function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Trae el logo como ArrayBuffer para incrustarlo; si falla, el reporte sale sin logo. */
async function cargarLogo(): Promise<ArrayBuffer | null> {
  try {
    const respuesta = await fetch(LOGO_URL);
    return respuesta.ok ? await respuesta.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * Genera el archivo de «Exportar» de la consulta de subtipos de acción con las filas que muestra la tabla (tras buscar
 * y filtrar). La plantilla solo avisa el formato; el archivo lo arma la pantalla. Las librerías se cargan al exportar,
 * así no pesan en la pantalla hasta que se usan.
 *
 * Excel sale como el reporte del diseño (Figma node 36760-22584): título y logo, «Tipo de informe», «Condiciones de
 * búsqueda», «Resultados de la búsqueda» y la tabla con la cabecera azul, adaptada a las columnas de nuestra grilla.
 */
export async function exportarSubtiposAccion(
  formato: QueryReportExportFormat,
  columnas: QueryReportColumn[],
  filas: QueryReportRow[],
  reporte: SubtiposAccionReporte,
): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `subtipos-de-accion-${fecha}`;
  const encabezados = columnas.map((c) => c.label);
  const valores = filas.map((fila) => columnas.map((c) => fila[c.key] ?? ''));

  if (formato === 'csv') {
    const escapar = (valor: string) => (/[",\n;]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor);
    const contenido = [encabezados, ...valores].map((linea) => linea.map(escapar).join(',')).join('\n');
    // BOM para que Excel abra bien las tildes.
    descargar(new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' }), `${nombre}.csv`);
    return;
  }

  if (formato === 'excel') {
    const [{ Workbook }, logo] = await Promise.all([import('exceljs'), cargarLogo()]);
    const libro = new Workbook();
    const hoja = libro.addWorksheet('Subtipos de acción');
    hoja.columns = columnas.map((c) => ({ key: c.key, width: Math.max(14, Math.round((c.width ?? 140) / 7)) }));

    const totalColumnas = columnas.length;
    const ultima = (fila: number) => `${hoja.getColumn(totalColumnas).letter}${fila}`;
    const combinar = (fila: number, desde = 1) => hoja.mergeCells(`${hoja.getColumn(desde).letter}${fila}:${ultima(fila)}`);

    // Título y logo.
    const titulo = hoja.getCell('A2');
    titulo.value = reporte.titulo;
    titulo.font = { bold: true, size: 16, color: { argb: AZUL } };
    hoja.mergeCells('A2:D2');
    if (logo) {
      const idLogo = libro.addImage({ buffer: logo, extension: 'png' });
      hoja.addImage(idLogo, { tl: { col: Math.max(totalColumnas - 2, 4), row: 1 }, ext: { width: 174, height: 54 } });
    }

    // Tipo de informe.
    hoja.getCell('A4').value = 'Tipo de informe:';
    hoja.getCell('A4').font = { bold: true, size: 11, color: { argb: AZUL } };
    hoja.getCell('A5').value = reporte.tipoInforme;
    hoja.getCell('A5').font = { bold: true, size: 11, color: { argb: AZUL } };
    combinar(6);
    hoja.getCell('A6').border = { bottom: { style: 'medium', color: { argb: AZUL } } };

    // Condiciones de búsqueda.
    hoja.getCell('A8').value = 'Condiciones de búsqueda';
    hoja.getCell('A8').font = { bold: true, size: 12, color: { argb: AZUL } };
    let filaActual = 10;
    for (const condicion of reporte.condiciones) {
      hoja.getCell(`A${filaActual}`).value = `${condicion.label}:`;
      hoja.getCell(`A${filaActual}`).font = { bold: true };
      hoja.getCell(`A${filaActual + 1}`).value = condicion.value;
      filaActual += 3;
    }

    // Resultados de la búsqueda.
    hoja.getCell(`A${filaActual}`).value = 'Resultados de la búsqueda';
    hoja.getCell(`A${filaActual}`).font = { bold: true, size: 12, color: { argb: AZUL } };
    filaActual += 2;

    // Cabecera de la tabla (azul, texto blanco) y filas.
    const filaCabecera = hoja.getRow(filaActual);
    encabezados.forEach((texto, i) => {
      const celda = filaCabecera.getCell(i + 1);
      celda.value = texto;
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
      celda.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    filaCabecera.height = 24;
    valores.forEach((valoresFila) => {
      const fila = hoja.addRow({});
      valoresFila.forEach((valor, i) => {
        fila.getCell(i + 1).value = valor;
      });
    });

    const buffer = await libro.xlsx.writeBuffer();
    descargar(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombre}.xlsx`);
    return;
  }

  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const pdf = new jsPDF({ orientation: 'landscape' });
  pdf.setFontSize(14);
  pdf.text(reporte.titulo, 14, 16);
  pdf.setFontSize(10);
  const subtitulo = [`Tipo de informe: ${reporte.tipoInforme}`, ...reporte.condiciones.map((c) => `${c.label}: ${c.value}`)].join('   ');
  pdf.text(subtitulo, 14, 23);
  autoTable(pdf, { head: [encabezados], body: valores, startY: 28, styles: { fontSize: 8 }, headStyles: { fillColor: [19, 50, 107] } });
  pdf.save(`${nombre}.pdf`);
}
