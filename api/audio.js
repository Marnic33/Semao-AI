export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada no Vercel." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body inválido." }); } }

  const email = (body?.user_email || "").trim().toLowerCase();
  const lista = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) return res.status(401).json({ error: "Acesso não autorizado." });

  const { text, voice = "onyx", speed = 1.0 } = body;
  if (!text?.trim()) return res.status(400).json({ error: "Texto não informado." });

  // ── Divide o texto em pedaços de até 3800 chars, quebrando em fim de frase ──
  const MAX = 3800;
  const chunks = [];
  let restante = text.trim();
  while (restante.length > 0) {
    if (restante.length <= MAX) { chunks.push(restante); break; }
    // procura o último ponto/quebra dentro do limite
    let corte = restante.lastIndexOf(". ", MAX);
    if (corte < MAX * 0.5) corte = restante.lastIndexOf(" ", MAX); // se não achar, corta no espaço
    if (corte <= 0) corte = MAX;
    chunks.push(restante.slice(0, corte + 1));
    restante = restante.slice(corte + 1).trim();
  }

  try {
    const buffers = [];
    for (let i = 0; i < chunks.length; i++) {
      const resp = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",   // tts-1 é mais rápido — importante para evitar timeout em textos longos
          input: chunks[i],
          voice,
          speed,
          response_format: "mp3",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({ error: err?.error?.message || `Erro no trecho ${i + 1}` });
      }

      const buf = Buffer.from(await resp.arrayBuffer());
      buffers.push(buf);
    }

    // Concatena todos os MP3 (funciona para reprodução sequencial)
    const audioBuffer = Buffer.concat(buffers);
    const b64 = audioBuffer.toString("base64");

    console.log(`[AUDIO] Narração gerada para: ${email} — ${text.length} chars em ${chunks.length} partes — voz: ${voice}`);
    return res.status(200).json({ audio: `data:audio/mp3;base64,${b64}`, chars: text.length, partes: chunks.length });

  } catch (err) {
    return res.status(500).json({ error: "Erro: " + err.message });
  }
}
