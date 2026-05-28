import PptxGenJS from "pptxgenjs";

/* ─────────────────────────────────────────────────────────────────────────────
   TEMAS VISUAIS — 5 estilos para o .pptx
───────────────────────────────────────────────────────────────────────────── */
const PPTX_THEMES = {
  tradicional: {
    name: "Tradicional / Sóbrio",
    bg: "1a2744",
    accent: "C9A84C",
    title: "F5F0E8",
    body: "C9A84C",
    sub: "8B8680",
    font: "Georgia",
    bodyFont: "Calibri",
    borderColor: "C9A84C",
  },
  moderno: {
    name: "Moderno / Minimalista",
    bg: "F8F9FA",
    accent: "1D4ED8",
    title: "0F172A",
    body: "374151",
    sub: "1D4ED8",
    font: "Calibri",
    bodyFont: "Calibri",
    borderColor: "1D4ED8",
    accentBar: true,
  },
  jovem: {
    name: "Jovem / Impactante",
    bg: "09090B",
    accent: "FB923C",
    title: "FFFFFF",
    body: "FB923C",
    sub: "888888",
    font: "Arial",
    bodyFont: "Arial",
    borderColor: "FB923C",
    bold: true,
  },
  natureza: {
    name: "Natureza",
    bg: "134E2A",
    accent: "4ADE80",
    title: "F0FDF4",
    body: "86EFAC",
    sub: "6EE7B7",
    font: "Georgia",
    bodyFont: "Calibri",
    borderColor: "4ADE80",
  },
  purpura: {
    name: "Púrpura Real",
    bg: "3B0764",
    accent: "A855F7",
    title: "FAF5FF",
    body: "D8B4FE",
    sub: "C084FC",
    font: "Georgia",
    bodyFont: "Calibri",
    borderColor: "A855F7",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER — adiciona slide com layout padrão
───────────────────────────────────────────────────────────────────────────── */
function addSlide(pptx, theme, tipo, titulo, conteudo, subtexto = "", bgImage = null) {
  const t = PPTX_THEMES[theme] || PPTX_THEMES.tradicional;
  const slide = pptx.addSlide();
  slide.background = { color: t.bg };

  // Imagem de fundo DALL-E
  if (bgImage) {
    slide.addImage({ data: bgImage, x: 0, y: 0, w: "100%", h: "100%", sizing: { type: "cover" } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "000000", transparency: 38 }, line: { color: "000000", transparency: 100 } });
  }

  // Barra de acento lateral (tema moderno)
  if (t.accentBar) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.12, h: "100%",
      fill: { color: t.accent },
      line: { color: t.accent },
    });
  }

  // Borda decorativa (temas dark)
  if (!t.accentBar) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.18, y: 0.14, w: 9.64, h: 5.22,
      fill: { type: "none" },
      line: { color: t.borderColor, width: 0.8, transparency: 60 },
    });
  }

  // Label do tipo de slide (topo)
  const tipoLabel = {
    titulo: "SERMÃO",
    escritura: "ESCRITURA",
    ponto: "PONTO PRINCIPAL",
    citacao: "PALAVRA DE APOIO",
    conclusao: "CONCLUSÃO",
  }[tipo] || "SERMÃO";

  slide.addText(tipoLabel, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.32,
    w: 9,
    h: 0.3,
    fontSize: 9,
    color: t.accent,
    bold: true,
    charSpacing: 5,
    fontFace: t.bodyFont,
  });

  // Linha decorativa abaixo do label
  slide.addShape(pptx.ShapeType.line, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.68,
    w: 3,
    h: 0,
    line: { color: t.accent, width: 1, transparency: 40 },
  });

  // Título principal
  const tituloLimpo = titulo.replace(/^📖\s*/, "");
  slide.addText(tituloLimpo, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.8,
    w: t.accentBar ? 9.2 : 9,
    h: 2.4,
    fontSize: tipo === "titulo" ? 40 : 34,
    color: t.title,
    bold: t.bold || tipo === "titulo",
    fontFace: t.font,
    valign: "middle",
    wrap: true,
    align: t.accentBar ? "left" : "center",
  });

  // Conteúdo / corpo
  if (conteudo) {
    slide.addText(conteudo, {
      x: t.accentBar ? 0.4 : 0.7,
      y: 3.3,
      w: t.accentBar ? 9.2 : 8.6,
      h: 1.5,
      fontSize: tipo === "escritura" || tipo === "citacao" ? 18 : 16,
      color: t.body,
      italic: tipo === "escritura" || tipo === "citacao",
      fontFace: t.bodyFont,
      valign: "top",
      wrap: true,
      align: t.accentBar ? "left" : "center",
    });
  }

  // Subtexto / referência
  if (subtexto) {
    slide.addText(subtexto, {
      x: t.accentBar ? 0.4 : 0.5,
      y: 4.85,
      w: 9,
      h: 0.35,
      fontSize: 11,
      color: t.sub,
      fontFace: t.bodyFont,
      align: t.accentBar ? "left" : "center",
      charSpacing: 1,
    });
  }

  // Rodapé discreto
  slide.addText("SermonStudio AI", {
    x: 0, y: 5.32, w: 10, h: 0.18,
    fontSize: 7,
    color: "444444",
    align: "center",
    fontFace: t.bodyFont,
    transparency: 60,
  });

  return slide;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DE TÍTULO ESPECIAL — layout hero
