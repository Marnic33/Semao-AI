import { useState, useEffect, useRef, useCallback } from "react";
import { gerarPDFEsboco } from "./pdfExport.js";
import { gerarPPTX } from "./pptxExport.js";
import { LIVROS_AT, LIVROS_NT } from "./bibleData.js";

/* ─────────────────────────────────────────────────────────────────────────────
   THEMES — 5 estilos visuais de slides
───────────────────────────────────────────────────────────────────────────── */
const THEMES = {
  tradicional: {
    key: "tradicional", label: "Tradicional",
    slideBg: "linear-gradient(145deg,#1a2744 0%,#0d1829 100%)",
    titleColor: "#f5f0e8", contentColor: "#c9a84c", accentColor: "#c9a84c",
    subColor: "rgba(245,240,232,0.55)", titleFont: "'Cormorant Garamond',serif",
    bodyFont: "'Source Sans 3',sans-serif", titleWeight: "700", bodyWeight: "400",
    bodyStyle: "italic", borderDecor: "1px solid rgba(201,168,76,0.28)",
    thumbBg: "#1a2744", thumbText: "#f5f0e8", thumbAccent: "#c9a84c",
  },
  moderno: {
    key: "moderno", label: "Minimalista",
    slideBg: "#f8f9fa", titleColor: "#0f172a", contentColor: "#374151",
    accentColor: "#1d4ed8", subColor: "#1d4ed8", titleFont: "'DM Sans',sans-serif",
    bodyFont: "'DM Sans',sans-serif", titleWeight: "700", bodyWeight: "400",
    bodyStyle: "normal", borderDecor: "none", borderAccent: "5px solid #1d4ed8",
    thumbBg: "#f8f9fa", thumbText: "#0f172a", thumbAccent: "#1d4ed8",
  },
  jovem: {
    key: "jovem", label: "Impactante",
    slideBg: "#09090b", titleColor: "#ffffff", contentColor: "#fb923c",
    accentColor: "#fb923c", subColor: "rgba(255,255,255,0.45)",
    titleFont: "'Montserrat',sans-serif", bodyFont: "'Montserrat',sans-serif",
    titleWeight: "900", bodyWeight: "700", bodyStyle: "normal", borderDecor: "none",
    glow: "radial-gradient(ellipse at 20% 50%,rgba(251,146,60,0.18) 0%,transparent 65%)",
    thumbBg: "#09090b", thumbText: "#ffffff", thumbAccent: "#fb923c",
  },
  natureza: {
    key: "natureza", label: "Natureza",
    slideBg: "linear-gradient(160deg,#134e2a 0%,#0a2e1a 100%)",
    titleColor: "#f0fdf4", contentColor: "#86efac", accentColor: "#4ade80",
    subColor: "rgba(240,253,244,0.5)", titleFont: "'Cormorant Garamond',serif",
    bodyFont: "'Source Sans 3',sans-serif", titleWeight: "700", bodyWeight: "400",
    bodyStyle: "italic", borderDecor: "1px solid rgba(74,222,128,0.25)",
    thumbBg: "#134e2a", thumbText: "#f0fdf4", thumbAccent: "#4ade80",
  },
  purpura: {
    key: "purpura", label: "Púrpura Real",
    slideBg: "linear-gradient(145deg,#3b0764 0%,#1e0438 100%)",
    titleColor: "#faf5ff", contentColor: "#d8b4fe", accentColor: "#a855f7",
    subColor: "rgba(250,245,255,0.5)", titleFont: "'Cormorant Garamond',serif",
    bodyFont: "'Source Sans 3',sans-serif", titleWeight: "700", bodyWeight: "400",
    bodyStyle: "italic", borderDecor: "1px solid rgba(168,85,247,0.3)",
    glow: "radial-gradient(ellipse at 80% 20%,rgba(168,85,247,0.2) 0%,transparent 60%)",
    thumbBg: "#3b0764", thumbText: "#faf5ff", thumbAccent: "#a855f7",
  },
};

const QUICK_EXAMPLES = [
  { tema: "A Paz que Excede o Entendimento", referencia: "Filipenses 4:6-7", objetivo: "Consolar a Igreja", publicoTom: "Igreja Geral - Solene" },
  { tema: "Identidade em Cristo", referencia: "2 Coríntios 5:17", objetivo: "Ensino Teológico", publicoTom: "Jovens - Dinâmico" },
  { tema: "O Pai que Corre ao Encontro do Filho", referencia: "Lucas 15:11-32", objetivo: "Apelo à Conversão", publicoTom: "Evangelístico - Apelo" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function buildSlides(data, referencia, publicoTom) {
  const slides = [];
  slides.push({ id: 0, tipo: "titulo", titulo: data.tituloFormatado, conteudo: referencia, subtexto: publicoTom || "" });
  slides.push({ id: 1, tipo: "escritura", titulo: "📖 " + referencia, conteudo: data.versiculoChave || "", subtexto: "Texto-base do Sermão" });
  data.pontosPrincipais.forEach((ponto, i) => {
    slides.push({ id: 2 + i * 2, tipo: "ponto", titulo: `${i + 1}. ${ponto.titulo}`, conteudo: ponto.frasePrincipal || ponto.aplicacao.slice(0, 120), subtexto: "" });
    if (ponto.versiculoApoio) slides.push({ id: 3 + i * 2, tipo: "citacao", titulo: "Palavra de Apoio", conteudo: ponto.versiculoApoio, subtexto: "" });
  });
  slides.push({ id: slides.length, tipo: "conclusao", titulo: "Conclusão", conteudo: data.fraseConclusao || data.conclusao.split(".").slice(0, 2).join(".") + ".", subtexto: referencia });
  return slides;
}

function saveToHistory(input, data) {
  try {
    const history = JSON.parse(localStorage.getItem("sermao_history") || "[]");
    const entry = { id: Date.now(), date: new Date().toISOString(), input, data };
    history.unshift(entry);
    localStorage.setItem("sermao_history", JSON.stringify(history.slice(0, 20))); // máx 20
  } catch {}
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem("sermao_history") || "[]"); } catch { return []; }
}

