export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY não configurada." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: "Body inválido." });
    }
  }

  // Valida e-mail igual às outras rotas
  const email = (body?.user_email || "").trim().toLowerCase();
  const listaRaw = process.env.ALLOWED_EMAILS || "";
  const lista = listaRaw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (lista.length > 0 && !lista.includes(email)) {
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  const query = body?.query || "";
  if (!query.trim()) {
    return res.status(400).json({ error: "Query não informada." });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "4",
      key: youtubeKey,
      relevanceLanguage: "pt",
      regionCode: "BR",
      videoEmbeddable: "true",
    });

    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
    const data = await resp.json();

    if (!resp.ok) {
      const msg = data?.error?.message || "Erro na YouTube API";
      return res.status(resp.status).json({ error: msg });
    }

    // Formata os resultados
    const videos = (data.items || []).map(item => ({
      id: item.id?.videoId,
      titulo: item.snippet?.title,
      canal: item.snippet?.channelTitle,
      descricao: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      publicadoEm: item.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id?.videoId}`,
    }));

    console.log(`[YOUTUBE] Busca: "${query}" — ${videos.length} vídeos para ${email}`);
    return res.status(200).json({ videos });

  } catch (err) {
    return res.status(500).json({ error: "Erro de rede: " + err.message });
  }
}
