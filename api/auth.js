export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: "Body inválido." });
    }
  }

  const email = (body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "E-mail não informado." });
  }

  // Lista de e-mails separados por vírgula no Vercel
  // Ex: "joao@gmail.com,maria@hotmail.com,pedro@icloud.com"
  const listaRaw = process.env.ALLOWED_EMAILS || "";
  const lista = listaRaw
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  // Se a variável não estiver configurada, bloqueia tudo
  if (lista.length === 0) {
    console.log(`[AUTH] ALLOWED_EMAILS não configurado. Acesso negado para: ${email}`);
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  if (!lista.includes(email)) {
    console.log(`[AUTH] Acesso negado — e-mail não autorizado: ${email}`);
    return res.status(401).json({ error: "E-mail não autorizado." });
  }

  console.log(`[AUTH] Acesso concedido: ${email}`);
  return res.status(200).json({ ok: true, email });
}
