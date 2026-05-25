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
    try { body = JSON.parse(body); } catch(e) {
      return res.status(400).json({ error: "Falha ao parsear body: " + e.message });
    }
  }

  const payload = {
    model: "claude-3-5-haiku-20241022",
    max_tokens: 4000,
    messages: body?.messages || [],
  };

  let response, text, data;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    text = await response.text();

    try {
      data = JSON.parse(text);
    } catch {
      // Response não é JSON — retorna o texto bruto para diagnóstico
      return res.status(response.status).json({
        error: `HTTP ${response.status} — Resposta não-JSON da Anthropic: ${text.slice(0, 300)}`
      });
    }

    if (!response.ok) {
      const msg = data?.error?.message || data?.error?.type || JSON.stringify(data);
      return res.status(response.status).json({ error: `Anthropic ${response.status}: ${msg}` });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
