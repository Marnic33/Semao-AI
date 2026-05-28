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

  const { prompt } = body;
  if (!prompt) return res.status(400).json({ error: "Prompt não informado." });

  try {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",   // proporção 16:9
        quality: "standard", // "hd" para máxima qualidade (~$0.08)
        response_format: "b64_json",
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || "Erro na OpenAI API";
      return res.status(resp.status).json({ error: msg });
    }

    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "Imagem não retornada." });

    console.log(`[IMAGINE] Imagem gerada para: ${email}`);
    return res.status(200).json({ image: `data:image/png;base64,${b64}` });

  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
