// Gera roteiro de podcast (2 vozes) via Claude e converte cada fala em áudio via OpenAI TTS
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada." });
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body inválido." }); } }

  const email = (body?.user_email || "").trim().toLowerCase();
  const lista = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) return res.status(401).json({ error: "Acesso não autorizado." });

  const { etapa, sermao, roteiro, vozHost, vozConvidado } = body;

  // ── ETAPA 1: gerar roteiro do diálogo ──
  if (etapa === "roteiro") {
    const prompt = `Você é um roteirista de podcast cristão. Crie um diálogo natural e envolvente entre dois apresentadores discutindo o sermão abaixo, no estilo "Audio Overview".

APRESENTADORES:
- HOST (Ana): apresentadora curiosa que conduz a conversa, faz perguntas e conecta com o dia a dia.
- CONVIDADO (Pedro): teólogo que explica os pontos com profundidade mas de forma acessível.

REGRAS:
- Tom caloroso e conversacional, como um podcast real
- Comece com uma abertura calorosa ("Olá, bem-vindos...")
- Alterne falas naturalmente, com reações ("Exato!", "Que interessante", "Nossa...")
- 12 a 16 falas no total
- Cada fala com no máximo 3 frases
- Termine com um encerramento inspirador
- Retorne APENAS JSON puro, sem markdown:

{
  "titulo": "Título do episódio",
  "falas": [
    { "locutor": "host", "texto": "..." },
    { "locutor": "convidado", "texto": "..." }
  ]
}

SERMÃO:
Título: ${sermao.tituloFormatado}
Texto base: ${sermao.referencia}
Introdução: ${sermao.introducao}
Pontos: ${sermao.pontos}
Conclusão: ${sermao.conclusao}

APENAS JSON.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey.trim(), "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: data?.error?.message || "Erro ao gerar roteiro" });
      const raw = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(500).json({ error: "Erro no roteiro: " + err.message });
    }
  }

  // ── ETAPA 2: gerar áudio de uma fala específica ──
  if (etapa === "audio") {
    const { texto, locutor } = body;
    const voz = locutor === "host" ? (vozHost || "nova") : (vozConvidado || "onyx");
    try {
      const resp = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "tts-1", input: texto, voice: voz, response_format: "mp3" }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({ error: err?.error?.message || "Erro no TTS" });
      }
      const buf = await resp.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      return res.status(200).json({ audio: `data:audio/mp3;base64,${b64}` });
    } catch (err) {
      return res.status(500).json({ error: "Erro no áudio: " + err.message });
    }
  }

  return res.status(400).json({ error: "Etapa inválida." });
}
