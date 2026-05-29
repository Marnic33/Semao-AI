// Geração de imagens via Pollinations AI — 100% gratuita, sem chave de API
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: "Body inválido." }); }
  }

  // Valida e-mail
  const email = (body?.user_email || "").trim().toLowerCase();
  const lista = (process.env.ALLOWED_EMAILS || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) {
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  const { prompt } = body;
  if (!prompt) return res.status(400).json({ error: "Prompt não informado." });

  try {
    // Pollinations: gera imagem via URL direta
    // Documentação: https://pollinations.ai
    const seed = Math.floor(Math.random() * 1000000);
    const params = new URLSearchParams({
      width: "1792",
      height: "1024",       // proporção 16:9
      seed: String(seed),
      model: "flux",        // flux, turbo, ou flux-realism
      nologo: "true",
      enhance: "true",      // melhora o prompt automaticamente
    });

    const promptEncoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${promptEncoded}?${params}`;

    console.log(`[POLLINATIONS] Gerando imagem para ${email} — seed ${seed}`);

    // Busca a imagem (pode demorar 5-15 segundos)
    const resp = await fetch(url, {
      headers: { "Accept": "image/jpeg,image/png,image/webp" },
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.log(`[POLLINATIONS] Erro ${resp.status}: ${errText.slice(0, 200)}`);
      return res.status(resp.status).json({
        error: `Pollinations: HTTP ${resp.status}`,
      });
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buf = await resp.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const dataUri = `data:${contentType};base64,${b64}`;

    console.log(`[POLLINATIONS] Imagem gerada — ${(buf.byteLength / 1024).toFixed(0)} KB`);
    return res.status(200).json({ image: dataUri });

  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
