// Plantilla de estilos para los documentos formales del proyecto.
// Convención: Times New Roman — cuerpo 12 pt, subtítulos 15 pt, títulos 17 pt.
// Los tamaños de docx-js van en medios puntos (12 pt = 24).
const {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
  PageBreak,
} = require("docx");

const FONT = "Times New Roman";
const SIZE_BODY = 24; // 12 pt
const SIZE_H2 = 30; // 15 pt
const SIZE_H1 = 34; // 17 pt

// Párrafo de cuerpo, justificado.
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 160, line: 300 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts.para,
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, ...opts.run })],
  });

// Viñeta de cuerpo.
const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 100, line: 300 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });

// Título de sección (17 pt, negrita).
const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: SIZE_H1, bold: true, color: "000000" })],
  });

// Subtítulo (15 pt, negrita).
const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: FONT, size: SIZE_H2, bold: true, color: "000000" })],
  });

// Tabla con fila de encabezado. widths: anchos de columna en DXA (deben sumar <= 9360).
function makeTable(widths, headerCells, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (text, { bold = false, fill } = {}, w) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: fill ? { type: "clear", fill } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          spacing: { after: 0 },
          children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold })],
        }),
      ],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerCells.map((t, i) => cell(t, { bold: true, fill: "E7E6E6" }, widths[i])),
      }),
      ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, {}, widths[i])) })),
    ],
  });
}

const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

// Portada estándar del proyecto + salto de página.
function cover({ subtitle, date }) {
  const line = (text, size, bold, after) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after },
      children: [new TextRun({ text, font: FONT, size, bold })],
    });
  return [
    line("Universidad del Valle de Guatemala", SIZE_H1, true, 2000),
    line("Página Web - AEUVG", SIZE_H1, true, 400),
    line(subtitle, SIZE_H2, false, 2000),
    line("Harry Daniel Méndez Mendoza - 24089", SIZE_BODY, false, 200),
    line("Juan Gabriel Gualim Molina - 24852", SIZE_BODY, false, 2000),
    line(date, SIZE_BODY, false, 0),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Documento carta con márgenes de 1" y viñetas configuradas.
function buildDocument(children) {
  return new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });
}

module.exports = { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument };
