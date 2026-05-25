import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const THEMES = {
  tradicional: {
    key: "tradicional",
    label: "Tradicional / Sóbrio",
    slideBg: "linear-gradient(145deg,#1a2744 0%,#0d1829 100%)",
    titleColor: "#f5f0e8",
    contentColor: "#c9a84c",
    accentColor: "#c9a84c",
    subColor: "rgba(245,240,232,0.55)",
    titleFont: "'Cormorant Garamond',serif",
    bodyFont: "'Source Sans 3',sans-serif",
    titleWeight: "700",
    bodyWeight: "400",
    bodyStyle: "italic",
    borderDecor: "1px solid rgba(201,168,76,0.28)",
    thumbBg: "#1a2744",
    thumbText: "#f5f0e8",
    thumbAccent: "#c9a84c",
  },
  moderno: {
    key: "moderno",
    label: "Moderno / Minimalista",
    slideBg: "#f8f9fa",
    titleColor: "#0f172a",
    contentColor: "#374151",
    accentColor: "#1d4ed8",
    subColor: "#1d4ed8",
    titleFont: "'DM Sans',sans-serif",
    bodyFont: "'DM Sans',sans-serif",
    titleWeight: "700",
    bodyWeight: "400",
    bodyStyle: "normal",
    borderDecor: "none",
    borderAccent: "5px solid #1d4ed8",
    thumbBg: "#f8f9fa",
    thumbText: "#0f172a",
    thumbAccent: "#1d4ed8",
  },
  jovem: {
    key: "jovem",
    label: "Jovem / Impactante",
    slideBg: "#09090b",
    titleColor: "#ffffff",
    contentColor: "#fb923c",
    accentColor: "#fb923c",
    subColor: "rgba(255,255,255,0.45)",
    titleFont: "'Montserrat',sans-serif",
    bodyFont: "'Montserrat',sans-serif",
    titleWeight: "900",
    bodyWeight: "700",
    bodyStyle: "normal",
    borderDecor: "none",
    glow: "radial-gradient(ellipse at 20% 50%,rgba(251,146,60,0.18) 0%,transparent 65%)",
    thumbBg: "#09090b",
    thumbText: "#ffffff",
    thumbAccent: "#fb923c",
  },
};

const QUICK_EXAMPLES = [
  {
    tema: "A Paz que Excede o Entendimento",
    referencia: "Filipenses 4:6-7",
    objetivo: "Consolar a Igreja",
    publicoTom: "Igreja Geral - Solene",
  },
  {
    tema: "Identidade em Cristo",
    referencia: "2 Coríntios 5:17",
    objetivo: "Ensino Teológico",
    publicoTom: "Jovens - Dinâmico",
  },
  {
    tema: "O Pai que Corre ao Encontro do Filho",
    referencia: "Lucas 15:11-32",
    objetivo: "Apelo à Conversão",
    publicoTom: "Evangelístico - Apelo",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

function buildSlides(data, referencia, publicoTom) {
  const slides = [];

  slides.push({
    id: 0,
    tipo: "titulo",
    titulo: data.tituloFormatado,
    conteudo: referencia,
    subtexto: publicoTom || "",
  });

  slides.push({
    id: 1,
    tipo: "escritura",
    titulo: "📖 " + referencia,
    conteudo: data.versiculoChave || "",
    subtexto: "Texto-base do Sermão",
  });

  data.pontosPrincipais.forEach((ponto, i) => {
    slides.push({
      id: 2 + i * 2,
      tipo: "ponto",
      titulo: `${i + 1}. ${ponto.titulo}`,
      conteudo: ponto.frasePrincipal || ponto.aplicacao.slice(0, 120),
      subtexto: "",
    });
    if (ponto.versiculoApoio) {
      slides.push({
        id: 3 + i * 2,
        tipo: "citacao",
        titulo: "Palavra de Apoio",
        conteudo: ponto.versiculoApoio,
        subtexto: "",
      });
    }
  });

  slides.push({
    id: slides.length,
    tipo: "conclusao",
    titulo: "Conclusão",
    conteudo:
      data.fraseConclusao ||
      data.conclusao.split(".").slice(0, 2).join(".") + ".",
    subtexto: referencia,
  });

  return slides;
}

function buildOutlineExportHtml(data, input) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${data.tituloFormatado} — Esboço</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Source Sans 3',sans-serif;background:#fff;color:#1a2744;max-width:800px;margin:40px auto;padding:48px;line-height:1.75}
  @media print{body{margin:0;padding:32px}}
  h1{font-family:'Cormorant Garamond',serif;font-size:2.4rem;color:#1a2744;font-weight:700;margin-bottom:6px}
  .meta{color:#8b8680;font-size:.85rem;letter-spacing:.05em;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #c9a84c}
  h2{font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#c9a84c;letter-spacing:.03em;text-transform:uppercase;margin:36px 0 12px}
  .section{background:#f9f7f3;border-left:3px solid #c9a84c;padding:18px 22px;border-radius:0 6px 6px 0;margin-bottom:8px}
  .section p{color:#374151;font-size:.92rem;margin-bottom:.5rem}
  .ponto-header{background:#1a2744;color:#f5f0e8;padding:10px 18px;border-radius:6px 6px 0 0;display:flex;gap:12px;align-items:center;margin-top:20px}
  .ponto-num{width:28px;height:28px;border:1px solid #c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#c9a84c;font-size:.8rem;font-weight:700;flex-shrink:0}
  .ponto-titulo{font-family:'Cormorant Garamond',serif;font-size:1.1rem}
  .ponto-body{border:1px solid #e5dfd4;border-top:none;border-radius:0 0 6px 6px;padding:16px 18px}
  .aplicacao{background:#f0ece0;border-left:2px solid #c9a84c;padding:10px 14px;border-radius:0 4px 4px 0;margin-top:10px;font-style:italic;font-size:.88rem;color:#374151}
  .verso-apoio{margin-top:8px;font-size:.82rem;color:#8b8680}
  .esboco{font-family:'Courier New',monospace;font-size:.85rem;background:#f5f5f0;padding:24px;border-radius:6px;white-space:pre-wrap;line-height:1.9;color:#1a2744}
  .footer-line{margin-top:48px;padding-top:16px;border-top:1px solid #e5dfd4;text-align:center;font-size:.75rem;color:#b0aba2;letter-spacing:.08em}
</style>
</head>
<body>
<h1>${data.tituloFormatado}</h1>
<div class="meta">
  📖 ${input.referencia}${input.objetivo ? " &nbsp;·&nbsp; " + input.objetivo : ""}${input.publicoTom ? " &nbsp;·&nbsp; " + input.publicoTom : ""}
</div>

<h2>I. Introdução</h2>
<div class="section"><p>${data.introducao.replace(/\n/g, "</p><p>")}</p></div>

<h2>II. Contexto Teológico</h2>
<div class="section"><p>${data.contextoTeologico.replace(/\n/g, "</p><p>")}</p></div>

${data.pontosPrincipais
  .map(
    (p, i) => `
<div class="ponto-header">
  <div class="ponto-num">${i + 1}</div>
  <div class="ponto-titulo">${p.titulo}</div>
</div>
<div class="ponto-body">
  <p style="font-size:.9rem;color:#374151">${p.desenvolvimento.replace(/\n/g, "<br>")}</p>
  <div class="aplicacao">✦ Aplicação: ${p.aplicacao}</div>
  ${p.versiculoApoio ? `<div class="verso-apoio">📖 ${p.versiculoApoio}</div>` : ""}
</div>`
  )
  .join("")}

<h2>V. Conclusão e Apelo</h2>
<div class="section"><p>${data.conclusao.replace(/\n/g, "</p><p>")}</p></div>

<h2>Esboço de Púlpito</h2>
<div class="esboco">${data.esboco.join("\n")}</div>

<div class="footer-line">SermonStudio AI &nbsp;·&nbsp; Ferramenta Ministerial</div>
</body>
</html>`;
}

function buildSlidesExportHtml(slides, theme, tituloFormatado) {
  const t = THEMES[theme];

  const slideHtml = slides
    .map((slide, idx) => {
      const isModerno = theme === "moderno";
      const borderLeft = isModerno ? `border-left:${t.borderAccent};` : "";
      const padLeft = isModerno ? "padding-left:90px;align-items:flex-start;text-align:left;" : "";

      return `
<div class="slide" style="page-break-after:${idx < slides.length - 1 ? "always" : "auto"};background:${t.slideBg};position:relative;width:1280px;height:720px;display:flex;align-items:center;justify-content:center;${borderLeft}">
  ${t.glow ? `<div style="position:absolute;inset:0;background:${t.glow}"></div>` : ""}
  ${t.borderDecor !== "none" && theme === "tradicional" ? `<div style="position:absolute;inset:16px;border:${t.borderDecor};border-radius:3px;pointer-events:none"></div>` : ""}
  <div style="position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px;width:100%;height:100%;${padLeft}">
    <div style="font-family:${t.bodyFont};font-size:13px;letter-spacing:5px;text-transform:uppercase;color:${t.accentColor};margin-bottom:18px;opacity:.9">${slide.tipo === "titulo" ? "SERMÃO" : slide.tipo === "escritura" ? "ESCRITURA" : slide.tipo === "ponto" ? "PONTO " + (slides.filter((s, i2) => s.tipo === "ponto" && i2 <= idx).length) : slide.tipo === "citacao" ? "PALAVRA" : "CONCLUSÃO"}</div>
    <div style="font-family:${t.titleFont};font-size:54px;font-weight:${t.titleWeight};color:${t.titleColor};line-height:1.15;margin-bottom:26px;max-width:1000px">${slide.titulo}</div>
    <div style="font-family:${t.titleFont};font-size:26px;font-weight:${t.bodyWeight};font-style:${t.bodyStyle};color:${t.contentColor};line-height:1.65;max-width:900px">${slide.conteudo}</div>
    ${slide.subtexto ? `<div style="font-family:${t.bodyFont};font-size:16px;color:${t.subColor};margin-top:22px;letter-spacing:1px">${slide.subtexto}</div>` : ""}
  </div>
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Apresentação — ${tituloFormatado}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=DM+Sans:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#1c1c1e}
  .slide{margin:0 auto 0 auto;display:block;overflow:hidden}
  @media print{body{background:none}.slide{margin:0;page-break-after:always;width:100%;height:100vh}}
</style>
</head>
<body>
${slideHtml}
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE VIEWER (inline editable)
───────────────────────────────────────────────────────────────────────────── */

function SlideViewer({ slide, theme, onChange }) {
  const t = THEMES[theme];
  const isModerno = theme === "moderno";

  const containerStyle = {
    background: t.slideBg,
    borderLeft: isModerno ? t.borderAccent : undefined,
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    borderRadius: isModerno ? "0 10px 10px 0" : "10px",
    overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const innerStyle = {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: isModerno ? "flex-start" : "center",
    textAlign: isModerno ? "left" : "center",
    padding: "6% 7%",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  };

  if (!slide) return null;

  return (
    <div style={containerStyle}>
      {t.glow && (
        <div style={{ position: "absolute", inset: 0, background: t.glow }} />
      )}
      {theme === "tradicional" && (
        <div
          style={{
            position: "absolute",
            inset: "12px",
            border: t.borderDecor,
            borderRadius: "3px",
            pointerEvents: "none",
          }}
        />
      )}

      <div style={innerStyle}>
        {/* Type label */}
        <div
          style={{
            fontFamily: t.bodyFont,
            fontSize: "clamp(7px,1vw,11px)",
            letterSpacing: "5px",
            textTransform: "uppercase",
            color: t.accentColor,
            marginBottom: "3%",
            opacity: 0.85,
          }}
        >
          {slide.tipo === "titulo"
            ? "SERMÃO"
            : slide.tipo === "escritura"
            ? "ESCRITURA"
            : slide.tipo === "ponto"
            ? "PONTO PRINCIPAL"
            : slide.tipo === "citacao"
            ? "PALAVRA DE APOIO"
            : "CONCLUSÃO"}
        </div>

        {/* Title */}
        <textarea
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            width: "100%",
            fontFamily: t.titleFont,
            fontSize: "clamp(1rem,3.6vw,2.8rem)",
            fontWeight: t.titleWeight,
            color: t.titleColor,
            lineHeight: 1.18,
            marginBottom: "3%",
            cursor: "text",
            textAlign: isModerno ? "left" : "center",
            overflow: "hidden",
          }}
          rows={2}
          value={slide.titulo}
          onChange={(e) => onChange({ ...slide, titulo: e.target.value })}
        />

        {/* Content */}
        <textarea
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            width: "100%",
            maxWidth: isModerno ? "100%" : "80%",
            fontFamily: t.titleFont,
            fontSize: "clamp(0.6rem,1.9vw,1.3rem)",
            fontWeight: t.bodyWeight,
            fontStyle: t.bodyStyle,
            color: t.contentColor,
            lineHeight: 1.65,
            cursor: "text",
            textAlign: isModerno ? "left" : "center",
            overflow: "hidden",
          }}
          rows={3}
          value={slide.conteudo}
          onChange={(e) => onChange({ ...slide, conteudo: e.target.value })}
        />

        {/* Subtexto */}
        {slide.subtexto !== undefined && (
          <input
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              width: "100%",
              fontFamily: t.bodyFont,
              fontSize: "clamp(0.5rem,1.1vw,0.85rem)",
              color: t.subColor,
              marginTop: "3%",
              letterSpacing: "1px",
              textAlign: isModerno ? "left" : "center",
              cursor: "text",
            }}
            value={slide.subtexto}
            onChange={(e) => onChange({ ...slide, subtexto: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE THUMBNAIL
───────────────────────────────────────────────────────────────────────────── */

function SlideThumb({ slide, theme, active, onClick }) {
  const t = THEMES[theme];
  const isModerno = theme === "moderno";

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        aspectRatio: "16/9",
        background: t.thumbBg,
        borderRadius: "5px",
        border: active ? `2px solid ${t.accentColor}` : "2px solid transparent",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        padding: "6px",
        transition: "all .2s",
        opacity: active ? 1 : 0.65,
        borderLeft: isModerno && !active ? `3px solid ${t.accentColor}` : undefined,
      }}
    >
      <p
        style={{
          color: t.thumbAccent,
          fontSize: "4px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "3px",
          fontFamily: "sans-serif",
        }}
      >
        {slide.tipo}
      </p>
      <p
        style={{
          color: t.thumbText,
          fontSize: "5.5px",
          lineHeight: 1.3,
          fontFamily: "serif",
          fontWeight: "bold",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {slide.titulo.replace("📖 ", "")}
      </p>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function SermonStudio() {
  const [input, setInput] = useState({
    tema: "",
    referencia: "",
    objetivo: "",
    publicoTom: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Iniciando...");
  const [error, setError] = useState("");
  const [sermonData, setSermonData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [slides, setSlides] = useState([]);
  const [editedSlides, setEditedSlides] = useState([]);
  const [activeTab, setActiveTab] = useState("detalhado");
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideTheme, setSlideTheme] = useState("tradicional");
  const loadingMsgRef = useRef(null);

  const data = editedData || sermonData;
  const currentSlides =
    editedSlides.length > 0 ? editedSlides : slides;

  // Sync editedSlides when slides change
  useEffect(() => {
    if (slides.length > 0) setEditedSlides([...slides]);
  }, [slides]);

  /* ── Loading messages cycle ── */
  useEffect(() => {
    if (!loading) return;
    const msgs = [
      "Analisando a passagem bíblica...",
      "Construindo o contexto teológico...",
      "Desenvolvendo os pontos principais...",
      "Preparando aplicações práticas...",
      "Montando o esboço de púlpito...",
      "Gerando os slides visuais...",
      "Finalizando o sermão...",
    ];
    let i = 0;
    setLoadingMsg(msgs[0]);
    loadingMsgRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 1800);
    return () => clearInterval(loadingMsgRef.current);
  }, [loading]);

  /* ── AI Generation ── */
  const handleGenerate = useCallback(async () => {
    if (!input.tema.trim() || !input.referencia.trim()) {
      setError("Por favor, preencha o Tema e a Referência Bíblica.");
      return;
    }
    setError("");
    setLoading(true);
    setSermonData(null);
    setEditedData(null);
    setSlides([]);
    setEditedSlides([]);

    const prompt = `Você é um teólogo e pregador evangélico experiente. Crie um sermão completo e profundo em JSON puro (sem markdown, sem backticks, sem texto fora do JSON).

Formato EXATO do JSON (respeite todos os campos):
{
  "tituloFormatado": "Título elegante e impactante do sermão",
  "versiculoChave": "Transcrição do versículo principal (texto completo)",
  "introducao": "Introdução rica com quebra-gelo, contexto histórico-cultural e conexão com o tema atual (3 parágrafos separados por \\n\\n)",
  "contextoTeologico": "Análise teológica profunda da passagem, palavras originais relevantes, contexto da carta/livro (2 parágrafos separados por \\n\\n)",
  "pontosPrincipais": [
    {
      "titulo": "Título conciso e memorável do ponto 1",
      "frasePrincipal": "Frase de impacto de até 12 palavras para o slide",
      "desenvolvimento": "Exegese e desenvolvimento homilético do ponto (2 parágrafos)",
      "aplicacao": "Aplicação prática objetiva para o cotidiano do ouvinte (1 parágrafo direto)",
      "versiculoApoio": "Versículo de apoio com referência entre parênteses"
    },
    {
      "titulo": "Título do ponto 2",
      "frasePrincipal": "Frase impactante para slide",
      "desenvolvimento": "...",
      "aplicacao": "...",
      "versiculoApoio": "..."
    },
    {
      "titulo": "Título do ponto 3",
      "frasePrincipal": "...",
      "desenvolvimento": "...",
      "aplicacao": "...",
      "versiculoApoio": "..."
    }
  ],
  "conclusao": "Conclusão com apelo emocional e espiritual forte (2 parágrafos)",
  "fraseConclusao": "Frase final impactante de até 15 palavras para slide de encerramento",
  "esboco": [
    "SERMÃO: [título]",
    "Texto-base: [referência]",
    "Objetivo: [objetivo]",
    "",
    "I. INTRODUÇÃO",
    "   A. [sub-tópico]",
    "   B. [sub-tópico]",
    "   C. Transição: [frase de transição]",
    "",
    "II. CONTEXTO TEOLÓGICO",
    "   A. [ponto exegético]",
    "   B. [ponto exegético]",
    "",
    "III. [TÍTULO PONTO 1]",
    "   A. [desenvolvimento]",
    "   B. [desenvolvimento]",
    "   C. Aplicação: [aplicação prática]",
    "   Verso: [versículo]",
    "",
    "IV. [TÍTULO PONTO 2]",
    "   A. ...",
    "   B. ...",
    "   C. Aplicação: ...",
    "   Verso: ...",
    "",
    "V. [TÍTULO PONTO 3]",
    "   A. ...",
    "   B. ...",
    "   C. Aplicação: ...",
    "   Verso: ...",
    "",
    "VI. CONCLUSÃO E APELO",
    "   A. [síntese]",
    "   B. [apelo]"
  ]
}

Dados do sermão:
- Tema/Título: ${input.tema}
- Referência Bíblica: ${input.referencia}
- Objetivo: ${input.objetivo || "Edificação e exortação geral"}
- Público/Tom: ${input.publicoTom || "Igreja Geral - Solene"}

RESPONDA APENAS COM O JSON. Nenhum texto adicional.`;

    try {
      const response = await fetch("/api/sermon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const apiData = await response.json();

      // Surface API-level errors clearly
      if (!response.ok || apiData.error) {
        const msg = apiData.error?.message || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const rawText =
        apiData.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("") || "";

      // Strip markdown fences if present
      const clean = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(clean);

      setSermonData(parsed);
      setEditedData(JSON.parse(JSON.stringify(parsed)));

      const newSlides = buildSlides(parsed, input.referencia, input.publicoTom);
      setSlides(newSlides);
      setSlideIndex(0);
      setActiveTab("detalhado");
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        `Erro: ${err.message || "Falha na geração. Tente novamente."}`
      );
    } finally {
      setLoading(false);
    }
  }, [input]);

  /* ── Exports ── */
  const handleExportOutline = () => {
    if (!data) return;
    const html = buildOutlineExportHtml(data, input);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const handleExportSlides = () => {
    if (!currentSlides.length) return;
    const html = buildSlidesExportHtml(
      currentSlides,
      slideTheme,
      data?.tituloFormatado || "Sermão"
    );
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  /* ── Slide edit helpers ── */
  const updateSlide = (updated) => {
    setEditedSlides((ss) =>
      ss.map((s, i) => (i === slideIndex ? updated : s))
    );
  };

  const updatePonto = (index, field, value) => {
    setEditedData((d) => {
      if (!d) return d;
      const pts = d.pontosPrincipais.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
      return { ...d, pontosPrincipais: pts };
    });
  };

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        fontFamily: "'Source Sans 3', sans-serif",
        background: "#efebe2",
        minHeight: "100vh",
        color: "#1a2744",
      }}
    >
      {/* ── Google Fonts & Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Sans+3:wght@300;400;600;700&family=DM+Sans:wght@400;600;700&family=Montserrat:wght@700;900&display=swap');

        *{box-sizing:border-box}
        .ss-input{
          width:100%;background:white;border:1.5px solid #e2ddd5;border-radius:7px;
          padding:10px 13px;font-family:'Source Sans 3',sans-serif;font-size:.875rem;
          color:#1a2744;transition:border-color .2s,box-shadow .2s;line-height:1.5;
        }
        .ss-input:focus{outline:none;border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,.12)}
        textarea.ss-input{resize:vertical}
        select.ss-input{cursor:pointer;appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b8680' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;
        }
        .ss-label{display:block;font-size:.72rem;font-weight:700;color:#1a2744;
          text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
        .ss-card{background:white;border-radius:14px;box-shadow:0 2px 24px rgba(26,39,68,.07)}
        .ss-btn-primary{
          background:#1a2744;color:#f5f0e8;border:none;cursor:pointer;
          font-family:'Source Sans 3',sans-serif;font-weight:700;
          transition:all .2s;border-radius:8px;
        }
        .ss-btn-primary:hover:not(:disabled){background:#22305c;transform:translateY(-1px);box-shadow:0 5px 16px rgba(26,39,68,.3)}
        .ss-btn-primary:disabled{opacity:.65;cursor:not-allowed}
        .ss-btn-gold{
          background:#c9a84c;color:#1a2744;border:none;cursor:pointer;
          font-family:'Source Sans 3',sans-serif;font-weight:700;
          transition:all .2s;border-radius:8px;
        }
        .ss-btn-gold:hover{background:#d4b55e;transform:translateY(-1px);box-shadow:0 5px 14px rgba(201,168,76,.35)}
        .ss-btn-outline{
          background:white;color:#1a2744;border:1.5px solid #e2ddd5;cursor:pointer;
          font-family:'Source Sans 3',sans-serif;font-weight:600;
          transition:all .2s;border-radius:8px;
        }
        .ss-btn-outline:hover:not(:disabled){border-color:#1a2744;background:#f9f7f3}
        .ss-btn-outline:disabled{opacity:.4;cursor:not-allowed}
        .ss-tab{
          padding:14px 20px;font-size:.82rem;font-weight:700;cursor:pointer;
          border:none;background:none;border-bottom:2.5px solid transparent;
          transition:all .18s;white-space:nowrap;
        }
        .ss-tab:hover{color:#1a2744}
        .ss-tab-active{border-color:#c9a84c;color:#1a2744}
        .ss-tab-inactive{color:#9b9690}
        .ss-editable{
          width:100%;background:#f9f7f3;border:1.5px solid #ede8e0;
          border-radius:6px;padding:12px 15px;
          font-family:'Source Sans 3',sans-serif;font-size:.88rem;
          color:#374151;line-height:1.8;resize:vertical;
          transition:border-color .2s;
        }
        .ss-editable:focus{outline:none;border-color:#c9a84c;background:white;box-shadow:0 0 0 3px rgba(201,168,76,.1)}
        .pulse-dot{animation:pulseDot 1.4s ease-in-out infinite}
        .pulse-dot:nth-child(2){animation-delay:.2s}
        .pulse-dot:nth-child(3){animation-delay:.4s}
        @keyframes pulseDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        .shimmer{animation:shimmer 1.6s ease-in-out infinite}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        .ss-dot-nav{
          width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;
          transition:all .2s;padding:0;
        }
        .ss-theme-pill{
          padding:6px 14px;border-radius:20px;font-size:.78rem;font-weight:700;
          cursor:pointer;border:1.5px solid;transition:all .2s;
        }
        .quick-ex-btn{
          width:100%;text-align:left;background:none;border:1.5px solid transparent;
          border-radius:7px;padding:8px 11px;cursor:pointer;font-size:.8rem;
          color:#8b8680;transition:all .15s;font-family:'Source Sans 3',sans-serif;
        }
        .quick-ex-btn:hover{background:#f9f7f3;border-color:#e5e0d5;color:#1a2744}
        .ponto-dev-wrap{background:#f9f7f3;border-radius:0 0 8px 8px;padding:18px}
        .aplic-box{
          background:#f0ece0;border-left:3px solid #c9a84c;
          padding:11px 14px;border-radius:0 6px 6px 0;margin-top:12px;
        }
      `}</style>

      {/* ════════ HEADER ════════ */}
      <header
        style={{
          background: "#1a2744",
          color: "#f5f0e8",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 20px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 16,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "1.5px solid #c9a84c",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c9a84c",
                fontSize: 18,
              }}
            >
              ✦
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  letterSpacing: ".02em",
                  lineHeight: 1,
                }}
              >
                SermonStudio AI
              </div>
              <div
                style={{
                  fontSize: ".65rem",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#8b8680",
                  marginTop: 2,
                }}
              >
                Ferramenta de Preparação Ministerial
              </div>
            </div>
          </div>

          {/* Export buttons (only when content exists) */}
          {data && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="ss-btn-gold"
                onClick={handleExportOutline}
                style={{ padding: "8px 18px", fontSize: ".8rem", display: "flex", alignItems: "center", gap: 7 }}
              >
                ⬇ Baixar Esboço PDF
              </button>
              <button
                className="ss-btn-primary"
                onClick={handleExportSlides}
                style={{
                  padding: "8px 18px",
                  fontSize: ".8rem",
                  border: "1px solid rgba(201,168,76,.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                ▦ Exportar Apresentação
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px 48px",
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        {/* ═══ LEFT PANEL ═══ */}
        <aside>
          <div className="ss-card" style={{ padding: "28px 24px" }}>
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#1a2744",
                  marginBottom: 4,
                }}
              >
                Painel do Pregador
              </h2>
              <p style={{ fontSize: ".82rem", color: "#9b9690", lineHeight: 1.5 }}>
                Preencha os dados do sermão e deixe a IA construir o conteúdo completo.
              </p>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="ss-label">
                  Tema / Título Central{" "}
                  <span style={{ color: "#c9a84c" }}>*</span>
                </label>
                <input
                  className="ss-input"
                  placeholder="Ex: A parábola do filho pródigo"
                  value={input.tema}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, tema: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="ss-label">
                  Referência Bíblica Principal{" "}
                  <span style={{ color: "#c9a84c" }}>*</span>
                </label>
                <input
                  className="ss-input"
                  placeholder="Ex: Lucas 15:11-32"
                  value={input.referencia}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, referencia: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="ss-label">Objetivo da Mensagem</label>
                <input
                  className="ss-input"
                  placeholder="Ex: Consolar, Conversão, Ensino..."
                  value={input.objetivo}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, objetivo: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="ss-label">Público-Alvo / Tom</label>
                <select
                  className="ss-input"
                  value={input.publicoTom}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, publicoTom: e.target.value }))
                  }
                >
                  <option value="">Selecione...</option>
                  <option>Igreja Geral - Solene</option>
                  <option>Jovens - Dinâmico</option>
                  <option>Pequeno Grupo - Intimista</option>
                  <option>Células - Participativo</option>
                  <option>Evangelístico - Apelo</option>
                  <option>Casais - Familiar</option>
                  <option>Liderança - Formativo</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginTop: 16,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: ".82rem",
                  padding: "10px 14px",
                  borderRadius: 7,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              className="ss-btn-primary"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                marginTop: 22,
                width: "100%",
                padding: "13px",
                fontSize: ".82rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="pulse-dot"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#c9a84c",
                          display: "block",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </span>
                  <span style={{ color: "#c9a84c" }}>{loadingMsg}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "#c9a84c" }}>✦</span>
                  Gerar Sermão com IA
                </>
              )}
            </button>

            {/* Divider + Quick Examples */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid #f0ece0",
              }}
            >
              <p className="ss-label" style={{ marginBottom: 10 }}>
                Exemplos Rápidos
              </p>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="quick-ex-btn"
                  onClick={() => setInput(ex)}
                  style={{ marginBottom: 6, display: "block" }}
                >
                  <span style={{ color: "#c9a84c", marginRight: 6 }}>→</span>
                  <strong style={{ color: "#1a2744", fontWeight: 600 }}>
                    {ex.tema}
                  </strong>
                  <br />
                  <span
                    style={{
                      marginLeft: 18,
                      fontSize: ".72rem",
                      color: "#b0aba2",
                    }}
                  >
                    {ex.referencia} · {ex.publicoTom}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ RIGHT CONTENT ═══ */}
        <section>
          {/* ── Empty State ── */}
          {!data && !loading && (
            <div
              className="ss-card"
              style={{
                minHeight: 560,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  border: "2px solid #e5e0d5",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  fontSize: 28,
                  color: "#c9a84c",
                }}
              >
                ✦
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#1a2744",
                  marginBottom: 10,
                }}
              >
                Pronto para Proclamar
              </h3>
              <p
                style={{
                  color: "#9b9690",
                  maxWidth: 440,
                  lineHeight: 1.7,
                  fontSize: ".88rem",
                  marginBottom: 40,
                }}
              >
                Preencha o painel ao lado com o tema e a passagem bíblica.
                A IA irá construir um sermão teológico completo, com esboço
                de púlpito e slides prontos para projeção.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 28,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {[
                  { icon: "📖", label: "Estudo Completo", desc: "Introdução, contexto e 3 pontos" },
                  { icon: "📝", label: "Esboço de Púlpito", desc: "Guia rápido para pregação" },
                  { icon: "▦", label: "Slides Visuais", desc: "Apresentação 16:9 editável" },
                ].map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: "#f9f7f3",
                        border: "1px solid #e5e0d5",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {f.icon}
                    </div>
                    <p
                      style={{
                        fontSize: ".78rem",
                        fontWeight: 700,
                        color: "#1a2744",
                      }}
                    >
                      {f.label}
                    </p>
                    <p style={{ fontSize: ".72rem", color: "#b0aba2" }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading State ── */}
          {loading && (
            <div className="ss-card" style={{ padding: "40px 36px" }}>
              <div style={{ marginBottom: 32, textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: "1.3rem",
                    color: "#1a2744",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {loadingMsg}
                </p>
                <p style={{ fontSize: ".8rem", color: "#b0aba2" }}>
                  A IA está preparando o sermão completo...
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { w: "45%", h: 22 },
                  { w: "100%", h: 14 },
                  { w: "90%", h: 14 },
                  { w: "75%", h: 14 },
                  { w: "100%", h: 14 },
                  { w: "85%", h: 14 },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="shimmer"
                    style={{
                      width: s.w,
                      height: s.h,
                      background:
                        i === 0
                          ? "linear-gradient(90deg,#e5dfd4,#f0ece0)"
                          : "#f0ece0",
                      borderRadius: 6,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  marginTop: 36,
                  background: "#f9f7f3",
                  border: "1px solid #e5e0d5",
                  borderLeft: "3px solid #c9a84c",
                  padding: "14px 18px",
                  borderRadius: "0 7px 7px 0",
                  fontSize: ".8rem",
                  color: "#8b8680",
                  fontStyle: "italic",
                }}
              >
                "Não por força nem por violência, mas pelo meu Espírito, diz o
                Senhor dos Exércitos." — Zacarias 4:6
              </div>
            </div>
          )}

          {/* ── Content Tabs ── */}
          {data && !loading && (
            <div className="ss-card" style={{ overflow: "hidden" }}>
              {/* Tab Bar */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1.5px solid #f0ece0",
                  background: "#faf9f6",
                  paddingLeft: 8,
                  overflowX: "auto",
                }}
              >
                {[
                  { id: "detalhado", icon: "📖", label: "Estudo Completo", sub: "Modo Detalhado" },
                  { id: "esboco", icon: "📝", label: "Esboço de Púlpito", sub: "Modo Resumido" },
                  { id: "slides", icon: "▦", label: "Apresentação", sub: "Slides Visuais" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`ss-tab ${
                      activeTab === tab.id ? "ss-tab-active" : "ss-tab-inactive"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
                  >
                    <span>
                      {tab.icon} {tab.label}
                    </span>
                    <span
                      style={{
                        fontSize: ".65rem",
                        fontWeight: 400,
                        opacity: 0.55,
                        marginTop: 1,
                      }}
                    >
                      {tab.sub}
                    </span>
                  </button>
                ))}
              </div>

              {/* ─── Tab 1: Detailed Study ─── */}
              {activeTab === "detalhado" && (
                <div
                  style={{
                    padding: "28px 28px 32px",
                    maxHeight: 700,
                    overflowY: "auto",
                  }}
                >
                  {/* Title block */}
                  <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f0ece0" }}>
                    <input
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: "1.9rem",
                        fontWeight: 700,
                        color: "#1a2744",
                        lineHeight: 1.2,
                        outline: "none",
                        marginBottom: 6,
                      }}
                      value={data.tituloFormatado}
                      onChange={(e) =>
                        setEditedData((d) =>
                          d ? { ...d, tituloFormatado: e.target.value } : d
                        )
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{
                          background: "#1a2744",
                          color: "#c9a84c",
                          fontSize: ".72rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          letterSpacing: ".05em",
                        }}
                      >
                        {input.referencia}
                      </span>
                      {input.publicoTom && (
                        <span
                          style={{
                            background: "#f9f7f3",
                            color: "#8b8680",
                            fontSize: ".72rem",
                            padding: "3px 10px",
                            borderRadius: 20,
                            border: "1px solid #e5e0d5",
                          }}
                        >
                          {input.publicoTom}
                        </span>
                      )}
                    </div>
                    {data.versiculoChave && (
                      <div
                        style={{
                          marginTop: 16,
                          background: "#f0ece0",
                          borderLeft: "3px solid #c9a84c",
                          padding: "12px 16px",
                          borderRadius: "0 7px 7px 0",
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: "1rem",
                          fontStyle: "italic",
                          color: "#374151",
                          lineHeight: 1.7,
                        }}
                      >
                        "{data.versiculoChave}"
                      </div>
                    )}
                  </div>

                  {/* Sections */}
                  {[
                    { key: "introducao", label: "I. Introdução", num: "I" },
                    { key: "contextoTeologico", label: "II. Contexto Teológico", num: "II" },
                  ].map((sec) => (
                    <div key={sec.key} style={{ marginBottom: 24 }}>
                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#1a2744",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ color: "#c9a84c", fontSize: ".85rem" }}>◆</span>
                        {sec.label}
                      </h3>
                      <textarea
                        className="ss-editable"
                        rows={5}
                        value={data[sec.key]}
                        onChange={(e) =>
                          setEditedData((d) =>
                            d ? { ...d, [sec.key]: e.target.value } : d
                          )
                        }
                      />
                    </div>
                  ))}

                  {/* Main Points */}
                  {data.pontosPrincipais.map((ponto, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 22,
                        border: "1px solid #e5e0d5",
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "#1a2744",
                          color: "#f5f0e8",
                          padding: "11px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            border: "1.5px solid #c9a84c",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#c9a84c",
                            fontSize: ".78rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <input
                          style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontFamily: "'Cormorant Garamond',serif",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: "#f5f0e8",
                            width: "100%",
                          }}
                          value={ponto.titulo}
                          onChange={(e) =>
                            updatePonto(i, "titulo", e.target.value)
                          }
                        />
                      </div>
                      <div className="ponto-dev-wrap">
                        <label className="ss-label" style={{ marginBottom: 6 }}>
                          Desenvolvimento
                        </label>
                        <textarea
                          className="ss-editable"
                          rows={4}
                          value={ponto.desenvolvimento}
                          onChange={(e) =>
                            updatePonto(i, "desenvolvimento", e.target.value)
                          }
                        />
                        <div className="aplic-box">
                          <p
                            style={{
                              fontSize: ".7rem",
                              fontWeight: 700,
                              color: "#c9a84c",
                              textTransform: "uppercase",
                              letterSpacing: ".08em",
                              marginBottom: 6,
                            }}
                          >
                            ✦ Aplicação Prática
                          </p>
                          <textarea
                            style={{
                              width: "100%",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: ".85rem",
                              color: "#374151",
                              lineHeight: 1.75,
                              resize: "vertical",
                              fontFamily: "'Source Sans 3',sans-serif",
                              fontStyle: "italic",
                            }}
                            rows={2}
                            value={ponto.aplicacao}
                            onChange={(e) =>
                              updatePonto(i, "aplicacao", e.target.value)
                            }
                          />
                        </div>
                        {ponto.versiculoApoio && (
                          <p
                            style={{
                              marginTop: 10,
                              fontSize: ".78rem",
                              color: "#9b9690",
                              fontStyle: "italic",
                            }}
                          >
                            📖 {ponto.versiculoApoio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Conclusion */}
                  <div>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#1a2744",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ color: "#c9a84c", fontSize: ".85rem" }}>◆</span>
                      VI. Conclusão e Apelo
                    </h3>
                    <textarea
                      className="ss-editable"
                      rows={5}
                      value={data.conclusao}
                      onChange={(e) =>
                        setEditedData((d) =>
                          d ? { ...d, conclusao: e.target.value } : d
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* ─── Tab 2: Outline ─── */}
              {activeTab === "esboco" && (
                <div style={{ padding: "28px" }}>
                  <div style={{ marginBottom: 20 }}>
                    <h2
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: "1.7rem",
                        fontWeight: 700,
                        color: "#1a2744",
                        marginBottom: 4,
                      }}
                    >
                      {data.tituloFormatado}
                    </h2>
                    <p
                      style={{
                        fontSize: ".82rem",
                        color: "#c9a84c",
                        fontWeight: 600,
                      }}
                    >
                      {input.referencia}
                      {input.objetivo ? ` · ${input.objetivo}` : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#f9f7f3",
                      border: "1.5px solid #e5e0d5",
                      borderRadius: 10,
                      padding: "22px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <p className="ss-label" style={{ marginBottom: 0 }}>
                        Esboço de Púlpito — Editável
                      </p>
                      <span
                        style={{
                          fontSize: ".7rem",
                          color: "#b0aba2",
                          fontStyle: "italic",
                        }}
                      >
                        ✎ Clique para editar
                      </span>
                    </div>
                    <textarea
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontFamily: "'Courier New',monospace",
                        fontSize: ".88rem",
                        color: "#1a2744",
                        lineHeight: 1.9,
                        resize: "none",
                        minHeight: 520,
                      }}
                      value={data.esboco?.join("\n") || ""}
                      onChange={(e) =>
                        setEditedData((d) =>
                          d
                            ? { ...d, esboco: e.target.value.split("\n") }
                            : d
                        )
                      }
                      rows={Math.max(24, (data.esboco?.length || 0) + 4)}
                    />
                  </div>
                </div>
              )}

              {/* ─── Tab 3: Slides ─── */}
              {activeTab === "slides" && (
                <div style={{ padding: "22px 24px 28px" }}>
                  {/* Theme selector */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="ss-label"
                      style={{ marginBottom: 0, flexShrink: 0 }}
                    >
                      Estilo Visual:
                    </span>
                    {Object.values(THEMES).map((t) => (
                      <button
                        key={t.key}
                        className="ss-theme-pill"
                        onClick={() => setSlideTheme(t.key)}
                        style={{
                          background:
                            slideTheme === t.key ? "#1a2744" : "white",
                          color: slideTheme === t.key ? "#f5f0e8" : "#8b8680",
                          borderColor:
                            slideTheme === t.key ? "#1a2744" : "#e2ddd5",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: ".75rem",
                        color: "#b0aba2",
                      }}
                    >
                      {slideIndex + 1} / {currentSlides.length}
                    </span>
                  </div>

                  {/* Main Slide */}
                  <SlideViewer
                    slide={currentSlides[slideIndex]}
                    theme={slideTheme}
                    onChange={updateSlide}
                  />

                  {/* Navigation */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 16,
                    }}
                  >
                    <button
                      className="ss-btn-outline"
                      onClick={() =>
                        setSlideIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={slideIndex === 0}
                      style={{ padding: "8px 18px", fontSize: ".8rem" }}
                    >
                      ← Anterior
                    </button>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {currentSlides.map((_, i) => (
                        <button
                          key={i}
                          className="ss-dot-nav"
                          onClick={() => setSlideIndex(i)}
                          style={{
                            background:
                              i === slideIndex ? "#1a2744" : "#e2ddd5",
                            width: i === slideIndex ? 22 : 8,
                            height: 8,
                            borderRadius: i === slideIndex ? 4 : "50%",
                          }}
                        />
                      ))}
                    </div>

                    <button
                      className="ss-btn-outline"
                      onClick={() =>
                        setSlideIndex((i) =>
                          Math.min(currentSlides.length - 1, i + 1)
                        )
                      }
                      disabled={slideIndex === currentSlides.length - 1}
                      style={{ padding: "8px 18px", fontSize: ".8rem" }}
                    >
                      Próximo →
                    </button>
                  </div>

                  {/* Filmstrip */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))",
                      gap: 8,
                      marginTop: 18,
                    }}
                  >
                    {currentSlides.map((slide, i) => (
                      <SlideThumb
                        key={i}
                        slide={slide}
                        theme={slideTheme}
                        active={i === slideIndex}
                        onClick={() => setSlideIndex(i)}
                      />
                    ))}
                  </div>

                  {/* Edit hint */}
                  <p
                    style={{
                      marginTop: 14,
                      fontSize: ".75rem",
                      color: "#b0aba2",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    ✎ Clique diretamente no slide para editar qualquer texto
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          fontSize: ".72rem",
          color: "#c0bbb5",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          borderTop: "1px solid #e5e0d5",
        }}
      >
        SermonStudio AI &nbsp;·&nbsp; Ferramenta Ministerial &nbsp;·&nbsp;
        Construído com Inteligência Artificial Teológica
      </footer>
    </div>
  );
}
