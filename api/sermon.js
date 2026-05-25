export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chave ANTHROPIC_API_KEY não encontrada." });
  }

  let messages = [];
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
  } catch (e) {
    return res.status(400).json({ error: "Erro ao ler body: " + e.message });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4000,
      messages,
    }),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    return res.status(500).json({ error: "Resposta inválida da API: " + text.slice(0, 300) });
  }

  return res.status(response.status).json(data);
}
