export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body inválido." }); } }

  // Valida e-mail
  const email = (body?.user_email || "").trim().toLowerCase();
  const lista = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) return res.status(401).json({ error: "Acesso não autorizado." });

  const { tipo, livro, capitulo, versiculo, query } = body;

  try {
    let url;
    if (tipo === "passagem") {
      // Busca um versículo ou passagem: ex "joão 3:16" ou "filipenses 4:6-7"
      const ref = encodeURIComponent(`${livro} ${capitulo}${versiculo ? ":" + versiculo : ""}`);
      url = `https://bible-api.com/${ref}?translation=almeida`;
    } else if (tipo === "capitulo") {
      // Busca capítulo inteiro
      const ref = encodeURIComponent(`${livro} ${capitulo}`);
      url = `https://bible-api.com/${ref}?translation=almeida`;
    } else if (tipo === "busca") {
      // Busca por texto (usa nova abordagem com Strong's via livre)
      return res.status(400).json({ error: "Busca por palavra ainda não implementada." });
    } else {
      return res.status(400).json({ error: "Tipo inválido." });
    }

    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok || data.error) {
      return res.status(resp.status || 500).json({ error: data.error || "Referência não encontrada." });
    }

    // Normaliza a resposta
    const versiculos = (data.verses || []).map(v => ({
      livro: v.book_name,
      capitulo: v.chapter,
      versiculo: v.verse,
      texto: v.text?.trim().replace(/\s+/g, " "),
    }));

    return res.status(200).json({
      referencia: data.reference,
      textoCompleto: data.text?.trim().replace(/\s+/g, " "),
      versiculos,
      traducao: "Almeida (almeida)",
    });

  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
