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

  // Lista de modelos para tentar em ordem
  const models = [
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
    "claude-3-5-sonnet-20240620",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
  ];

  const erros = {};

  for (const model of models) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
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

      // Sucesso!
      if (resp.ok) {
        return res.status(200).json(data);
      }

      // Guarda o erro e tenta próximo
      const errMsg = data?.error?.message || data?.error?.type || text.slice(0, 150);
      erros[model] = `${resp.status}: ${errMsg}`;

      // Se não for 404 (modelo não encontrado), para aqui
      if (resp.status !== 404) {
        return res.status(resp.status).json({
          error: errMsg,
          model_tentado: model,
        });
      }

    } catch (err) {
      erros[model] = "Erro de rede: " + err.message;
    }
  }

  // Nenhum modelo funcionou
  return res.status(503).json({
    error: "Nenhum modelo disponível. Detalhes:",
    erros_por_modelo: erros,
  });
}
