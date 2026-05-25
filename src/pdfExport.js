import { jsPDF } from "jspdf";

/* ─────────────────────────────────────────────────────────────────────────────
   Gera PDF do Esboço usando jsPDF — sem abrir janela de impressão
───────────────────────────────────────────────────────────────────────────── */

const NAVY  = [26, 39, 68];
const GOLD  = [201, 168, 76];
const GRAY  = [55, 65, 81];
const LGRAY = [139, 134, 128];
const CREAM = [249, 247, 243];
const LINE  = [229, 224, 212];

function addWrappedText(doc, text, x, y, maxWidth, lineHeight, color) {
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach(line => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function drawSectionHeader(doc, label, y) {
  if (y > 260) { doc.addPage(); y = 20; }
  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(14, y - 3, 3, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(label.toUpperCase(), 20, y + 2);
  y += 10;
  return y;
}

export function gerarPDFEsboco(data, input) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 14;
  const CONTENT_W = W - MARGIN * 2 - 6;
  let y = 0;

  /* ── CAPA / HEADER ── */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 52, "F");

  // Ornamento dourado
  doc.setFillColor(...GOLD);
  doc.rect(0, 50, W, 2, "F");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(245, 240, 232);
  const titleLines = doc.splitTextToSize(data.tituloFormatado, W - 28);
  doc.text(titleLines, MARGIN, 18);

  // Referência
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(`📖 ${input.referencia}`, MARGIN, 32);

  // Meta badges
  let badgeX = MARGIN;
  [input.objetivo, input.publicoTom].filter(Boolean).forEach(tag => {
    doc.setFillColor(255, 255, 255, 0.12);
    doc.setTextColor(200, 195, 185);
    doc.setFontSize(7.5);
    doc.text(`• ${tag}`, badgeX, 42);
    badgeX += doc.getTextWidth(`• ${tag}`) + 6;
  });

  y = 62;

  /* ── VERSÍCULO CHAVE ── */
  if (data.versiculoChave) {
    doc.setFillColor(...CREAM);
    doc.setDrawColor(...LINE);
    doc.roundedRect(MARGIN, y - 4, W - MARGIN * 2, 22, 2, 2, "FD");
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN, y - 4, 3, 22, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const vLines = doc.splitTextToSize(`"${data.versiculoChave}"`, CONTENT_W - 4);
    vLines.slice(0, 3).forEach((line, i) => doc.text(line, MARGIN + 7, y + 2 + i * 5));
    y += 28;
  }

  /* ── INTRODUÇÃO ── */
  y = drawSectionHeader(doc, "I. Introdução", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = addWrappedText(doc, data.introducao.replace(/\n\n/g, " "), MARGIN + 6, y, CONTENT_W, 5, GRAY);
  y += 6;

  /* ── CONTEXTO TEOLÓGICO ── */
  y = drawSectionHeader(doc, "II. Contexto Teológico", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = addWrappedText(doc, data.contextoTeologico.replace(/\n\n/g, " "), MARGIN + 6, y, CONTENT_W, 5, GRAY);
  y += 6;

  /* ── PONTOS PRINCIPAIS ── */
  const romaNum = ["III", "IV", "V"];
  data.pontosPrincipais.forEach((ponto, i) => {
    if (y > 250) { doc.addPage(); y = 20; }

    // Header do ponto
    doc.setFillColor(...NAVY);
    doc.roundedRect(MARGIN, y - 3, W - MARGIN * 2, 12, 2, 2, "F");

    // Número circular
    doc.setFillColor(...GOLD);
    doc.circle(MARGIN + 7, y + 3, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(26, 39, 68);
    doc.text(`${i + 1}`, MARGIN + 5.5, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 240, 232);
    doc.text(`${romaNum[i]}. ${ponto.titulo}`, MARGIN + 14, y + 5);
    y += 16;

    // Desenvolvimento
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    y = addWrappedText(doc, ponto.desenvolvimento.replace(/\n\n/g, " "), MARGIN + 6, y, CONTENT_W, 5, GRAY);
    y += 4;

    // Aplicação
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setFillColor(240, 236, 224);
    doc.setDrawColor(...GOLD);
    const aplicLines = doc.splitTextToSize(ponto.aplicacao, CONTENT_W - 10);
    const aplicH = aplicLines.length * 5 + 10;
    doc.roundedRect(MARGIN + 4, y - 3, W - (MARGIN + 4) * 2, aplicH, 1, 1, "FD");
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN + 4, y - 3, 2.5, aplicH, "F");
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("✦ Aplicação:", MARGIN + 10, y + 2);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    y = addWrappedText(doc, ponto.aplicacao, MARGIN + 10, y + 7, CONTENT_W - 10, 4.5, GRAY);
    y += 4;

    // Versículo de apoio
    if (ponto.versiculoApoio) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...LGRAY);
      doc.text(`📖 ${ponto.versiculoApoio}`, MARGIN + 6, y);
      y += 7;
    }
    y += 4;
  });

  /* ── CONCLUSÃO ── */
  if (y > 250) { doc.addPage(); y = 20; }
  y = drawSectionHeader(doc, "VI. Conclusão e Apelo", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = addWrappedText(doc, data.conclusao.replace(/\n\n/g, " "), MARGIN + 6, y, CONTENT_W, 5, GRAY);
  y += 10;

  /* ── ESBOÇO ── */
  if (data.esboco?.length) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = drawSectionHeader(doc, "Esboço de Púlpito", y);
    doc.setFillColor(...CREAM);
    doc.setDrawColor(...LINE);
    const esbocoText = data.esboco.join("\n");
    const esbocoLines = doc.splitTextToSize(esbocoText, CONTENT_W - 6);
    const esbocoH = Math.min(esbocoLines.length * 4.5 + 12, 200);
    doc.roundedRect(MARGIN, y - 3, W - MARGIN * 2, esbocoH, 2, 2, "FD");
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    let ey = y + 4;
    esbocoLines.forEach(line => {
      if (ey > 275) { doc.addPage(); ey = 20; }
      doc.text(line, MARGIN + 4, ey);
      ey += 4.5;
    });
    y = ey + 8;
  }

  /* ── FOOTER em todas as páginas ── */
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text("SermonStudio AI  ·  Ferramenta Ministerial", MARGIN, 292);
    doc.setTextColor(150, 145, 140);
    doc.text(`Pág. ${p} / ${pageCount}`, W - MARGIN - 12, 292);
  }

  return doc;
}
