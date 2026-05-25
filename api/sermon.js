export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Variável ANTHROPIC_API_KEY não encontrada no Vercel." });
  }

  let messages = [];
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
  } catch (e) {
    return res.status(400).json({ error: "Erro ao ler body: " + e.message });
  }

  // Modelos atuais 2025/2026
  const models = [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5",
    "claude-sonnet-4-6",
    "claude-opus-4-5",
    "claude-opus-4-6",
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
        body: JSON.stringify({ model, max_tokens: 4000, messages }),
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch {
        erros[model] = `Resposta não-JSON (${resp.status}): ${text.slice(0, 100)}`;
        continue;
      }

      if (resp.ok) {
        return res.status(200).json(data);
      }

      const errMsg = data?.error?.message || data?.error?.type || text.slice(0, 150);
      erros[model] = `${resp.status}: ${errMsg}`;

      // Se for erro de auth ou crédito, para imediatamente
      if (resp.status === 401 || resp.status === 403 || resp.status === 429) {
        return res.status(resp.status).json({ error: errMsg });
      }

    } catch (err) {
      erros[model] = "Erro de rede: " + err.message;
    }
  }

  return res.status(503).json({
    error: JSON.stringify(erros),
  });
}
