export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada no Vercel." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body inválido." }); } }

  // Valida e-mail
  const email = (body?.user_email || "").trim().toLowerCase();
  const lista = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) return res.status(401).json({ error: "Acesso não autorizado." });

  const { text, voice = "onyx", speed = 1.0 } = body;
  if (!text?.trim()) return res.status(400).json({ error: "Texto não informado." });

  // OpenAI TTS suporta até ~4096 chars por requisição
  // Texto maior: truncamos com aviso
  const maxChars = 4000;
  const textoFinal = text.length > maxChars ? text.slice(0, maxChars) + "..." : text;

  try {
    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1-hd",   // tts-1 (rápido) ou tts-1-hd (qualidade superior)
        input: textoFinal,
        voice,               // alloy, echo, fable, onyx, nova, shimmer
        speed,               // 0.25–4.0
        response_format: "mp3",
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({ error: err?.error?.message || "Erro na OpenAI TTS API" });
    }

    // Devolve o MP3 diretamente como buffer
    const audioBuffer = await resp.arrayBuffer();
    const b64 = Buffer.from(audioBuffer).toString("base64");

    console.log(`[AUDIO] Narração gerada para: ${email} — ${textoFinal.length} chars — voz: ${voice}`);
    return res.status(200).json({ audio: `data:audio/mp3;base64,${b64}`, chars: textoFinal.length });

  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