───────────────────────────────────────────────────────────────────────────── */
function addTitleSlide(pptx, theme, data, input, bgImage = null) {
  const t = PPTX_THEMES[theme] || PPTX_THEMES.tradicional;
  const slide = pptx.addSlide();
  slide.background = { color: t.bg };

  if (bgImage) {
    slide.addImage({ data: bgImage, x: 0, y: 0, w: "100%", h: "100%", sizing: { type: "cover" } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "000000", transparency: 35 }, line: { color: "000000", transparency: 100 } });
  }

  // Barra decorativa topo
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.06,
    fill: { color: t.accent },
    line: { color: t.accent },
  });

  // Barra decorativa fundo
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.44, w: "100%", h: 0.06,
    fill: { color: t.accent },
    line: { color: t.accent },
  });

  // Ornamento central
  slide.addText("✦", {
    x: 0, y: 0.5, w: "100%", h: 0.6,
    fontSize: 22,
    color: t.accent,
    align: "center",
    fontFace: t.font,
    transparency: 30,
  });

  // Título principal
  slide.addText(data.tituloFormatado, {
    x: 0.6, y: 1.1, w: 8.8, h: 2.4,
    fontSize: 42,
    color: t.title,
    bold: true,
    fontFace: t.font,
    align: "center",
    valign: "middle",
    wrap: true,
  });

  // Referência
  slide.addText(input.referencia, {
    x: 0.6, y: 3.55, w: 8.8, h: 0.45,
    fontSize: 18,
    color: t.accent,
    fontFace: t.bodyFont,
    align: "center",
    bold: true,
  });

  // Linha separadora
  slide.addShape(pptx.ShapeType.line, {
    x: 3.5, y: 4.08, w: 3, h: 0,
    line: { color: t.accent, width: 0.8, transparency: 50 },
  });

  // Objetivo + público
  const metaText = [input.objetivo, input.publicoTom].filter(Boolean).join("  ·  ");
  if (metaText) {
    slide.addText(metaText, {
      x: 0.6, y: 4.2, w: 8.8, h: 0.35,
      fontSize: 11,
      color: t.sub,
      fontFace: t.bodyFont,
      align: "center",
      charSpacing: 2,
    });
  }

  // Rodapé
  slide.addText("SermonStudio AI  ·  Ferramenta Ministerial", {
    x: 0, y: 5.3, w: "100%", h: 0.2,
    fontSize: 7,
    color: "555555",
    align: "center",
    fontFace: t.bodyFont,
    transparency: 50,
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DE PONTO PRINCIPAL — layout rico com número
───────────────────────────────────────────────────────────────────────────── */
function addPontoSlide(pptx, theme, ponto, numero, bgImage = null) {
  const t = PPTX_THEMES[theme] || PPTX_THEMES.tradicional;
  const slide = pptx.addSlide();
  slide.background = { color: t.bg };

  if (bgImage) {
    slide.addImage({ data: bgImage, x: 0, y: 0, w: "100%", h: "100%", sizing: { type: "cover" } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "000000", transparency: 38 }, line: { color: "000000", transparency: 100 } });
  }

  if (!t.accentBar) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.18, y: 0.14, w: 9.64, h: 5.22,
      fill: { type: "none" },
      line: { color: t.borderColor, width: 0.8, transparency: 60 },
    });
  } else {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.12, h: "100%",
      fill: { color: t.accent },
      line: { color: t.accent },
    });
  }

  // Círculo com número
  slide.addShape(pptx.ShapeType.ellipse, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.28,
    w: 0.55, h: 0.55,
    fill: { type: "none" },
    line: { color: t.accent, width: 1.5 },
  });
  slide.addText(`${numero}`, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.28, w: 0.55, h: 0.55,
    fontSize: 14, color: t.accent,
    bold: true, fontFace: t.bodyFont,
    align: "center", valign: "middle",
  });

  // Label
  slide.addText("PONTO PRINCIPAL", {
    x: t.accentBar ? 1.1 : 1.2,
    y: 0.35, w: 8, h: 0.28,
    fontSize: 9, color: t.accent,
    bold: true, charSpacing: 5,
    fontFace: t.bodyFont,
  });

  // Título do ponto
  slide.addText(ponto.titulo, {
    x: t.accentBar ? 0.4 : 0.5,
    y: 0.95, w: t.accentBar ? 9.2 : 9,
    h: 1.8,
    fontSize: 32,
    color: t.title,
    bold: t.bold || false,
    fontFace: t.font,
    wrap: true,
    valign: "middle",
    align: t.accentBar ? "left" : "center",
  });

  // Frase de impacto
  if (ponto.frasePrincipal) {
    slide.addText(`"${ponto.frasePrincipal}"`, {
      x: t.accentBar ? 0.4 : 0.7,
      y: 2.85, w: t.accentBar ? 9.2 : 8.6,
      h: 1.2,
      fontSize: 17,
      color: t.body,
      italic: true,
      fontFace: t.bodyFont,
      wrap: true,
      align: t.accentBar ? "left" : "center",
    });
  }

  // Versículo de apoio
  if (ponto.versiculoApoio) {
    slide.addText(ponto.versiculoApoio, {
      x: t.accentBar ? 0.4 : 0.5,
      y: 4.82, w: 9, h: 0.28,
      fontSize: 10,
      color: t.sub,
      fontFace: t.bodyFont,
      align: t.accentBar ? "left" : "center",
      italic: true,
    });
  }

  slide.addText("SermonStudio AI", {
    x: 0, y: 5.32, w: 10, h: 0.18,
    fontSize: 7, color: "444444",
    align: "center", fontFace: t.bodyFont, transparency: 60,
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   FUNÇÃO PRINCIPAL — gera e baixa o .pptx
───────────────────────────────────────────────────────────────────────────── */
export async function gerarPPTX(data, input, theme = "tradicional", slideImages = {}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "SermonStudio AI";
  pptx.subject = data.tituloFormatado;
  pptx.title = data.tituloFormatado;

  // Reconstrói índices dos slides para mapear imagens
  let slideIdx = 0;

  // Helper para adicionar imagem de fundo se disponível
  const addBgImage = (slide, idx) => {
    const img = slideImages[idx];
    if (!img) return;
    slide.addImage({
      data: img,
      x: 0, y: 0, w: "100%", h: "100%",
      sizing: { type: "cover" },
    });
    // Overlay escuro para legibilidade
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: "100%", h: "100%",
      fill: { color: "000000", transparency: 40 },
      line: { color: "000000", transparency: 100 },
    });
  };

  // ── Slide 1: Título Hero ──
  addTitleSlide(pptx, theme, data, input, slideImages[slideIdx]);
  slideIdx++;

  // ── Slide 2: Versículo Chave ──
  if (data.versiculoChave) {
    addSlide(pptx, theme, "escritura",
      `📖 ${input.referencia}`,
      `"${data.versiculoChave}"`,
      "Texto-base do Sermão",
      slideImages[slideIdx]
    );
    slideIdx++;
  }

  // ── Slides dos Pontos Principais ──
  data.pontosPrincipais.forEach((ponto, i) => {
    addPontoSlide(pptx, theme, ponto, i + 1, slideImages[slideIdx]);
    slideIdx++;
    addSlide(pptx, theme, "citacao",
      "Aplicação Prática",
      ponto.aplicacao,
      ponto.versiculoApoio || "",
      slideImages[slideIdx]
    );
    slideIdx++;
  });

  // ── Slide de Conclusão ──
  addSlide(pptx, theme, "conclusao",
    "Conclusão",
    data.fraseConclusao || data.conclusao.split(".")[0] + ".",
    input.referencia,
    slideImages[slideIdx]
  );
  slideIdx++;

  // ── Slide Final ──
  addTitleSlide(pptx, theme, data, input, null);

  const fileName = `${data.tituloFormatado
    .replace(/[^\w\s\u00C0-\u024F]/g, "")
    .trim()
    .slice(0, 50)
    .trim()} — SermonStudio.pptx`;

  await pptx.writeFile({ fileName });
  return fileName;
}
