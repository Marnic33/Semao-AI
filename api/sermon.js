export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: "Body inválido." });
    }
  }

  // ── Valida e-mail em toda requisição ──
  const email = (body?.user_email || "").trim().toLowerCase();
  const listaRaw = process.env.ALLOWED_EMAILS || "";
  const lista = listaRaw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

  if (lista.length > 0 && !lista.includes(email)) {
    console.log(`[SERMON] Requisição bloqueada — e-mail inválido: ${email}`);
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  console.log(`[SERMON] Gerando sermão para: ${email}`);

  const messages = body?.messages || [];
  const models = [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5",
    "claude-sonnet-4-6",
  ];

  const erros = {};
  for (const model of models) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: 8000, messages }),
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch {
        erros[model] = `Resposta não-JSON (${resp.status})`; continue;
      }
      if (resp.ok) return res.status(200).json(data);

      const errMsg = data?.error?.message || data?.error?.type || text.slice(0, 150);
      erros[model] = `${resp.status}: ${errMsg}`;

      if (resp.status === 401 || resp.status === 403 || resp.status === 429) {
        return res.status(resp.status).json({ error: errMsg });
      }
    } catch (err) {
      erros[model] = "Erro de rede: " + err.message;
    }
  }

  return res.status(503).json({ error: JSON.stringify(erros) });
}