function deleteFromHistory(id) {
  try {
    const history = loadHistory().filter(h => h.id !== id);
    localStorage.setItem("sermao_history", JSON.stringify(history));
  } catch {}
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function buildOutlineExportHtml(data, input) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${data.tituloFormatado}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Source Sans 3',sans-serif;background:#fff;color:#1a2744;max-width:800px;margin:40px auto;padding:48px;line-height:1.75}@media print{body{margin:0;padding:32px}}h1{font-family:'Cormorant Garamond',serif;font-size:2.4rem;color:#1a2744;font-weight:700;margin-bottom:6px}.meta{color:#8b8680;font-size:.85rem;letter-spacing:.05em;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #c9a84c}h2{font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#c9a84c;letter-spacing:.03em;text-transform:uppercase;margin:36px 0 12px}.section{background:#f9f7f3;border-left:3px solid #c9a84c;padding:18px 22px;border-radius:0 6px 6px 0;margin-bottom:8px}.section p{color:#374151;font-size:.92rem;margin-bottom:.5rem}.ponto-header{background:#1a2744;color:#f5f0e8;padding:10px 18px;border-radius:6px 6px 0 0;display:flex;gap:12px;align-items:center;margin-top:20px}.ponto-num{width:28px;height:28px;border:1px solid #c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#c9a84c;font-size:.8rem;font-weight:700;flex-shrink:0}.ponto-titulo{font-family:'Cormorant Garamond',serif;font-size:1.1rem}.ponto-body{border:1px solid #e5dfd4;border-top:none;border-radius:0 0 6px 6px;padding:16px 18px}.aplicacao{background:#f0ece0;border-left:2px solid #c9a84c;padding:10px 14px;border-radius:0 4px 4px 0;margin-top:10px;font-style:italic;font-size:.88rem;color:#374151}.verso-apoio{margin-top:8px;font-size:.82rem;color:#8b8680}.esboco{font-family:'Courier New',monospace;font-size:.85rem;background:#f5f5f0;padding:24px;border-radius:6px;white-space:pre-wrap;line-height:1.9;color:#1a2744}.footer-line{margin-top:48px;padding-top:16px;border-top:1px solid #e5dfd4;text-align:center;font-size:.75rem;color:#b0aba2;letter-spacing:.08em}</style></head>
<body><h1>${data.tituloFormatado}</h1><div class="meta">📖 ${input.referencia}${input.objetivo?" &nbsp;·&nbsp; "+input.objetivo:""}${input.publicoTom?" &nbsp;·&nbsp; "+input.publicoTom:""}</div>
<h2>I. Introdução</h2><div class="section"><p>${data.introducao.replace(/\n/g,"</p><p>")}</p></div>
<h2>II. Contexto Teológico</h2><div class="section"><p>${data.contextoTeologico.replace(/\n/g,"</p><p>")}</p></div>
${data.pontosPrincipais.map((p,i)=>`<div class="ponto-header"><div class="ponto-num">${i+1}</div><div class="ponto-titulo">${p.titulo}</div></div><div class="ponto-body"><p style="font-size:.9rem;color:#374151">${p.desenvolvimento.replace(/\n/g,"<br>")}</p><div class="aplicacao">✦ Aplicação: ${p.aplicacao}</div>${p.versiculoApoio?`<div class="verso-apoio">📖 ${p.versiculoApoio}</div>`:""}</div>`).join("")}
<h2>V. Conclusão e Apelo</h2><div class="section"><p>${data.conclusao.replace(/\n/g,"</p><p>")}</p></div>
<h2>Esboço de Púlpito</h2><div class="esboco">${data.esboco.join("\n")}</div>
<div class="footer-line">SermonStudio AI &nbsp;·&nbsp; Ferramenta Ministerial</div></body></html>`;
}

function buildSlidesExportHtml(slides, theme, tituloFormatado) {
  const t = THEMES[theme];
  const slideHtml = slides.map((slide, idx) => {
    const isModerno = theme === "moderno";
    const borderLeft = isModerno ? `border-left:${t.borderAccent};` : "";
    const padLeft = isModerno ? "padding-left:90px;align-items:flex-start;text-align:left;" : "";
    return `<div class="slide" style="page-break-after:${idx<slides.length-1?"always":"auto"};background:${t.slideBg};position:relative;width:1280px;height:720px;display:flex;align-items:center;justify-content:center;${borderLeft}">
      ${t.glow?`<div style="position:absolute;inset:0;background:${t.glow}"></div>`:""}
      ${t.borderDecor!=="none"&&theme==="tradicional"?`<div style="position:absolute;inset:16px;border:${t.borderDecor};border-radius:3px;pointer-events:none"></div>`:""}
      ${t.borderDecor!=="none"&&theme==="natureza"?`<div style="position:absolute;inset:16px;border:${t.borderDecor};border-radius:3px;pointer-events:none"></div>`:""}
      ${t.borderDecor!=="none"&&theme==="purpura"?`<div style="position:absolute;inset:16px;border:${t.borderDecor};border-radius:3px;pointer-events:none"></div>`:""}
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px;width:100%;height:100%;${padLeft}">
        <div style="font-family:${t.bodyFont};font-size:13px;letter-spacing:5px;text-transform:uppercase;color:${t.accentColor};margin-bottom:18px;opacity:.9">${slide.tipo==="titulo"?"SERMÃO":slide.tipo==="escritura"?"ESCRITURA":slide.tipo==="ponto"?"PONTO PRINCIPAL":slide.tipo==="citacao"?"PALAVRA":"CONCLUSÃO"}</div>
        <div style="font-family:${t.titleFont};font-size:54px;font-weight:${t.titleWeight};color:${t.titleColor};line-height:1.15;margin-bottom:26px;max-width:1000px">${slide.titulo}</div>
        <div style="font-family:${t.titleFont};font-size:26px;font-weight:${t.bodyWeight};font-style:${t.bodyStyle};color:${t.contentColor};line-height:1.65;max-width:900px">${slide.conteudo}</div>
        ${slide.subtexto?`<div style="font-family:${t.bodyFont};font-size:16px;color:${t.subColor};margin-top:22px;letter-spacing:1px">${slide.subtexto}</div>`:""}
      </div></div>`;
  }).join("\n");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Apresentação — ${tituloFormatado}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=DM+Sans:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1c1c1e}.slide{margin:0 auto;display:block;overflow:hidden}@media print{body{background:none}.slide{margin:0;page-break-after:always;width:100%;height:100vh}}</style>
</head><body>${slideHtml}</body></html>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE VIEWER
───────────────────────────────────────────────────────────────────────────── */
function SlideViewer({ slide, theme, onChange, bgImage }) {
  const t = THEMES[theme];
  const isModerno = theme === "moderno";
  if (!slide) return null;

  return (
    <div style={{ background: t.slideBg, borderLeft: isModerno ? t.borderAccent : undefined, position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: isModerno ? "0 10px 10px 0" : "10px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>

      {/* Imagem de fundo DALL-E */}
      {bgImage && (
        <>
          <img src={bgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
          {/* Overlay escuro para legibilidade */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(0,0,0,0.68) 0%,rgba(0,0,0,0.45) 100%)", zIndex: 1 }} />
        </>
      )}

      {!bgImage && t.glow && <div style={{ position: "absolute", inset: 0, background: t.glow }} />}
      {!bgImage && (theme === "tradicional" || theme === "natureza" || theme === "purpura") && (
        <div style={{ position: "absolute", inset: "12px", border: t.borderDecor, borderRadius: "3px", pointerEvents: "none" }} />
      )}

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: isModerno ? "flex-start" : "center", textAlign: isModerno ? "left" : "center", padding: "6% 7%", width: "100%", height: "100%", justifyContent: "center" }}>
        <div style={{ fontFamily: t.bodyFont, fontSize: "clamp(7px,1vw,11px)", letterSpacing: "5px", textTransform: "uppercase", color: bgImage ? "#c9a84c" : t.accentColor, marginBottom: "3%", opacity: 0.9 }}>
          {slide.tipo === "titulo" ? "SERMÃO" : slide.tipo === "escritura" ? "ESCRITURA" : slide.tipo === "ponto" ? "PONTO PRINCIPAL" : slide.tipo === "citacao" ? "PALAVRA DE APOIO" : "CONCLUSÃO"}
        </div>
        <textarea style={{ background: "transparent", border: "none", outline: "none", resize: "none", width: "100%", fontFamily: t.titleFont, fontSize: "clamp(1rem,3.6vw,2.8rem)", fontWeight: t.titleWeight, color: bgImage ? "#ffffff" : t.titleColor, lineHeight: 1.18, marginBottom: "3%", cursor: "text", textAlign: isModerno ? "left" : "center", overflow: "hidden", textShadow: bgImage ? "0 2px 12px rgba(0,0,0,0.8)" : "none" }} rows={2} value={slide.titulo} onChange={(e) => onChange({ ...slide, titulo: e.target.value })} />
        <textarea style={{ background: "transparent", border: "none", outline: "none", resize: "none", width: "100%", maxWidth: isModerno ? "100%" : "80%", fontFamily: t.titleFont, fontSize: "clamp(0.6rem,1.9vw,1.3rem)", fontWeight: t.bodyWeight, fontStyle: t.bodyStyle, color: bgImage ? "rgba(255,255,255,0.9)" : t.contentColor, lineHeight: 1.65, cursor: "text", textAlign: isModerno ? "left" : "center", overflow: "hidden", textShadow: bgImage ? "0 1px 8px rgba(0,0,0,0.7)" : "none" }} rows={3} value={slide.conteudo} onChange={(e) => onChange({ ...slide, conteudo: e.target.value })} />
        {slide.subtexto !== undefined && (
          <input style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontFamily: t.bodyFont, fontSize: "clamp(0.5rem,1.1vw,0.85rem)", color: bgImage ? "rgba(255,255,255,0.6)" : t.subColor, marginTop: "3%", letterSpacing: "1px", textAlign: isModerno ? "left" : "center", cursor: "text" }} value={slide.subtexto} onChange={(e) => onChange({ ...slide, subtexto: e.target.value })} />
        )}
      </div>
    </div>
  );
}

function SlideThumb({ slide, theme, active, onClick }) {
  const t = THEMES[theme];
  const isModerno = theme === "moderno";
  return (
    <button onClick={onClick} style={{ display: "block", width: "100%", aspectRatio: "16/9", background: t.thumbBg, borderRadius: "5px", border: active ? `2px solid ${t.accentColor}` : "2px solid transparent", overflow: "hidden", position: "relative", cursor: "pointer", padding: "6px", transition: "all .2s", opacity: active ? 1 : 0.65, borderLeft: isModerno && !active ? `3px solid ${t.accentColor}` : undefined }}>
      <p style={{ color: t.thumbAccent, fontSize: "4px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px", fontFamily: "sans-serif" }}>{slide.tipo}</p>
      <p style={{ color: t.thumbText, fontSize: "5.5px", lineHeight: 1.3, fontFamily: "serif", fontWeight: "bold", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{slide.titulo.replace("📖 ", "")}</p>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HISTORY PANEL
───────────────────────────────────────────────────────────────────────────── */
function HistoryPanel({ onLoad, onClose }) {
  const [history, setHistory] = useState([]);
  useEffect(() => { setHistory(loadHistory()); }, []);

  const handleDelete = (id) => {
    deleteFromHistory(id);
    setHistory(h => h.filter(e => e.id !== id));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 680, maxHeight: "80vh", overflowY: "auto", padding: "28px 24px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a2744" }}>📚 Histórico de Sermões</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#9b9690" }}>✕</button>
        </div>
        {history.length === 0 ? (
          <p style={{ color: "#b0aba2", textAlign: "center", padding: "40px 0", fontSize: ".9rem" }}>Nenhum sermão salvo ainda.<br />Gere o primeiro e ele aparecerá aqui.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map(entry => (
              <div key={entry.id} style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1rem", color: "#1a2744", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.data.tituloFormatado}</p>
                  <p style={{ fontSize: ".75rem", color: "#9b9690" }}>📖 {entry.input.referencia} &nbsp;·&nbsp; {formatDate(entry.date)}</p>
                </div>
                <button onClick={() => { onLoad(entry); onClose(); }} style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: ".75rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Abrir</button>
                <button onClick={() => handleDelete(entry.id)} style={{ background: "none", border: "1px solid #e5e0d5", borderRadius: 7, padding: "7px 10px", fontSize: ".75rem", color: "#c0bbb5", cursor: "pointer", flexShrink: 0 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARE MODAL — com geração de PDF via jsPDF
───────────────────────────────────────────────────────────────────────────── */
function ShareModal({ data, input, onClose }) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

  const shareText = `✦ *${data.tituloFormatado}*\n📖 ${input.referencia}\n\n${data.pontosPrincipais.map((p, i) => `*${i + 1}. ${p.titulo}*\n${p.frasePrincipal}`).join("\n\n")}\n\n_Criado com SermonStudio AI_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const handleWhatsAppText = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      await new Promise(r => setTimeout(r, 80)); // allow UI update
      const doc = gerarPDFEsboco(data, input);
      const blob = doc.output("blob");
      const fileName = `${data.tituloFormatado.replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, "").trim().slice(0, 40)}.pdf`;
      setPdfBlob(blob);
      setPdfFileName(fileName);
      setPdfReady(true);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url; a.download = pdfFileName;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleWhatsAppPDF = () => {
    // 1. Baixa o PDF
    handleDownloadPDF();
    // 2. Após 1s abre o WhatsApp com mensagem orientando a anexar
    setTimeout(() => {
      const msg = `✦ *${data.tituloFormatado}*\n📖 ${input.referencia}\n\n📄 Segue o esboço completo em PDF (arquivo baixado no seu celular).\n\n_Criado com SermonStudio AI_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }, 1000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px 24px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a2744" }}>Compartilhar Sermão</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#9b9690" }}>✕</button>
        </div>

        {/* ── SEÇÃO PDF ── */}
        <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 12, padding: "18px", marginBottom: 16 }}>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>📄 Exportar como PDF</p>

          {!pdfReady ? (
            <button
              onClick={handleGeneratePDF}
              disabled={pdfLoading}
              style={{ width: "100%", background: "#1a2744", color: "#f5f0e8", border: "none", borderRadius: 9, padding: "13px", fontWeight: 700, fontSize: ".88rem", cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Source Sans 3',sans-serif" }}
            >
              {pdfLoading ? (
                <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Gerando PDF...</>
              ) : (
                <><span style={{ color: "#c9a84c" }}>⬇</span> Gerar PDF do Esboço</>
              )}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Success badge */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.2rem" }}>✅</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: ".82rem", color: "#166534" }}>PDF pronto!</p>
                  <p style={{ fontSize: ".72rem", color: "#15803d" }}>{pdfFileName}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={handleDownloadPDF} style={{ background: "#1a2744", color: "#f5f0e8", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                  ⬇ Baixar PDF
                </button>
                <button onClick={handleWhatsAppPDF} style={{ background: "#25d366", color: "white", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                  💬 PDF + WhatsApp
                </button>
              </div>

              <p style={{ fontSize: ".72rem", color: "#b0aba2", textAlign: "center", fontStyle: "italic", lineHeight: 1.5 }}>
                "PDF + WhatsApp" baixa o arquivo e abre o WhatsApp com uma mensagem pronta. Você só anexa o PDF e envia! 📎
              </p>

              <button onClick={() => { setPdfReady(false); setPdfBlob(null); }} style={{ background: "none", border: "1px solid #e5e0d5", borderRadius: 7, padding: "7px", fontSize: ".75rem", color: "#9b9690", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                Gerar novamente
              </button>
            </div>
          )}
        </div>

        {/* ── SEÇÃO TEXTO ── */}
        <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 12, padding: "18px" }}>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>💬 Compartilhar como Texto</p>
          <textarea readOnly style={{ width: "100%", background: "white", border: "1px solid #e5e0d5", borderRadius: 8, padding: "12px", fontFamily: "monospace", fontSize: ".78rem", lineHeight: 1.7, color: "#374151", resize: "none", height: 150 }} value={shareText} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <button onClick={handleWhatsAppText} style={{ background: "#25d366", color: "white", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
              💬 WhatsApp
            </button>
            <button onClick={handleCopy} style={{ background: copied ? "#1a2744" : "white", color: copied ? "#c9a84c" : "#374151", border: "1px solid #e5e0d5", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", transition: "all .2s" }}>
              {copied ? "✓ Copiado!" : "📋 Copiar"}
            </button>
          </div>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUGGESTION MODAL — IA sugere temas de sermão
───────────────────────────────────────────────────────────────────────────── */
const OCASIOES = [
  "Domingo comum", "Ano Novo", "Páscoa", "Dia das Mães", "Dia dos Pais",
  "Pentecostes", "Natal", "Semana Santa", "Culto de Jovens", "Culto Evangelístico",
  "Retiro Espiritual", "Aniversário da Igreja", "Culto de Ceia", "Missões",
];

function SuggestionModal({ userEmail = "", onSelect, onClose }) {
  const [contexto, setContexto] = useState("");
  const [ocasiao, setOcasiao] = useState("");
  const [publico, setPublico] = useState("");
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [error, setError] = useState("");

  const handleGerar = async () => {
    setLoading(true); setError(""); setSugestoes([]);
    const prompt = `Você é um assessor ministerial experiente. Sugira 6 temas de sermão em JSON puro (sem markdown, sem texto fora do JSON).

Contexto informado pelo pregador:
- Ocasião/Data: ${ocasiao || "Domingo regular"}
- Público-alvo: ${publico || "Igreja Geral"}
- Contexto extra: ${contexto || "Nenhum contexto adicional"}

Retorne APENAS este JSON com 6 sugestões variadas e relevantes:
[
  {
    "tema": "Título criativo e impactante do sermão",
    "referencia": "Livro Cap:vers-vers",
    "objetivo": "Objetivo claro da mensagem (máx 6 palavras)",
    "publicoTom": "Público - Tom",
    "justificativa": "Por que esta mensagem é relevante para este contexto (1 frase curta)"
  }
]

Varie os estilos: inclua temas doutrinários, narrativos, práticos e de apelo. APENAS JSON.`;

    try {
      const resp = await fetch("/api/sermon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      });
      const apiData = await resp.json();
      if (!resp.ok || apiData.error) throw new Error(apiData.error?.message || apiData.error || "Erro na API");
      const raw = apiData.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(clean);
      setSugestoes(Array.isArray(parsed) ? parsed : parsed.sugestoes || []);
    } catch (e) {
      setError("Erro ao gerar sugestões. Tente novamente.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", padding: "28px 24px 40px" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>✦ Sugestões de Pregação</h2>
            <p style={{ fontSize: ".8rem", color: "#9b9690", lineHeight: 1.5 }}>A IA sugere temas relevantes baseados no seu contexto ministerial.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#9b9690", flexShrink: 0, marginTop: 4 }}>✕</button>
        </div>

        {/* Filtros */}
        {sugestoes.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {/* Ocasião chips */}
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Ocasião / Data Especial</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {OCASIOES.map(oc => (
                  <button key={oc} onClick={() => setOcasiao(o => o === oc ? "" : oc)}
                    style={{ padding: "5px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .15s", background: ocasiao === oc ? "#1a2744" : "white", color: ocasiao === oc ? "#c9a84c" : "#8b8680", borderColor: ocasiao === oc ? "#1a2744" : "#e2ddd5", fontFamily: "'Source Sans 3',sans-serif" }}>
                    {oc}
                  </button>
                ))}
              </div>
            </div>

            {/* Público */}
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Público-Alvo</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {["Igreja Geral", "Jovens", "Crianças", "Casais", "Liderança", "Evangelístico", "Pequeno Grupo"].map(p => (
                  <button key={p} onClick={() => setPublico(v => v === p ? "" : p)}
                    style={{ padding: "5px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .15s", background: publico === p ? "#c9a84c" : "white", color: publico === p ? "#1a2744" : "#8b8680", borderColor: publico === p ? "#c9a84c" : "#e2ddd5", fontFamily: "'Source Sans 3',sans-serif" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Contexto livre */}
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Contexto Adicional <span style={{ fontWeight: 400, color: "#b0aba2", textTransform: "none" }}>(opcional)</span></p>
              <textarea
                style={{ width: "100%", background: "#f9f7f3", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "10px 13px", fontFamily: "'Source Sans 3',sans-serif", fontSize: ".85rem", color: "#1a2744", resize: "none", lineHeight: 1.6, outline: "none" }}
                rows={2}
                placeholder="Ex: A igreja está passando por um momento difícil, precisamos de mensagens de encorajamento..."
                value={contexto}
                onChange={e => setContexto(e.target.value)}
              />
            </div>

            {error && <p style={{ fontSize: ".82rem", color: "#b91c1c", background: "#fef2f2", padding: "10px 14px", borderRadius: 7, border: "1px solid #fecaca" }}>{error}</p>}

            <button onClick={handleGerar} disabled={loading}
              style={{ width: "100%", background: "#1a2744", color: "#f5f0e8", border: "none", borderRadius: 9, padding: "13px", fontWeight: 700, fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Source Sans 3',sans-serif", letterSpacing: ".05em" }}>
              {loading
                ? <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Consultando a IA...</>
                : <><span style={{ color: "#c9a84c", fontSize: "1rem" }}>✦</span> Gerar 6 Sugestões com IA</>}
            </button>
          </div>
        )}

        {/* Sugestões geradas */}
        {sugestoes.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em" }}>✦ {sugestoes.length} Sugestões Geradas — Clique para usar</p>
              <button onClick={() => setSugestoes([])} style={{ background: "none", border: "1px solid #e5e0d5", borderRadius: 6, padding: "4px 10px", fontSize: ".72rem", color: "#9b9690", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>Nova busca</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sugestoes.map((s, i) => (
                <button key={i} onClick={() => { onSelect({ tema: s.tema, referencia: s.referencia, objetivo: s.objetivo, publicoTom: s.publicoTom }); onClose(); }}
                  style={{ width: "100%", text: "left", background: "#f9f7f3", border: "1.5px solid #e5e0d5", borderRadius: 12, padding: "16px 18px", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "'Source Sans 3',sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e0d5"; e.currentTarget.style.background = "#f9f7f3"; }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, background: "#1a2744", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: ".8rem", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", fontWeight: 700, color: "#1a2744", marginBottom: 4, lineHeight: 1.3 }}>{s.tema}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ background: "#1a2744", color: "#c9a84c", fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>📖 {s.referencia}</span>
                        {s.publicoTom && <span style={{ background: "#f0ece0", color: "#8b8680", fontSize: ".68rem", padding: "2px 8px", borderRadius: 20 }}>{s.publicoTom}</span>}
                        {s.objetivo && <span style={{ background: "#f0ece0", color: "#8b8680", fontSize: ".68rem", padding: "2px 8px", borderRadius: 20 }}>{s.objetivo}</span>}
                      </div>
                      {s.justificativa && <p style={{ fontSize: ".78rem", color: "#9b9690", fontStyle: "italic", lineHeight: 1.5 }}>{s.justificativa}</p>}
                    </div>
                    <div style={{ color: "#c9a84c", fontSize: "1rem", flexShrink: 0, marginTop: 4 }}>→</div>
                  </div>
                </button>
              ))}
            </div>

            <p style={{ marginTop: 14, fontSize: ".75rem", color: "#b0aba2", textAlign: "center", fontStyle: "italic" }}>
              Clique em qualquer sugestão para preencher o painel automaticamente
            </p>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FULLSCREEN PROJECTION — projeta versículo/slide em tela cheia (telão)
───────────────────────────────────────────────────────────────────────────── */
function FullscreenProjection({ referencia, texto, theme = "tradicional", onClose }) {
  const t = THEMES[theme];

  useEffect(() => {
    // Tenta entrar em fullscreen nativo
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    // ESC fecha
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: t.slideBg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "5vw", cursor: "pointer",
      }}
    >
      {t.glow && <div style={{ position: "absolute", inset: 0, background: t.glow }} />}
      {(theme === "tradicional" || theme === "natureza" || theme === "purpura") && (
        <div style={{ position: "absolute", inset: "2vw", border: t.borderDecor, borderRadius: "6px", pointerEvents: "none" }} />
      )}

      {/* Botão fechar */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: "absolute", top: "3vh", right: "3vw", background: "rgba(255,255,255,0.1)", border: `1px solid ${t.accentColor}`, color: t.accentColor, borderRadius: 8, padding: "8px 16px", fontSize: "1rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", zIndex: 2 }}>
        ✕ Sair (ESC)
      </button>

      {/* Label */}
      <div style={{ position: "relative", zIndex: 1, fontFamily: t.bodyFont, fontSize: "clamp(14px,2vw,22px)", letterSpacing: "6px", textTransform: "uppercase", color: t.accentColor, marginBottom: "4vh", opacity: 0.9, textAlign: "center" }}>
        📖 Escritura
      </div>

      {/* Referência */}
      <div style={{ position: "relative", zIndex: 1, fontFamily: t.titleFont, fontSize: "clamp(36px,6vw,90px)", fontWeight: t.titleWeight, color: t.titleColor, lineHeight: 1.1, marginBottom: "5vh", textAlign: "center", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
        {referencia}
      </div>

      {/* Texto do versículo */}
      <div style={{ position: "relative", zIndex: 1, fontFamily: t.titleFont, fontSize: "clamp(20px,3.2vw,46px)", fontWeight: t.bodyWeight, fontStyle: t.bodyStyle, color: t.contentColor, lineHeight: 1.5, maxWidth: "85%", textAlign: "center", textShadow: "0 1px 12px rgba(0,0,0,0.25)" }}>
        "{texto}"
      </div>

      {/* Dica */}
      <div style={{ position: "absolute", bottom: "3vh", left: 0, right: 0, textAlign: "center", fontFamily: t.bodyFont, fontSize: "clamp(10px,1.2vw,14px)", color: t.subColor, opacity: 0.6 }}>
        Toque na tela ou pressione ESC para sair
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   VERSE POPUP — exibe versículo ao clicar em referência
───────────────────────────────────────────────────────────────────────────── */
function VersePopup({ referencia, userEmail, onClose, onAddToSlides }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVerse = async () => {
      setLoading(true); setError("");
      try {
        // Parse "Livro X:Y" ou "Livro X"
        const match = referencia.match(/^(\d?\s?\D+?)\s+(\d+)(?::(\d+(?:-\d+)?))?$/i);
        if (!match) throw new Error("Referência mal formatada");
        const [_, livro, capitulo, versiculo] = match;
        const resp = await fetch("/api/bible", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: userEmail,
            tipo: "passagem",
            livro: livro.trim(),
            capitulo,
            versiculo: versiculo || undefined,
          }),
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || "Versículo não encontrado");
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally { setLoading(false); }
    };
    fetchVerse();
  }, [referencia, userEmail]);

  const handleCopy = () => {
    if (!data) return;
    const txt = `"${data.textoCompleto}" — ${data.referencia}`;
    navigator.clipboard.writeText(txt);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const txt = `📖 *${data.referencia}*\n\n"${data.textoCompleto}"\n\n_Compartilhado via SermonStudio AI_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", padding: "26px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: ".7rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>📖 Escritura</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a2744" }}>{data?.referencia || referencia}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#9b9690" }}>✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <span style={{ display: "inline-block", width: 24, height: 24, border: "3px solid #c9a84c", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            <p style={{ marginTop: 10, fontSize: ".8rem", color: "#9b9690" }}>Buscando passagem...</p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "12px 16px", borderRadius: 8, lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        {/* Texto */}
        {data && (
          <>
            <div style={{ background: "#f9f7f3", borderLeft: "3px solid #c9a84c", borderRadius: "0 8px 8px 0", padding: "16px 20px", marginBottom: 16 }}>
              {data.versiculos.length > 1 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.versiculos.map((v, i) => (
                    <p key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", color: "#374151", lineHeight: 1.75 }}>
                      <sup style={{ color: "#c9a84c", fontWeight: 700, fontSize: ".7rem", marginRight: 4 }}>{v.versiculo}</sup>
                      {v.texto}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", color: "#374151", lineHeight: 1.8, fontStyle: "italic" }}>
                  "{data.textoCompleto}"
                </p>
              )}
              <p style={{ marginTop: 12, fontSize: ".7rem", color: "#b0aba2", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {data.traducao}
              </p>
            </div>

            {/* Ações */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <button onClick={() => onAddToSlides(data)}
                style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                ▦ Adicionar aos Slides
              </button>
              <button onClick={handleWhatsApp}
                style={{ background: "#25d366", color: "white", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                💬 WhatsApp
              </button>
            </div>
            <button onClick={handleCopy}
              style={{ width: "100%", background: "white", color: "#374151", border: "1px solid #e5e0d5", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: ".75rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
              📋 Copiar texto
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BIBLE SECTION — Bíblia integrada com navegação
───────────────────────────────────────────────────────────────────────────── */
function BibleSection({ userEmail, onAddVerseToSlides, onProject }) {
  const [nivel, setNivel] = useState("livros"); // livros | capitulos | versiculos
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [capituloSelecionado, setCapituloSelecionado] = useState(null);
  const [versiculos, setVersiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [versiculoSelecionado, setVersiculoSelecionado] = useState(null);
  const [filtroLivro, setFiltroLivro] = useState("");

  const handleSelecionarLivro = (livro) => {
    setLivroSelecionado(livro);
    setCapituloSelecionado(null);
    setVersiculos([]);
    setNivel("capitulos");
  };

  const handleSelecionarCapitulo = async (cap) => {
    setCapituloSelecionado(cap);
    setNivel("versiculos");
    setLoading(true); setError(""); setVersiculos([]);
    try {
      const resp = await fetch("/api/bible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          tipo: "capitulo",
          livro: livroSelecionado.nome,
          capitulo: cap,
        }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Capítulo não encontrado");
      setVersiculos(result.versiculos || []);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleVoltar = () => {
    if (nivel === "versiculos") {
      setNivel("capitulos");
      setVersiculos([]);
      setCapituloSelecionado(null);
    } else if (nivel === "capitulos") {
      setNivel("livros");
      setLivroSelecionado(null);
    }
  };

  // ── Tela de livros ──
  if (nivel === "livros") {
    const filtrar = (livros) => {
      const q = filtroLivro.trim().toLowerCase();
      if (!q) return livros;
      return livros.filter(l => l.nome.toLowerCase().includes(q) || l.abrev.includes(q));
    };

    return (
      <div style={{ padding: "24px 28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2744", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            📖 Bíblia Sagrada
          </h3>
          <p style={{ fontSize: ".8rem", color: "#9b9690", lineHeight: 1.5 }}>
            Tradução Almeida · Navegue pelos livros ou clique em qualquer versículo para adicionar aos slides.
          </p>
        </div>

        {/* Busca */}
        <input
          style={{ width: "100%", background: "#f9f7f3", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "10px 14px", fontFamily: "'Source Sans 3',sans-serif", fontSize: ".85rem", color: "#1a2744", outline: "none", marginBottom: 16 }}
          placeholder="🔍 Filtrar livros..."
          value={filtroLivro}
          onChange={e => setFiltroLivro(e.target.value)}
        />

        {/* Antigo Testamento */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
            ✦ Antigo Testamento <span style={{ color: "#b0aba2", fontWeight: 400 }}>({filtrar(LIVROS_AT).length} livros)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 7 }}>
            {filtrar(LIVROS_AT).map(livro => (
              <button key={livro.abrev} onClick={() => handleSelecionarLivro(livro)}
                style={{ background: "#f9f7f3", border: "1.5px solid #e5e0d5", borderRadius: 7, padding: "8px 10px", fontSize: ".78rem", color: "#1a2744", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "'Source Sans 3',sans-serif", fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e0d5"; e.currentTarget.style.background = "#f9f7f3"; }}>
                {livro.nome} <span style={{ color: "#b0aba2", fontWeight: 400, fontSize: ".68rem" }}>· {livro.capitulos}c</span>
              </button>
            ))}
          </div>
        </div>

        {/* Novo Testamento */}
        <div>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
            ✦ Novo Testamento <span style={{ color: "#b0aba2", fontWeight: 400 }}>({filtrar(LIVROS_NT).length} livros)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 7 }}>
            {filtrar(LIVROS_NT).map(livro => (
              <button key={livro.abrev} onClick={() => handleSelecionarLivro(livro)}
                style={{ background: "#f9f7f3", border: "1.5px solid #e5e0d5", borderRadius: 7, padding: "8px 10px", fontSize: ".78rem", color: "#1a2744", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "'Source Sans 3',sans-serif", fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e0d5"; e.currentTarget.style.background = "#f9f7f3"; }}>
                {livro.nome} <span style={{ color: "#b0aba2", fontWeight: 400, fontSize: ".68rem" }}>· {livro.capitulos}c</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tela de capítulos ──
  if (nivel === "capitulos") {
    return (
      <div style={{ padding: "24px 28px 32px" }}>
        {/* Header com voltar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={handleVoltar} style={{ background: "white", border: "1.5px solid #e5e0d5", borderRadius: 8, padding: "6px 12px", fontSize: ".8rem", cursor: "pointer", color: "#374151", fontWeight: 600, fontFamily: "'Source Sans 3',sans-serif" }}>← Livros</button>
          <div>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a2744" }}>{livroSelecionado.nome}</h3>
            <p style={{ fontSize: ".75rem", color: "#9b9690" }}>{livroSelecionado.capitulos} capítulos · Selecione um capítulo</p>
          </div>
        </div>

        {/* Grid de capítulos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(50px,1fr))", gap: 6 }}>
          {Array.from({ length: livroSelecionado.capitulos }, (_, i) => i + 1).map(cap => (
            <button key={cap} onClick={() => handleSelecionarCapitulo(cap)}
              style={{ aspectRatio: "1", background: "#1a2744", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 7, fontSize: ".88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#22305c"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1a2744"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {cap}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Tela de versículos ──
  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header com voltar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={handleVoltar} style={{ background: "white", border: "1.5px solid #e5e0d5", borderRadius: 8, padding: "6px 12px", fontSize: ".8rem", cursor: "pointer", color: "#374151", fontWeight: 600, fontFamily: "'Source Sans 3',sans-serif" }}>← Capítulos</button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a2744" }}>
            {livroSelecionado.nome} <span style={{ color: "#c9a84c" }}>{capituloSelecionado}</span>
          </h3>
          <p style={{ fontSize: ".75rem", color: "#9b9690" }}>Clique em qualquer versículo para usar</p>
        </div>
        <button onClick={() => onAddVerseToSlides({
          referencia: `${livroSelecionado.nome} ${capituloSelecionado}`,
          textoCompleto: versiculos.map(v => v.texto).join(" "),
          versiculos,
        })}
          disabled={loading || versiculos.length === 0}
          style={{ background: "#c9a84c", color: "#1a2744", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: ".75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", opacity: (loading || versiculos.length === 0) ? 0.5 : 1 }}>
          ▦ Capítulo inteiro
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <span style={{ display: "inline-block", width: 28, height: 28, border: "3px solid #c9a84c", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <p style={{ marginTop: 12, fontSize: ".85rem", color: "#9b9690" }}>Carregando capítulo...</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "12px 16px", borderRadius: 8, lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {/* Versículos */}
      {!loading && versiculos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {versiculos.map(v => (
            <button key={v.versiculo} onClick={() => setVersiculoSelecionado(v)}
              style={{ background: "#f9f7f3", border: "1.5px solid #e5e0d5", borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start", transition: "all .15s", fontFamily: "'Source Sans 3',sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e0d5"; e.currentTarget.style.background = "#f9f7f3"; }}>
              <div style={{ width: 32, height: 32, background: "#1a2744", color: "#c9a84c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, flexShrink: 0 }}>
                {v.versiculo}
              </div>
              <p style={{ flex: 1, fontFamily: "'Cormorant Garamond',serif", fontSize: ".95rem", color: "#374151", lineHeight: 1.65 }}>
                {v.texto}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Popup ao clicar em versículo */}
      {versiculoSelecionado && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setVersiculoSelecionado(null)}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: ".7rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>📖 Versículo</p>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2744" }}>
                  {livroSelecionado.nome} {capituloSelecionado}:{versiculoSelecionado.versiculo}
                </h3>
              </div>
              <button onClick={() => setVersiculoSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#9b9690" }}>✕</button>
            </div>
            <div style={{ background: "#f9f7f3", borderLeft: "3px solid #c9a84c", borderRadius: "0 8px 8px 0", padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", color: "#374151", lineHeight: 1.75, fontStyle: "italic" }}>
                "{versiculoSelecionado.texto}"
              </p>
            </div>
            {/* Botão Projetar Agora */}
            <button onClick={() => {
              onProject({
                referencia: `${livroSelecionado.nome} ${capituloSelecionado}:${versiculoSelecionado.versiculo}`,
                texto: versiculoSelecionado.texto,
              });
              setVersiculoSelecionado(null);
            }}
              style={{ width: "100%", background: "linear-gradient(135deg,#c9a84c,#d4b55e)", color: "#1a2744", border: "none", borderRadius: 8, padding: "13px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              🖥 Projetar Agora (Tela Cheia)
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => {
                onAddVerseToSlides({
                  referencia: `${livroSelecionado.nome} ${capituloSelecionado}:${versiculoSelecionado.versiculo}`,
                  textoCompleto: versiculoSelecionado.texto,
                  versiculos: [versiculoSelecionado],
                });
                setVersiculoSelecionado(null);
              }}
                style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                ▦ Adicionar aos Slides
              </button>
              <button onClick={() => {
                const txt = `📖 *${livroSelecionado.nome} ${capituloSelecionado}:${versiculoSelecionado.versiculo}*\n\n"${versiculoSelecionado.texto}"\n\n_SermonStudio AI_`;
                window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
              }}
                style={{ background: "#25d366", color: "white", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AUDIO SECTION — Narração com OpenAI TTS
───────────────────────────────────────────────────────────────────────────── */
const VOZES = [
  { id: "onyx",   label: "Onyx",   desc: "Grave e solene — ideal para pregações formais", emoji: "🎙" },
  { id: "echo",   label: "Echo",   desc: "Masculino claro — ótimo para ensino",           emoji: "📣" },
  { id: "fable",  label: "Fable",  desc: "Narrativo e envolvente — para histórias",       emoji: "📖" },
  { id: "nova",   label: "Nova",   desc: "Feminino suave — caloroso e acolhedor",         emoji: "✨" },
  { id: "alloy",  label: "Alloy",  desc: "Neutro e profissional — versátil",              emoji: "🔊" },
  { id: "shimmer",label: "Shimmer",desc: "Feminino expressivo — dinâmico e jovem",        emoji: "🌟" },
];

function buildSermonScript(data, input) {
  const pts = data.pontosPrincipais.map((p, i) =>
    `Ponto ${i + 1}: ${p.titulo}.\n${p.desenvolvimento.replace(/\n\n/g, " ")}\nAplicação: ${p.aplicacao}`
  ).join("\n\n");

  return `${data.tituloFormatado}.
Texto bíblico: ${input.referencia}.

${data.introducao.replace(/\n\n/g, " ")}

Contexto teológico: ${data.contextoTeologico.replace(/\n\n/g, " ")}

${pts}

Conclusão: ${data.conclusao.replace(/\n\n/g, " ")}`;
}

function AudioSection({ data, input, userEmail, setGlobalAudio, setGlobalAudioPlaying, globalAudioRef }) {
  const [modo, setModo] = useState("narracao"); // narracao | podcast
  const [voz, setVoz] = useState("onyx");
  const [velocidade, setVelocidade] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [audioLabel, setAudioLabel] = useState("");
  const [error, setError] = useState("");
  const [secao, setSecao] = useState("completo");
  const audioRef = useRef(null);

  // Podcast state
  const [vozHost, setVozHost] = useState("nova");
  const [vozConvidado, setVozConvidado] = useState("onyx");
  const [roteiro, setRoteiro] = useState(null);
  const [podcastProgress, setPodcastProgress] = useState({ current: 0, total: 0, label: "" });
  const [podcastSegments, setPodcastSegments] = useState([]); // [{locutor, texto, audio}]
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const podcastAudioRef = useRef(null);
  const podcastIndexRef = useRef(0);

  const SECOES = [
    { id: "completo",   label: "Sermão Completo",  icon: "📖" },
    { id: "introducao", label: "Introdução",        icon: "🎬" },
    { id: "pontos",     label: "Pontos Principais", icon: "✦" },
    { id: "conclusao",  label: "Conclusão",         icon: "🎯" },
  ];

  const buildTexto = () => {
    switch (secao) {
      case "introducao":
        return `${data.tituloFormatado}. ${data.introducao.replace(/\n\n/g, " ")}`;
      case "pontos":
        return data.pontosPrincipais.map((p, i) =>
          `Ponto ${i + 1}: ${p.titulo}. ${p.desenvolvimento.replace(/\n\n/g, " ")} Aplicação: ${p.aplicacao}`
        ).join(" ");
      case "conclusao":
        return `Conclusão. ${data.conclusao.replace(/\n\n/g, " ")}`;
      default:
        return buildSermonScript(data, input);
    }
  };

  const handleGerar = async () => {
    setLoading(true); setError(""); setAudioSrc(null);
    const texto = buildTexto();
    try {
      const resp = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, text: texto, voice: voz, speed: velocidade }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Erro ao gerar áudio");
      setAudioSrc(result.audio);
      const label = `${data.tituloFormatado} — ${SECOES.find(s => s.id === secao)?.label}`;
      setAudioLabel(label);
      // Manda para o player global
      setGlobalAudio({ src: result.audio, label, type: "narracao" });
      setGlobalAudioPlaying(true);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!audioSrc) return;
    const a = document.createElement("a");
    a.href = audioSrc;
    a.download = `${audioLabel.replace(/[^\w\s]/g, "").trim().slice(0, 60)}.mp3`;
    a.click();
  };

  const handleWhatsApp = () => {
    handleDownload();
    setTimeout(() => {
      const msg = `🎙 *${data.tituloFormatado}*\n📖 ${input.referencia}\n\n🎧 Narração do sermão em áudio (MP3 baixado no seu dispositivo).\n\n_Criado com SermonStudio AI_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }, 800);
  };

  const charCount = buildTexto().length;
  const estimatedMins = Math.ceil((charCount / 15) / 60); // ~15 chars/seg

  /* ── PODCAST: gera roteiro + áudios ── */
  const handleGerarPodcast = async () => {
    setLoading(true); setError(""); setRoteiro(null); setPodcastSegments([]);
    setPodcastProgress({ current: 0, total: 0, label: "Criando roteiro..." });

    try {
      // 1) Gera o roteiro do diálogo
      const sermaoResumo = {
        tituloFormatado: data.tituloFormatado,
        referencia: input.referencia,
        introducao: data.introducao.replace(/\n\n/g, " ").slice(0, 600),
        pontos: data.pontosPrincipais.map((p, i) => `${i + 1}. ${p.titulo}: ${p.frasePrincipal}`).join(" "),
        conclusao: data.conclusao.replace(/\n\n/g, " ").slice(0, 400),
      };
      const respR = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, etapa: "roteiro", sermao: sermaoResumo }),
      });
      const dataR = await respR.json();
      if (!respR.ok) throw new Error(dataR.error || "Erro ao gerar roteiro");
      setRoteiro(dataR);

      // 2) Gera o áudio de cada fala em sequência
      const falas = dataR.falas || [];
      setPodcastProgress({ current: 0, total: falas.length, label: "Gravando vozes..." });
      const segments = [];
      for (let i = 0; i < falas.length; i++) {
        const fala = falas[i];
        setPodcastProgress({ current: i + 1, total: falas.length, label: `${fala.locutor === "host" ? "Ana" : "Pedro"}: ${fala.texto.slice(0, 30)}...` });
        const respA = await fetch("/api/podcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email: userEmail, etapa: "audio", texto: fala.texto, locutor: fala.locutor, vozHost, vozConvidado }),
        });
        const dataA = await respA.json();
        if (respA.ok && dataA.audio) {
          segments.push({ ...fala, audio: dataA.audio });
          setPodcastSegments([...segments]);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Reprodução sequencial do podcast — usa player global (sobrevive a trocas de aba)
  const playPodcast = (startIdx = 0) => {
    if (!podcastSegments.length) return;
    podcastIndexRef.current = startIdx;
    setPodcastPlaying(true);
    playGlobalSegment(startIdx);
  };

  const playGlobalSegment = (idx) => {
    if (idx >= podcastSegments.length) {
      setPodcastPlaying(false);
      setGlobalAudioPlaying(false);
      return;
    }
    const seg = podcastSegments[idx];
    const label = `${roteiro?.titulo || data.tituloFormatado} — ${seg.locutor === "host" ? "Ana" : "Pedro"} (${idx + 1}/${podcastSegments.length})`;
    setGlobalAudio({
      src: seg.audio,
      label,
      type: "podcast",
      onEnded: () => {
        const next = idx + 1;
        podcastIndexRef.current = next;
        playGlobalSegment(next);
      },
    });
    setGlobalAudioPlaying(true);
  };

  const stopPodcast = () => {
    setPodcastPlaying(false);
    setGlobalAudioPlaying(false);
  };

  // Junta todos os segmentos MP3 num único arquivo para baixar
  const [baixandoPodcast, setBaixandoPodcast] = useState(false);
  const buildPodcastBlob = async () => {
    // Converte cada data-uri base64 em bytes e concatena
    const buffers = [];
    for (const seg of podcastSegments) {
      const base64 = seg.audio.split(",")[1];
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      buffers.push(bytes);
    }
    return new Blob(buffers, { type: "audio/mp3" });
  };

  const handleDownloadPodcast = async () => {
    if (!podcastSegments.length) return;
    setBaixandoPodcast(true);
    try {
      const blob = await buildPodcastBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Podcast - ${(roteiro?.titulo || data.tituloFormatado).replace(/[^\w\s]/g, "").trim().slice(0, 50)}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setBaixandoPodcast(false); }
  };

  const handleWhatsAppPodcast = async () => {
    await handleDownloadPodcast();
    setTimeout(() => {
      const msg = `🎧 *${roteiro?.titulo || data.tituloFormatado}*\n📖 ${input.referencia}\n\nPodcast do sermão em áudio (MP3 baixado no seu dispositivo).\n\n_Criado com SermonStudio AI_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }, 900);
  };

  return (
    <div style={{ padding: "24px 28px 32px" }}>

      {/* ── Toggle de modo ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, background: "#f0ece0", padding: 5, borderRadius: 12 }}>
        <button onClick={() => { setModo("narracao"); setError(""); }}
          style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: ".82rem", fontFamily: "'Source Sans 3',sans-serif", background: modo === "narracao" ? "white" : "transparent", color: modo === "narracao" ? "#1a2744" : "#9b9690", boxShadow: modo === "narracao" ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all .2s" }}>
          🎙 Narração Simples
        </button>
        <button onClick={() => { setModo("podcast"); setError(""); }}
          style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: ".82rem", fontFamily: "'Source Sans 3',sans-serif", background: modo === "podcast" ? "white" : "transparent", color: modo === "podcast" ? "#1a2744" : "#9b9690", boxShadow: modo === "podcast" ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all .2s" }}>
          🎧 Podcast (2 Vozes)
        </button>
      </div>

      {/* ════════ MODO PODCAST ════════ */}
      {modo === "podcast" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2744", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>🎧 Podcast do Sermão</h3>
            <p style={{ fontSize: ".8rem", color: "#9b9690", lineHeight: 1.5 }}>
              A IA cria um <strong style={{ color: "#1a2744" }}>diálogo entre dois apresentadores</strong> discutindo seu sermão — estilo Audio Overview.
            </p>
          </div>

          {/* Vozes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>👩 Ana (Apresentadora)</p>
              <select value={vozHost} onChange={e => setVozHost(e.target.value)}
                style={{ width: "100%", background: "#f9f7f3", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "9px 12px", fontSize: ".82rem", color: "#1a2744", fontFamily: "'Source Sans 3',sans-serif", cursor: "pointer" }}>
                <option value="nova">Nova (feminino suave)</option>
                <option value="shimmer">Shimmer (feminino expressivo)</option>
                <option value="alloy">Alloy (neutro)</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>👨 Pedro (Teólogo)</p>
              <select value={vozConvidado} onChange={e => setVozConvidado(e.target.value)}
                style={{ width: "100%", background: "#f9f7f3", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "9px 12px", fontSize: ".82rem", color: "#1a2744", fontFamily: "'Source Sans 3',sans-serif", cursor: "pointer" }}>
                <option value="onyx">Onyx (grave e solene)</option>
                <option value="echo">Echo (masculino claro)</option>
                <option value="fable">Fable (narrativo)</option>
              </select>
            </div>
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "10px 14px", borderRadius: 8, marginBottom: 14, lineHeight: 1.6 }}>{error}</div>}

          {/* Botão gerar */}
          {podcastSegments.length === 0 && (
            <button onClick={handleGerarPodcast} disabled={loading}
              style={{ width: "100%", background: loading ? "#f0ece0" : "linear-gradient(135deg,#1a2744,#22305c)", color: loading ? "#9b9690" : "#f5f0e8", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: ".9rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Source Sans 3',sans-serif" }}>
              {loading
                ? <><span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> {podcastProgress.label} ({podcastProgress.current}/{podcastProgress.total})</>
                : <><span style={{ color: "#c9a84c", fontSize: "1.1rem" }}>🎧</span> Criar Podcast com IA</>}
            </button>
          )}

          {/* Barra de progresso */}
          {loading && podcastProgress.total > 0 && (
            <div style={{ marginTop: 10, background: "#e5e0d5", borderRadius: 20, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#c9a84c", borderRadius: 20, width: `${(podcastProgress.current / podcastProgress.total) * 100}%`, transition: "width .4s ease" }} />
            </div>
          )}

          {/* Player do podcast */}
          {podcastSegments.length > 0 && (
            <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 12, padding: "18px", marginTop: 8 }}>
              {roteiro?.titulo && <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a2744", marginBottom: 14 }}>🎧 {roteiro.titulo}</p>}

              {/* Controles */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {!podcastPlaying ? (
                  <button onClick={() => playPodcast(0)} style={{ flex: 1, background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>▶ Reproduzir Podcast</button>
                ) : (
                  <button onClick={stopPodcast} style={{ flex: 1, background: "#b91c1c", color: "white", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>⏸ Pausar</button>
                )}
                <button onClick={() => { setPodcastSegments([]); setRoteiro(null); }} style={{ background: "white", color: "#8b8680", border: "1px solid #e5e0d5", borderRadius: 8, padding: "12px 16px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>🔄 Novo</button>
              </div>

              {/* Botões de download */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <button onClick={handleDownloadPodcast} disabled={baixandoPodcast}
                  style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", opacity: baixandoPodcast ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  {baixandoPodcast
                    ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Gerando...</>
                    : <>⬇ Baixar MP3</>}
                </button>
                <button onClick={handleWhatsAppPodcast} disabled={baixandoPodcast}
                  style={{ background: "#25d366", color: "white", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", opacity: baixandoPodcast ? 0.6 : 1 }}>
                  💬 WhatsApp
                </button>
              </div>

              <audio ref={podcastAudioRef} style={{ display: "none" }} />

              {/* Transcrição clicável */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {podcastSegments.map((seg, i) => (
                  <button key={i} onClick={() => playPodcast(i)}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", background: seg.locutor === "host" ? "#fef9f0" : "white", border: "1px solid #e5e0d5", borderRadius: 9, padding: "11px 14px", cursor: "pointer", textAlign: "left", fontFamily: "'Source Sans 3',sans-serif", transition: "all .15s" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: seg.locutor === "host" ? "#c9a84c" : "#1a2744", color: seg.locutor === "host" ? "#1a2744" : "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", flexShrink: 0 }}>
                      {seg.locutor === "host" ? "👩" : "👨"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: ".7rem", fontWeight: 700, color: seg.locutor === "host" ? "#c9a84c" : "#1a2744", marginBottom: 2 }}>{seg.locutor === "host" ? "Ana" : "Pedro"}</p>
                      <p style={{ fontSize: ".82rem", color: "#374151", lineHeight: 1.55 }}>{seg.texto}</p>
                    </div>
                    <span style={{ color: "#c9a84c", fontSize: ".8rem", flexShrink: 0, marginTop: 6 }}>▶</span>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: ".7rem", color: "#b0aba2", textAlign: "center", fontStyle: "italic" }}>
                Clique em qualquer fala para começar a ouvir a partir dela
              </p>
            </div>
          )}

          {/* Info custo */}
          {podcastSegments.length === 0 && !loading && (
            <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 8, padding: "12px 14px", marginTop: 14 }}>
              <p style={{ fontSize: ".72rem", color: "#9b9690", lineHeight: 1.6 }}>
                ⚠ Requer <code style={{ background: "#ede8e0", padding: "1px 4px", borderRadius: 3 }}>OPENAI_API_KEY</code> · O roteiro usa a IA Claude + as vozes via OpenAI TTS · Custo: ~$0.10 por podcast
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════ MODO NARRAÇÃO ════════ */}
      {modo === "narracao" && (
      <div>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2744", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          🎙 Narração do Sermão
        </h3>
        <p style={{ fontSize: ".8rem", color: "#9b9690", lineHeight: 1.5 }}>
          Gera um áudio narrado com voz de IA usando <strong style={{ color: "#1a2744" }}>OpenAI TTS</strong> — baixe o MP3 ou compartilhe no WhatsApp.
        </p>
      </div>

      {/* Seleção de seção */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Trecho para Narrar</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SECOES.map(s => (
            <button key={s.id} onClick={() => setSecao(s.id)}
              style={{ padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${secao === s.id ? "#1a2744" : "#e2ddd5"}`, background: secao === s.id ? "#1a2744" : "white", color: secao === s.id ? "#c9a84c" : "#8b8680", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", textAlign: "left", fontFamily: "'Source Sans 3',sans-serif", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 6, fontSize: ".7rem", color: "#b0aba2" }}>
          ~{charCount.toLocaleString()} caracteres · duração estimada: <strong>{estimatedMins} min</strong>
        </p>
      </div>

      {/* Seleção de voz */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Voz do Narrador</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {VOZES.map(v => (
            <button key={v.id} onClick={() => setVoz(v.id)}
              style={{ padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${voz === v.id ? "#c9a84c" : "#e2ddd5"}`, background: voz === v.id ? "#faf8f0" : "white", cursor: "pointer", textAlign: "left", fontFamily: "'Source Sans 3',sans-serif", display: "flex", alignItems: "center", gap: 12, transition: "all .15s" }}>
              <span style={{ fontSize: "1.1rem" }}>{v.emoji}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: ".82rem", color: voz === v.id ? "#1a2744" : "#374151", marginBottom: 2 }}>{v.label}</p>
                <p style={{ fontSize: ".72rem", color: "#9b9690" }}>{v.desc}</p>
              </div>
              {voz === v.id && <span style={{ marginLeft: "auto", color: "#c9a84c", fontWeight: 700, fontSize: ".8rem" }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Velocidade */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#1a2744", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Velocidade: <span style={{ color: "#c9a84c" }}>{velocidade.toFixed(1)}x</span>
          <span style={{ fontWeight: 400, color: "#b0aba2", marginLeft: 8 }}>
            {velocidade < 0.9 ? "(lenta)" : velocidade > 1.15 ? "(rápida)" : "(normal)"}
          </span>
        </p>
        <input type="range" min="0.75" max="1.5" step="0.05" value={velocidade}
          onChange={e => setVelocidade(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#c9a84c", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "#b0aba2", marginTop: 3 }}>
          <span>0.75x Devagar</span><span>1.0x Normal</span><span>1.5x Rápido</span>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "10px 14px", borderRadius: 8, marginBottom: 14, lineHeight: 1.6 }}>
          {error}
          {error.includes("OPENAI_API_KEY") && <p style={{ marginTop: 4, fontSize: ".75rem" }}>Configure <code>OPENAI_API_KEY</code> no Vercel.</p>}
        </div>
      )}

      {/* Botão gerar */}
      {!audioSrc && (
        <button onClick={handleGerar} disabled={loading}
          style={{ width: "100%", background: loading ? "#f0ece0" : "linear-gradient(135deg,#1a2744,#22305c)", color: loading ? "#9b9690" : "#f5f0e8", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: ".9rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Source Sans 3',sans-serif", marginBottom: 8 }}>
          {loading
            ? <><span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Gerando narração... aguarde</>
            : <><span style={{ color: "#c9a84c", fontSize: "1.1rem" }}>🎙</span> Gerar Áudio com IA</>}
        </button>
      )}

      {/* Player de áudio */}
      {audioSrc && (
        <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 12, padding: "20px", marginBottom: 14 }}>
          {/* Badge de sucesso */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
            <span style={{ fontSize: "1.2rem" }}>✅</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".82rem", color: "#166534" }}>Áudio gerado com sucesso!</p>
              <p style={{ fontSize: ".72rem", color: "#15803d" }}>Voz: {VOZES.find(v => v.id === voz)?.label} · {velocidade}x · {SECOES.find(s => s.id === secao)?.label}</p>
            </div>
          </div>

          {/* Player nativo */}
          <audio ref={audioRef} controls src={audioSrc} style={{ width: "100%", borderRadius: 8, marginBottom: 14 }} />

          {/* Botões de ação */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <button onClick={handleDownload}
              style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
              ⬇ Baixar MP3
            </button>
            <button onClick={handleWhatsApp}
              style={{ background: "#25d366", color: "white", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
              💬 WhatsApp
            </button>
            <button onClick={() => { setAudioSrc(null); setError(""); }}
              style={{ background: "white", color: "#8b8680", border: "1px solid #e5e0d5", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
              🔄 Novo
            </button>
          </div>

          <p style={{ marginTop: 10, fontSize: ".68rem", color: "#b0aba2", textAlign: "center", fontStyle: "italic" }}>
            Baixe o MP3 e compartilhe no WhatsApp, Telegram ou email · Audio gerado por OpenAI TTS
          </p>
        </div>
      )}

      {/* Info de custo */}
      {!audioSrc && !loading && (
        <div style={{ background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ fontSize: ".72rem", color: "#9b9690", lineHeight: 1.6 }}>
            ⚠ Requer <code style={{ background: "#ede8e0", padding: "1px 4px", borderRadius: 3 }}>OPENAI_API_KEY</code> no Vercel<br />
            Custo: ~$0.015 por 1.000 caracteres (modelo tts-1-hd) · Sermão completo ≈ $0.10–0.20
          </p>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
function VideosSection({ tema, referencia, userEmail }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [buscaCustom, setBuscaCustom] = useState("");
  const [jaCarregou, setJaCarregou] = useState(false);

  const buscarVideos = async (queryOverride) => {
    setLoading(true); setError(""); setActiveVideo(null);
    const query = queryOverride || `pregação ${tema} ${referencia} bíblia`;
    try {
      const resp = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, query }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro ao buscar vídeos");
      setVideos(data.videos || []);
      setJaCarregou(true);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Sugestões de busca pré-definidas baseadas no tema
  const sugestoes = [
    `pregação ${tema}`,
    `estudo bíblico ${referencia}`,
    `sermão ${tema} evangélico`,
    `${referencia} explicação`,
  ];

  return (
    <div style={{ padding: "24px 28px 32px" }}>

      {/* Header da seção */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2744", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.1rem" }}>▶</span> Vídeos de Referência
        </h3>
        <p style={{ fontSize: ".8rem", color: "#9b9690", lineHeight: 1.5 }}>
          Pregações e estudos relacionados ao tema <strong style={{ color: "#1a2744" }}>"{tema}"</strong> no YouTube.
        </p>
      </div>

      {/* Busca customizada */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          style={{ flex: 1, background: "#f9f7f3", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "9px 13px", fontFamily: "'Source Sans 3',sans-serif", fontSize: ".85rem", color: "#1a2744", outline: "none", transition: "border-color .2s" }}
          placeholder="Buscar outro tema no YouTube..."
          value={buscaCustom}
          onChange={e => setBuscaCustom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscaCustom.trim() && buscarVideos(buscaCustom.trim())}
          onFocus={e => e.target.style.borderColor = "#c9a84c"}
          onBlur={e => e.target.style.borderColor = "#e2ddd5"}
        />
        <button
          onClick={() => buscarVideos(buscaCustom.trim() || undefined)}
          disabled={loading}
          style={{ background: "#1a2744", color: "#c9a84c", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", flexShrink: 0, fontFamily: "'Source Sans 3',sans-serif", opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : "Buscar"}
        </button>
      </div>

      {/* Sugestões rápidas */}
      {!jaCarregou && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: ".7rem", fontWeight: 700, color: "#b0aba2", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Sugestões de busca</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {sugestoes.map((s, i) => (
              <button key={i} onClick={() => buscarVideos(s)}
                style={{ padding: "5px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid #e2ddd5", background: "white", color: "#8b8680", fontFamily: "'Source Sans 3',sans-serif", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#1a2744"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2ddd5"; e.currentTarget.style.color = "#8b8680"; }}>
                🔍 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão inicial */}
      {!jaCarregou && !loading && (
        <button onClick={() => buscarVideos()}
          style={{ width: "100%", background: "linear-gradient(135deg,#1a2744,#22305c)", color: "#f5f0e8", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Source Sans 3',sans-serif", letterSpacing: ".05em", marginBottom: 8 }}>
          <span style={{ color: "#c9a84c", fontSize: "1.1rem" }}>▶</span> Buscar Vídeos Relacionados
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, background: "#f9f7f3", borderRadius: 10, padding: 12, animation: "shimmer 1.5s ease-in-out infinite", animationDelay: `${i*0.1}s` }}>
              <div style={{ width: 120, height: 68, background: "#e5e0d5", borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                <div style={{ height: 12, background: "#e5e0d5", borderRadius: 4, width: "80%" }} />
                <div style={{ height: 10, background: "#ede8e0", borderRadius: 4, width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "12px 16px", borderRadius: 8, lineHeight: 1.6 }}>
          <strong>Erro:</strong> {error}
          {error.includes("YOUTUBE_API_KEY") && (
            <p style={{ marginTop: 6, fontSize: ".78rem" }}>Configure a variável <code>YOUTUBE_API_KEY</code> no Vercel para ativar esta função.</p>
          )}
        </div>
      )}

      {/* Player + lista */}
      {!loading && videos.length > 0 && (
        <div>
          {/* Player embed */}
          {activeVideo && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                <iframe
                  src={`${activeVideo.embedUrl}?autoplay=1&rel=0`}
                  title={activeVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                />
              </div>
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f9f7f3", borderRadius: 8, borderLeft: "3px solid #c9a84c" }}>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", fontWeight: 700, color: "#1a2744", lineHeight: 1.3 }}>{activeVideo.titulo}</p>
                <p style={{ fontSize: ".75rem", color: "#9b9690", marginTop: 3 }}>📺 {activeVideo.canal}</p>
              </div>
            </div>
          )}

          {/* Grade de vídeos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {videos.map((v, i) => (
              <button key={i} onClick={() => setActiveVideo(v)}
                style={{ background: activeVideo?.id === v.id ? "#f0ece0" : "#f9f7f3", border: `1.5px solid ${activeVideo?.id === v.id ? "#c9a84c" : "#e5e0d5"}`, borderRadius: 10, padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all .15s", fontFamily: "'Source Sans 3',sans-serif" }}
                onMouseEnter={e => { if (activeVideo?.id !== v.id) { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; } }}
                onMouseLeave={e => { if (activeVideo?.id !== v.id) { e.currentTarget.style.borderColor = "#e5e0d5"; e.currentTarget.style.background = "#f9f7f3"; } }}>

                {/* Thumbnail */}
                <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#1a2744" }}>
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: "1.5rem" }}>▶</div>
                  )}
                  {/* Play overlay */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity .2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a2744", fontSize: ".9rem", paddingLeft: 2 }}>▶</div>
                  </div>
                  <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.75)", color: "white", fontSize: ".6rem", padding: "2px 5px", borderRadius: 3 }}>YouTube</div>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#1a2744", lineHeight: 1.35, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {v.titulo}
                  </p>
                  <p style={{ fontSize: ".7rem", color: "#9b9690" }}>📺 {v.canal}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => buscarVideos()}
              style={{ flex: 1, background: "none", border: "1.5px solid #e2ddd5", borderRadius: 8, padding: "9px", fontSize: ".78rem", color: "#8b8680", cursor: "pointer", fontWeight: 600, fontFamily: "'Source Sans 3',sans-serif" }}>
              🔄 Atualizar busca
            </button>
            {activeVideo && (
              <a href={activeVideo.url} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, background: "#ff0000", color: "white", border: "none", borderRadius: 8, padding: "9px", fontSize: ".78rem", cursor: "pointer", fontWeight: 700, fontFamily: "'Source Sans 3',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                ▶ Abrir no YouTube
              </a>
            )}
          </div>

          <p style={{ marginTop: 12, fontSize: ".7rem", color: "#c0bbb5", textAlign: "center", fontStyle: "italic" }}>
            Clique em qualquer vídeo para assistir aqui mesmo · Resultados do YouTube
          </p>
        </div>
      )}
    </div>
  );
}
export default function SermonStudio({ userEmail = "", onLogout }) {
  const [input, setInput] = useState({ tema: "", referencia: "", objetivo: "", publicoTom: "" });
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
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const loadingMsgRef = useRef(null);

  const data = editedData || sermonData;
  const currentSlides = editedSlides.length > 0 ? editedSlides : slides;

  useEffect(() => { if (slides.length > 0) setEditedSlides([...slides]); }, [slides]);

  useEffect(() => {
    if (!loading) return;
    const msgs = ["Analisando a passagem bíblica...", "Construindo o contexto teológico...", "Desenvolvendo os pontos principais...", "Preparando aplicações práticas...", "Montando o esboço de púlpito...", "Gerando os slides visuais...", "Finalizando o sermão..."];
    let i = 0; setLoadingMsg(msgs[0]);
    loadingMsgRef.current = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 1800);
    return () => clearInterval(loadingMsgRef.current);
  }, [loading]);

  const handleGenerate = useCallback(async () => {
    if (!input.tema.trim() || !input.referencia.trim()) { setError("Por favor, preencha o Tema e a Referência Bíblica."); return; }
    setError(""); setLoading(true); setSermonData(null); setEditedData(null); setSlides([]); setEditedSlides([]);

    const prompt = `Você é um teólogo e pregador evangélico experiente. Crie um sermão completo em JSON puro (sem markdown, sem backticks, sem texto fora do JSON).

Formato EXATO do JSON:
{
  "tituloFormatado": "Título elegante do sermão",
  "versiculoChave": "Transcrição do versículo principal",
  "introducao": "Introdução com quebra-gelo e contexto histórico (2 parágrafos separados por \\n\\n)",
  "contextoTeologico": "Análise teológica da passagem (2 parágrafos separados por \\n\\n)",
  "pontosPrincipais": [
    {"titulo": "Título do ponto 1","frasePrincipal": "Frase impactante até 12 palavras","desenvolvimento": "Desenvolvimento do ponto (2 parágrafos)","aplicacao": "Aplicação prática (1 parágrafo)","versiculoApoio": "Versículo de apoio (referência)"},
    {"titulo": "Título do ponto 2","frasePrincipal": "...","desenvolvimento": "...","aplicacao": "...","versiculoApoio": "..."},
    {"titulo": "Título do ponto 3","frasePrincipal": "...","desenvolvimento": "...","aplicacao": "...","versiculoApoio": "..."}
  ],
  "conclusao": "Conclusão com apelo espiritual (2 parágrafos)",
  "fraseConclusao": "Frase final impactante até 15 palavras",
  "esboco": ["SERMÃO: [título]","Texto-base: [ref]","","I. INTRODUÇÃO","   A. [tópico]","   B. [tópico]","","II. CONTEXTO TEOLÓGICO","   A. [tópico]","","III. [PONTO 1]","   A. [dev]","   B. Aplicação: [...]","   Verso: [...]","","IV. [PONTO 2]","   A. [dev]","   B. Aplicação: [...]","   Verso: [...]","","V. [PONTO 3]","   A. [dev]","   B. Aplicação: [...]","   Verso: [...]","","VI. CONCLUSÃO E APELO","   A. [síntese]","   B. [apelo]"]
}

Dados: Tema: ${input.tema} | Referência: ${input.referencia} | Objetivo: ${input.objetivo || "Edificação geral"} | Público: ${input.publicoTom || "Igreja Geral"}

RESPONDA APENAS COM O JSON.`;

    try {
      const response = await fetch("/api/sermon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
      });
      const apiData = await response.json();
      if (!response.ok || apiData.error) throw new Error(apiData.error?.message || apiData.error || `HTTP ${response.status}`);
      const rawText = apiData.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); }
      catch {
        let repaired = clean;
        const opens = (repaired.match(/\{/g) || []).length;
        const closes = (repaired.match(/\}/g) || []).length;
        const missing = opens - closes;
        if (missing > 0) { repaired = repaired.replace(/,\s*$/, ""); repaired += '"}}'.repeat(missing); }
        try { parsed = JSON.parse(repaired); }
        catch { throw new Error("Sermão muito longo e ficou incompleto. Tente um tema mais específico."); }
      }
      setSermonData(parsed);
      setEditedData(JSON.parse(JSON.stringify(parsed)));
      const newSlides = buildSlides(parsed, input.referencia, input.publicoTom);
      setSlides(newSlides); setSlideIndex(0); setActiveTab("detalhado");
      saveToHistory(input, parsed); // ← salva no histórico
    } catch (err) {
      setError(`Erro: ${err.message || "Falha na geração. Tente novamente."}`);
    } finally { setLoading(false); }
  }, [input]);

  const handleLoadFromHistory = (entry) => {
    setInput(entry.input);
    setSermonData(entry.data);
    setEditedData(JSON.parse(JSON.stringify(entry.data)));
    const newSlides = buildSlides(entry.data, entry.input.referencia, entry.input.publicoTom);
    setSlides(newSlides); setSlideIndex(0); setActiveTab("detalhado");
  };

  const [pptxLoading, setPptxLoading] = useState(false);
  const [projecao, setProjecao] = useState(null); // { referencia, texto }

  // ── Player de áudio global (sobrevive a trocas de aba) ──
  const [globalAudio, setGlobalAudio] = useState(null); // { src, label, type } | null
  const [globalAudioPlaying, setGlobalAudioPlaying] = useState(false);
  const globalAudioRef = useRef(null);

  // Sincroniza play/pause externo com o elemento de áudio
  useEffect(() => {
    const el = globalAudioRef.current;
    if (!el) return;
    if (globalAudioPlaying) el.play().catch(() => setGlobalAudioPlaying(false));
    else el.pause();
  }, [globalAudioPlaying, globalAudio]);
  const [slideImages, setSlideImages] = useState({}); // { slideIndex: "data:image/png;base64,..." }
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesProgress, setImagesProgress] = useState({ current: 0, total: 0, label: "" });

  // Gera prompt artístico para cada slide
  const buildImagePrompt = (slide, tema, referencia) => {
    const base = `Beautiful cinematic photograph, dramatic natural lighting, atmospheric, inspirational, no text, no words, no letters. `;
    const prompts = {
      titulo: `${base}Majestic landscape at golden hour, sun rays breaking through dramatic clouds over mountains and valleys, sense of hope and grandeur, ultra detailed, peaceful.`,
      escritura: `${base}Warm candlelight on an old open book on a wooden table, soft glow, cozy library atmosphere, shallow depth of field, reverent mood.`,
      ponto: `${base}Abstract inspirational scene with light rays through morning forest mist, path leading forward, sense of purpose and reflection, painterly cinematic style.`,
      citacao: `${base}Serene nature landscape, calm lake at sunrise reflecting the sky, gentle light, tranquil and contemplative atmosphere, wide angle.`,
      conclusao: `${base}Breathtaking sunrise over open horizon, warm golden and orange tones, new beginning and hope, vast inspiring sky, cinematic.`,
    };
    return prompts[slide.tipo] || prompts.titulo;
  };

  const handleGenerateImages = async () => {
    if (!data || imagesLoading) return;
    setImagesLoading(true);
    setSlideImages({});

    // Gera imagens apenas para slides principais (título, pontos, conclusão)
    const targetSlides = currentSlides
      .map((s, i) => ({ ...s, index: i }))
      .filter(s => ["titulo", "ponto", "conclusao"].includes(s.tipo));

    setImagesProgress({ current: 0, total: targetSlides.length, label: "Iniciando..." });

    const newImages = {};
    for (let i = 0; i < targetSlides.length; i++) {
      const slide = targetSlides[i];
      setImagesProgress({ current: i + 1, total: targetSlides.length, label: slide.titulo.replace("📖 ", "").slice(0, 40) });

      try {
        const prompt = buildImagePrompt(slide, input.tema, input.referencia);
        const resp = await fetch("/api/imagine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email: userEmail, prompt }),
        });
        const result = await resp.json();
        if (resp.ok && result.image) {
          newImages[slide.index] = result.image;
          setSlideImages({ ...newImages }); // atualiza progressivamente
        }
      } catch (err) {
        console.error("Image gen error:", err);
      }
    }
    setImagesLoading(false);
  };

  const handleExportOutline = () => {
    if (!data) return;
    const html = buildOutlineExportHtml(data, input);
    const win = window.open("", "_blank"); if (!win) return;
    win.document.write(html); win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const handleExportSlides = () => {
    if (!currentSlides.length) return;
    const html = buildSlidesExportHtml(currentSlides, slideTheme, data?.tituloFormatado || "Sermão");
    const win = window.open("", "_blank"); if (!win) return;
    win.document.write(html); win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const handleExportPPTX = async () => {
    if (!data || pptxLoading) return;
    setPptxLoading(true);
    try {
      await gerarPPTX(data, input, slideTheme, slideImages);
    } catch (err) {
      console.error("PPTX error:", err);
    } finally {
      setPptxLoading(false);
    }
  };

  const updateSlide = (updated) => setEditedSlides(ss => ss.map((s, i) => i === slideIndex ? updated : s));
  const updatePonto = (index, field, value) => setEditedData(d => { if (!d) return d; const pts = d.pontosPrincipais.map((p, i) => i === index ? { ...p, [field]: value } : p); return { ...d, pontosPrincipais: pts }; });

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", background: "#efebe2", minHeight: "100vh", color: "#1a2744" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Sans+3:wght@300;400;600;700&family=DM+Sans:wght@400;600;700&family=Montserrat:wght@700;900&display=swap');
        *{box-sizing:border-box}
        .ss-input{width:100%;background:white;border:1.5px solid #e2ddd5;border-radius:7px;padding:10px 13px;font-family:'Source Sans 3',sans-serif;font-size:.875rem;color:#1a2744;transition:border-color .2s,box-shadow .2s;line-height:1.5}
        .ss-input:focus{outline:none;border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,.12)}
        textarea.ss-input{resize:vertical}
        select.ss-input{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b8680' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .ss-label{display:block;font-size:.72rem;font-weight:700;color:#1a2744;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
        .ss-card{background:white;border-radius:14px;box-shadow:0 2px 24px rgba(26,39,68,.07)}
        .ss-btn-primary{background:#1a2744;color:#f5f0e8;border:none;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-weight:700;transition:all .2s;border-radius:8px}
        .ss-btn-primary:hover:not(:disabled){background:#22305c;transform:translateY(-1px);box-shadow:0 5px 16px rgba(26,39,68,.3)}
        .ss-btn-primary:disabled{opacity:.65;cursor:not-allowed}
        .ss-btn-gold{background:#c9a84c;color:#1a2744;border:none;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-weight:700;transition:all .2s;border-radius:8px}
        .ss-btn-gold:hover{background:#d4b55e;transform:translateY(-1px);box-shadow:0 5px 14px rgba(201,168,76,.35)}
        .ss-btn-outline{background:white;color:#1a2744;border:1.5px solid #e2ddd5;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-weight:600;transition:all .2s;border-radius:8px}
        .ss-btn-outline:hover:not(:disabled){border-color:#1a2744;background:#f9f7f3}
        .ss-btn-outline:disabled{opacity:.4;cursor:not-allowed}
        .ss-tab{padding:14px 20px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;background:none;border-bottom:2.5px solid transparent;transition:all .18s;white-space:nowrap}
        .ss-tab:hover{color:#1a2744}
        .ss-tab-active{border-color:#c9a84c;color:#1a2744}
        .ss-tab-inactive{color:#9b9690}
        .ss-editable{width:100%;background:#f9f7f3;border:1.5px solid #ede8e0;border-radius:6px;padding:12px 15px;font-family:'Source Sans 3',sans-serif;font-size:.88rem;color:#374151;line-height:1.8;resize:vertical;transition:border-color .2s}
        .ss-editable:focus{outline:none;border-color:#c9a84c;background:white;box-shadow:0 0 0 3px rgba(201,168,76,.1)}
        .pulse-dot{animation:pulseDot 1.4s ease-in-out infinite}
        @keyframes pulseDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        .shimmer{animation:shimmer 1.6s ease-in-out infinite}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        .ss-dot-nav{width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;transition:all .2s;padding:0}
        .ss-theme-pill{padding:6px 14px;border-radius:20px;font-size:.75rem;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .2s}
        .quick-ex-btn{width:100%;text-align:left;background:none;border:1.5px solid transparent;border-radius:7px;padding:8px 11px;cursor:pointer;font-size:.8rem;color:#8b8680;transition:all .15s;font-family:'Source Sans 3',sans-serif}
        .quick-ex-btn:hover{background:#f9f7f3;border-color:#e5e0d5;color:#1a2744}
      `}</style>

      {/* ── MODALS ── */}
      {showHistory && <HistoryPanel onLoad={handleLoadFromHistory} onClose={() => setShowHistory(false)} />}
      {showShare && data && <ShareModal data={data} input={input} onClose={() => setShowShare(false)} />}
      {showSuggestions && <SuggestionModal userEmail={userEmail} onSelect={s => { setInput(s); setShowSuggestions(false); }} onClose={() => setShowSuggestions(false)} />}
      {projecao && <FullscreenProjection referencia={projecao.referencia} texto={projecao.texto} theme={slideTheme} onClose={() => setProjecao(null)} />}

      {/* ─── ELEMENTO DE ÁUDIO GLOBAL (invisível) ─── */}
      <audio
        ref={globalAudioRef}
        src={globalAudio?.src || undefined}
        onEnded={() => {
          if (globalAudio?.onEnded) globalAudio.onEnded();
          else setGlobalAudioPlaying(false);
        }}
        style={{ display: "none" }}
      />

      {/* ─── MINI-PLAYER FLUTUANTE ─── */}
      {globalAudio && (
        <div style={{
          position: "fixed", bottom: 18, right: 18, zIndex: 80,
          background: "#1a2744", color: "#c9a84c",
          borderRadius: 14, padding: "11px 16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", gap: 12,
          maxWidth: 340, border: "1px solid rgba(201,168,76,0.3)",
          backdropFilter: "blur(8px)",
          animation: "slideUp .3s ease",
        }}>
          <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

          {/* Play/Pause */}
          <button onClick={() => setGlobalAudioPlaying(p => !p)}
            style={{ background: "#c9a84c", color: "#1a2744", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: ".9rem", fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {globalAudioPlaying ? "⏸" : "▶"}
          </button>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#c9a84c", opacity: 0.7, marginBottom: 2 }}>
              {globalAudio.type === "podcast" ? "🎧 Podcast" : "🎙 Narração"}
            </p>
            <p style={{ fontSize: ".78rem", color: "#f5f0e8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {globalAudio.label || "Reproduzindo..."}
            </p>
          </div>

          {/* Fechar */}
          <button onClick={() => { setGlobalAudio(null); setGlobalAudioPlaying(false); }}
            title="Fechar player"
            style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: ".75rem", flexShrink: 0, opacity: 0.7 }}>
            ✕
          </button>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{ background: "#1a2744", color: "#f5f0e8", padding: "0 32px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,.25)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, border: "1.5px solid #c9a84c", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: 18 }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.35rem", fontWeight: 700, letterSpacing: ".02em", lineHeight: 1 }}>SermonStudio AI</div>
              <div style={{ fontSize: ".65rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8680", marginTop: 2 }}>Ferramenta de Preparação Ministerial</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* User badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "5px 12px" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, color: "#1a2744", flexShrink: 0 }}>
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: ".72rem", color: "rgba(201,168,76,0.8)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</span>
              <button onClick={onLogout} title="Sair" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(201,168,76,0.5)", fontSize: ".75rem", padding: "0 2px", lineHeight: 1 }}>✕</button>
            </div>
            <button className="ss-btn-outline" onClick={() => setShowHistory(true)} style={{ padding: "7px 14px", fontSize: ".78rem", display: "flex", alignItems: "center", gap: 6, color: "#c9a84c", borderColor: "rgba(201,168,76,.3)", background: "transparent" }}>
              📚 Histórico
            </button>
            {data && (<>
              <button className="ss-btn-outline" onClick={() => setShowShare(true)} style={{ padding: "7px 14px", fontSize: ".78rem", display: "flex", alignItems: "center", gap: 6, color: "#c9a84c", borderColor: "rgba(201,168,76,.3)", background: "transparent" }}>
                💬 Compartilhar
              </button>
              <button className="ss-btn-gold" onClick={handleExportOutline} style={{ padding: "8px 16px", fontSize: ".78rem" }}>⬇ Esboço PDF</button>
              <button
                className="ss-btn-primary"
                onClick={handleExportPPTX}
                disabled={pptxLoading}
                style={{ padding: "8px 16px", fontSize: ".78rem", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", gap: 7 }}>
                {pptxLoading
                  ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Gerando...</>
                  : <>📊 Baixar .pptx</>}
              </button>
            </>)}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 48px", display: "grid", gridTemplateColumns: "360px 1fr", gap: 28, alignItems: "start" }}>

        {/* ── LEFT PANEL ── */}
        <aside>
          <div className="ss-card" style={{ padding: "28px 24px" }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>Painel do Pregador</h2>
              <p style={{ fontSize: ".82rem", color: "#9b9690", lineHeight: 1.5 }}>Preencha os dados e deixe a IA construir o conteúdo completo.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="ss-label">Tema / Título Central <span style={{ color: "#c9a84c" }}>*</span></label>
                <input className="ss-input" placeholder="Ex: A parábola do filho pródigo" value={input.tema} onChange={e => setInput(p => ({ ...p, tema: e.target.value }))} />
              </div>
              <div>
                <label className="ss-label">Referência Bíblica Principal <span style={{ color: "#c9a84c" }}>*</span></label>
                <input className="ss-input" placeholder="Ex: Lucas 15:11-32" value={input.referencia} onChange={e => setInput(p => ({ ...p, referencia: e.target.value }))} />
              </div>
              <div>
                <label className="ss-label">Objetivo da Mensagem</label>
                <input className="ss-input" placeholder="Ex: Consolar, Conversão, Ensino..." value={input.objetivo} onChange={e => setInput(p => ({ ...p, objetivo: e.target.value }))} />
              </div>
              <div>
                <label className="ss-label">Público-Alvo / Tom</label>
                <select className="ss-input" value={input.publicoTom} onChange={e => setInput(p => ({ ...p, publicoTom: e.target.value }))}>
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
            {error && <div style={{ marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: ".82rem", padding: "10px 14px", borderRadius: 7, lineHeight: 1.5 }}>{error}</div>}
            <button className="ss-btn-primary" onClick={handleGenerate} disabled={loading} style={{ marginTop: 22, width: "100%", padding: "13px", fontSize: ".82rem", letterSpacing: ".1em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? (<><span style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <span key={i} className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9a84c", display: "block", animationDelay: `${i*.2}s` }} />)}</span><span style={{ color: "#c9a84c" }}>{loadingMsg}</span></>) : (<><span style={{ color: "#c9a84c" }}>✦</span> Gerar Sermão com IA</>)}
            </button>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0ece0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p className="ss-label" style={{ marginBottom: 0 }}>Exemplos Rápidos</p>
                <button
                  onClick={() => setShowSuggestions(true)}
                  style={{ background: "linear-gradient(135deg,#1a2744,#22305c)", color: "#c9a84c", border: "1px solid rgba(201,168,76,.3)", borderRadius: 20, padding: "5px 12px", fontSize: ".7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'Source Sans 3',sans-serif", letterSpacing: ".04em" }}>
                  <span style={{ fontSize: ".85rem" }}>✦</span> Sugerir com IA
                </button>
              </div>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button key={i} className="quick-ex-btn" onClick={() => setInput(ex)} style={{ marginBottom: 6, display: "block" }}>
                  <span style={{ color: "#c9a84c", marginRight: 6 }}>→</span>
                  <strong style={{ color: "#1a2744", fontWeight: 600 }}>{ex.tema}</strong><br />
                  <span style={{ marginLeft: 18, fontSize: ".72rem", color: "#b0aba2" }}>{ex.referencia} · {ex.publicoTom}</span>
                </button>
              ))}
              <button
                onClick={() => setShowSuggestions(true)}
                style={{ width: "100%", marginTop: 4, background: "none", border: "1.5px dashed #e2ddd5", borderRadius: 8, padding: "9px", fontSize: ".78rem", color: "#c9a84c", cursor: "pointer", fontWeight: 600, fontFamily: "'Source Sans 3',sans-serif", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#faf8f3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2ddd5"; e.currentTarget.style.background = "none"; }}>
                ✦ Gerar mais sugestões com IA...
              </button>
            </div>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <section>
          {!data && !loading && (
            <div className="ss-card" style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 40px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, border: "2px solid #e5e0d5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 28, color: "#c9a84c" }}>✦</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", fontWeight: 700, color: "#1a2744", marginBottom: 10 }}>Pronto para Proclamar</h3>
              <p style={{ color: "#9b9690", maxWidth: 440, lineHeight: 1.7, fontSize: ".88rem", marginBottom: 40 }}>Preencha o painel ao lado com o tema e a passagem bíblica. A IA irá construir um sermão teológico completo, com esboço de púlpito e slides prontos para projeção.</p>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
                {[{ icon: "📖", label: "Estudo Completo", desc: "Introdução, contexto e 3 pontos" }, { icon: "📝", label: "Esboço de Púlpito", desc: "Guia rápido para pregação" }, { icon: "▦", label: "Slides Visuais", desc: "5 temas editáveis 16:9" }, { icon: "📚", label: "Histórico", desc: "Últimos 20 sermões salvos" }].map((f, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 48, height: 48, background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                    <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#1a2744" }}>{f.label}</p>
                    <p style={{ fontSize: ".72rem", color: "#b0aba2" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="ss-card" style={{ padding: "40px 36px" }}>
              <div style={{ marginBottom: 32, textAlign: "center" }}>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", color: "#1a2744", fontWeight: 600, marginBottom: 6 }}>{loadingMsg}</p>
                <p style={{ fontSize: ".8rem", color: "#b0aba2" }}>A IA está preparando o sermão completo...</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[{w:"45%",h:22},{w:"100%",h:14},{w:"90%",h:14},{w:"75%",h:14},{w:"100%",h:14},{w:"85%",h:14}].map((s,i) => (
                  <div key={i} className="shimmer" style={{ width: s.w, height: s.h, background: i===0?"linear-gradient(90deg,#e5dfd4,#f0ece0)":"#f0ece0", borderRadius: 6, animationDelay: `${i*.1}s` }} />
                ))}
              </div>
              <div style={{ marginTop: 36, background: "#f9f7f3", border: "1px solid #e5e0d5", borderLeft: "3px solid #c9a84c", padding: "14px 18px", borderRadius: "0 7px 7px 0", fontSize: ".8rem", color: "#8b8680", fontStyle: "italic" }}>
                "Não por força nem por violência, mas pelo meu Espírito, diz o Senhor dos Exércitos." — Zacarias 4:6
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="ss-card" style={{ overflow: "hidden" }}>
              {/* Tab Bar */}
              <div style={{ display: "flex", borderBottom: "1.5px solid #f0ece0", background: "#faf9f6", paddingLeft: 8, overflowX: "auto" }}>
                {[{ id: "detalhado", icon: "📖", label: "Estudo Completo", sub: "Modo Detalhado" }, { id: "esboco", icon: "📝", label: "Esboço de Púlpito", sub: "Modo Resumido" }, { id: "slides", icon: "▦", label: "Apresentação", sub: "Slides Visuais" }, { id: "audio", icon: "🎙", label: "Narração", sub: "Áudio com IA" }, { id: "biblia", icon: "📖", label: "Bíblia", sub: "Consulta Online" }, { id: "videos", icon: "▶", label: "Vídeos", sub: "Referências YouTube" }].map(tab => (
                  <button key={tab.id} className={`ss-tab ${activeTab === tab.id ? "ss-tab-active" : "ss-tab-inactive"}`} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span>{tab.icon} {tab.label}</span>
                    <span style={{ fontSize: ".65rem", fontWeight: 400, opacity: 0.55, marginTop: 1 }}>{tab.sub}</span>
                  </button>
                ))}
              </div>

              {/* ── TAB 1: Detailed ── */}
              {activeTab === "detalhado" && (
                <div style={{ padding: "28px 28px 32px", maxHeight: 700, overflowY: "auto" }}>
                  <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f0ece0" }}>
                    <input style={{ width: "100%", border: "none", background: "transparent", fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 700, color: "#1a2744", lineHeight: 1.2, outline: "none", marginBottom: 6 }} value={data.tituloFormatado} onChange={e => setEditedData(d => d ? { ...d, tituloFormatado: e.target.value } : d)} />
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                      <span style={{ background: "#1a2744", color: "#c9a84c", fontSize: ".72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: ".05em" }}>{input.referencia}</span>
                      {input.publicoTom && <span style={{ background: "#f9f7f3", color: "#8b8680", fontSize: ".72rem", padding: "3px 10px", borderRadius: 20, border: "1px solid #e5e0d5" }}>{input.publicoTom}</span>}
                    </div>
                    {data.versiculoChave && <div style={{ marginTop: 16, background: "#f0ece0", borderLeft: "3px solid #c9a84c", padding: "12px 16px", borderRadius: "0 7px 7px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", fontStyle: "italic", color: "#374151", lineHeight: 1.7 }}>"{data.versiculoChave}"</div>}
                  </div>
                  {[{ key: "introducao", label: "I. Introdução" }, { key: "contextoTeologico", label: "II. Contexto Teológico" }].map(sec => (
                    <div key={sec.key} style={{ marginBottom: 24 }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a2744", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ color: "#c9a84c", fontSize: ".85rem" }}>◆</span>{sec.label}
                      </h3>
                      <textarea className="ss-editable" rows={5} value={data[sec.key]} onChange={e => setEditedData(d => d ? { ...d, [sec.key]: e.target.value } : d)} />
                    </div>
                  ))}
                  {data.pontosPrincipais.map((ponto, i) => (
                    <div key={i} style={{ marginBottom: 22, border: "1px solid #e5e0d5", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ background: "#1a2744", color: "#f5f0e8", padding: "11px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 28, height: 28, border: "1.5px solid #c9a84c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: ".78rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                        <input style={{ background: "transparent", border: "none", outline: "none", fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", fontWeight: 700, color: "#f5f0e8", width: "100%" }} value={ponto.titulo} onChange={e => updatePonto(i, "titulo", e.target.value)} />
                      </div>
                      <div style={{ background: "#f9f7f3", borderRadius: "0 0 8px 8px", padding: 18 }}>
                        <label className="ss-label" style={{ marginBottom: 6 }}>Desenvolvimento</label>
                        <textarea className="ss-editable" rows={4} value={ponto.desenvolvimento} onChange={e => updatePonto(i, "desenvolvimento", e.target.value)} />
                        <div style={{ background: "#f0ece0", borderLeft: "3px solid #c9a84c", padding: "11px 14px", borderRadius: "0 6px 6px 0", marginTop: 12 }}>
                          <p style={{ fontSize: ".7rem", fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>✦ Aplicação Prática</p>
                          <textarea style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: ".85rem", color: "#374151", lineHeight: 1.75, resize: "vertical", fontFamily: "'Source Sans 3',sans-serif", fontStyle: "italic" }} rows={2} value={ponto.aplicacao} onChange={e => updatePonto(i, "aplicacao", e.target.value)} />
                        </div>
                        {ponto.versiculoApoio && <p style={{ marginTop: 10, fontSize: ".78rem", color: "#9b9690", fontStyle: "italic" }}>📖 {ponto.versiculoApoio}</p>}
                      </div>
                    </div>
                  ))}
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a2744", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ color: "#c9a84c", fontSize: ".85rem" }}>◆</span>VI. Conclusão e Apelo
                    </h3>
                    <textarea className="ss-editable" rows={5} value={data.conclusao} onChange={e => setEditedData(d => d ? { ...d, conclusao: e.target.value } : d)} />
                  </div>
                </div>
              )}

              {/* ── TAB 2: Outline ── */}
              {activeTab === "esboco" && (
                <div style={{ padding: "28px" }}>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.7rem", fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>{data.tituloFormatado}</h2>
                    <p style={{ fontSize: ".82rem", color: "#c9a84c", fontWeight: 600 }}>{input.referencia}{input.objetivo ? ` · ${input.objetivo}` : ""}</p>
                  </div>
                  <div style={{ background: "#f9f7f3", border: "1.5px solid #e5e0d5", borderRadius: 10, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <p className="ss-label" style={{ marginBottom: 0 }}>Esboço de Púlpito — Editável</p>
                      <span style={{ fontSize: ".7rem", color: "#b0aba2", fontStyle: "italic" }}>✎ Clique para editar</span>
                    </div>
                    <textarea style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "'Courier New',monospace", fontSize: ".88rem", color: "#1a2744", lineHeight: 1.9, resize: "none", minHeight: 520 }} value={data.esboco?.join("\n") || ""} onChange={e => setEditedData(d => d ? { ...d, esboco: e.target.value.split("\n") } : d)} rows={Math.max(24, (data.esboco?.length || 0) + 4)} />
                  </div>
                </div>
              )}

              {/* ── TAB 3: Slides ── */}
              {activeTab === "slides" && (
                <div style={{ padding: "22px 24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                    <span className="ss-label" style={{ marginBottom: 0, flexShrink: 0 }}>Estilo Visual:</span>
                    {Object.values(THEMES).map(t => (
                      <button key={t.key} className="ss-theme-pill" onClick={() => setSlideTheme(t.key)} style={{ background: slideTheme === t.key ? "#1a2744" : "white", color: slideTheme === t.key ? "#f5f0e8" : "#8b8680", borderColor: slideTheme === t.key ? "#1a2744" : "#e2ddd5" }}>
                        {t.label}
                      </button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "#b0aba2" }}>{slideIndex + 1} / {currentSlides.length}</span>
                    <button
                      onClick={handleExportPPTX}
                      disabled={pptxLoading}
                      style={{ background: "#1a2744", color: "#c9a84c", border: "1px solid rgba(201,168,76,.3)", borderRadius: 7, padding: "5px 12px", fontSize: ".72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Source Sans 3',sans-serif", opacity: pptxLoading ? 0.6 : 1 }}>
                      {pptxLoading
                        ? <><span style={{ display: "inline-block", width: 10, height: 10, border: "1.5px solid #c9a84c", borderTop: "1.5px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Gerando...</>
                        : <>📊 Baixar .pptx</>}
                    </button>
                  </div>
                  <SlideViewer
                    slide={currentSlides[slideIndex]}
                    theme={slideTheme}
                    onChange={updateSlide}
                    bgImage={slideImages[slideIndex] || null}
                  />

                  {/* ── Painel de Imagens IA ── */}
                  <div style={{ marginTop: 14, background: "#f9f7f3", border: "1px solid #e5e0d5", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>🎨 Imagens de Fundo com DALL-E</p>
                        <p style={{ fontSize: ".7rem", color: "#9b9690" }}>
                          {Object.keys(slideImages).length > 0
                            ? `${Object.keys(slideImages).length} imagens geradas · Clique nos slides para ver`
                            : "Gera imagens artísticas únicas para cada slide"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {Object.keys(slideImages).length > 0 && (
                          <button onClick={() => setSlideImages({})}
                            style={{ background: "none", border: "1px solid #e5e0d5", borderRadius: 7, padding: "7px 12px", fontSize: ".75rem", color: "#9b9690", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif" }}>
                            ✕ Remover
                          </button>
                        )}
                        <button
                          onClick={handleGenerateImages}
                          disabled={imagesLoading}
                          style={{ background: imagesLoading ? "#f0ece0" : "linear-gradient(135deg,#1a2744,#22305c)", color: imagesLoading ? "#9b9690" : "#c9a84c", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: ".78rem", fontWeight: 700, cursor: imagesLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Source Sans 3',sans-serif" }}>
                          {imagesLoading
                            ? <>
                                <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c9a84c", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                                {imagesProgress.current}/{imagesProgress.total} — {imagesProgress.label.slice(0, 25)}...
                              </>
                            : <><span style={{ fontSize: "1rem" }}>✦</span> {Object.keys(slideImages).length > 0 ? "Regenerar" : "Gerar Imagens"}</>
                          }
                        </button>
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    {imagesLoading && imagesProgress.total > 0 && (
                      <div style={{ marginTop: 10, background: "#e5e0d5", borderRadius: 20, height: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "#c9a84c", borderRadius: 20, width: `${(imagesProgress.current / imagesProgress.total) * 100}%`, transition: "width .4s ease" }} />
                      </div>
                    )}
                    {/* Aviso de custo */}
                    {Object.keys(slideImages).length === 0 && !imagesLoading && (
                      <p style={{ marginTop: 8, fontSize: ".68rem", color: "#b0aba2", fontStyle: "italic" }}>
                        ⚠ Requer <code style={{ background: "#ede8e0", padding: "1px 4px", borderRadius: 3 }}>OPENAI_API_KEY</code> no Vercel · ~$0.04 por imagem (DALL-E 3)
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                    <button className="ss-btn-outline" onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0} style={{ padding: "8px 18px", fontSize: ".8rem" }}>← Anterior</button>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {currentSlides.map((_, i) => <button key={i} className="ss-dot-nav" onClick={() => setSlideIndex(i)} style={{ background: i === slideIndex ? "#1a2744" : "#e2ddd5", width: i === slideIndex ? 22 : 8, height: 8, borderRadius: i === slideIndex ? 4 : "50%" }} />)}
                    </div>
                    <button className="ss-btn-outline" onClick={() => setSlideIndex(i => Math.min(currentSlides.length - 1, i + 1))} disabled={slideIndex === currentSlides.length - 1} style={{ padding: "8px 18px", fontSize: ".8rem" }}>Próximo →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8, marginTop: 18 }}>
                    {currentSlides.map((slide, i) => <SlideThumb key={i} slide={slide} theme={slideTheme} active={i === slideIndex} onClick={() => setSlideIndex(i)} />)}
                  </div>
                  <button
                    onClick={() => {
                      const s = currentSlides[slideIndex];
                      setProjecao({ referencia: s.titulo.replace("📖 ", ""), texto: s.conteudo.replace(/^"|"$/g, "") });
                    }}
                    style={{ width: "100%", marginTop: 16, background: "linear-gradient(135deg,#c9a84c,#d4b55e)", color: "#1a2744", border: "none", borderRadius: 9, padding: "13px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    🖥 Projetar Slide Atual (Tela Cheia)
                  </button>
                  <p style={{ marginTop: 14, fontSize: ".75rem", color: "#b0aba2", textAlign: "center", fontStyle: "italic" }}>✎ Clique diretamente no slide para editar qualquer texto</p>
                </div>
              )}

              {/* ── TAB 4: Audio ── */}
              {activeTab === "audio" && (
                <AudioSection
                  data={data}
                  input={input}
                  userEmail={userEmail}
                  setGlobalAudio={setGlobalAudio}
                  setGlobalAudioPlaying={setGlobalAudioPlaying}
                  globalAudioRef={globalAudioRef}
                />
              )}

              {/* ── TAB 5: Bible ── */}
              {activeTab === "biblia" && (
                <BibleSection
                  userEmail={userEmail}
                  onProject={(verso) => setProjecao({ referencia: verso.referencia, texto: verso.texto })}
                  onAddVerseToSlides={(verso) => {
                    // Adiciona um novo slide do tipo citação ao final da lista
                    const newSlide = {
                      id: Date.now(),
                      tipo: "citacao",
                      titulo: `📖 ${verso.referencia}`,
                      conteudo: `"${verso.textoCompleto}"`,
                      subtexto: "Bíblia Sagrada",
                    };
                    // Insere antes do slide de conclusão (último)
                    const updated = [...currentSlides];
                    updated.splice(updated.length - 1, 0, newSlide);
                    setEditedSlides(updated);
                    setSlideIndex(updated.length - 2);
                    setActiveTab("slides");
                  }}
                />
              )}

              {/* ── TAB 6: Videos ── */}
              {activeTab === "videos" && (
                <VideosSection
                  tema={input.tema}
                  referencia={input.referencia}
                  userEmail={userEmail}
                />
              )}
            </div>
          )}
        </section>
      </main>

      <footer style={{ textAlign: "center", padding: "24px", fontSize: ".72rem", color: "#c0bbb5", letterSpacing: ".1em", textTransform: "uppercase", borderTop: "1px solid #e5e0d5" }}>
        SermonStudio AI &nbsp;·&nbsp; Ferramenta Ministerial &nbsp;·&nbsp; Construído com Inteligência Artificial Teológica
      </footer>
    </div>
  );
}
