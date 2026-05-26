import { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    if (!emailValido) { setErro("Digite um e-mail válido."); return; }
    setErro(""); setLoading(true);

    try {
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await resp.json();

      if (resp.status === 401) {
        setErro("Este e-mail não está na lista de acesso. Entre em contato com o administrador.");
        return;
      }
      if (!resp.ok) {
        setErro("Erro ao verificar acesso. Tente novamente.");
        return;
      }

      onLogin(email.trim().toLowerCase());
    } catch {
      setErro("Erro de conexão. Verifique sua internet.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0d1829 0%,#1a2744 60%,#1e2f55 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Source Sans 3', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap');
        *{box-sizing:border-box}
        .login-input{width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(201,168,76,0.25);border-radius:9px;padding:13px 16px;font-family:'Source Sans 3',sans-serif;font-size:.95rem;color:#f5f0e8;outline:none;transition:all .2s;text-align:center}
        .login-input::placeholder{color:rgba(245,240,232,0.35)}
        .login-input:focus{border-color:#c9a84c;background:rgba(255,255,255,0.1);box-shadow:0 0 0 3px rgba(201,168,76,.15)}
        .login-btn{width:100%;background:#c9a84c;color:#1a2744;border:none;border-radius:9px;padding:14px;font-family:'Source Sans 3',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;transition:all .2s}
        .login-btn:hover:not(:disabled){background:#d4b55e;transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,.35)}
        .login-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>

      {/* Orbs decorativos */}
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%)", bottom: "-50px", left: "-50px", pointerEvents: "none" }} />

      <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 420, textAlign: "center", animation: "fadeIn .5s ease", position: "relative" }}>

        {/* Logo animado */}
        <div style={{ width: 72, height: 72, border: "1.5px solid rgba(201,168,76,0.6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#c9a84c", fontSize: 32, background: "rgba(201,168,76,0.08)", animation: "float 3s ease-in-out infinite" }}>✦</div>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", fontWeight: 700, color: "#f5f0e8", marginBottom: 6, letterSpacing: ".02em" }}>SermonStudio AI</h1>
        <p style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(201,168,76,0.7)", marginBottom: 36 }}>Ferramenta de Preparação Ministerial</p>

        <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 28 }}>
          <p style={{ fontSize: ".82rem", color: "rgba(245,240,232,0.7)", lineHeight: 1.6 }}>
            Esta ferramenta está em <strong style={{ color: "#c9a84c" }}>fase beta</strong>.<br />
            Digite seu e-mail para verificar seu acesso.
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <input
            className="login-input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setErro(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && emailValido && handleSubmit()}
            autoFocus
          />
        </div>

        {erro && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: ".8rem", padding: "10px 14px", borderRadius: 8, marginBottom: 14, lineHeight: 1.55, textAlign: "left" }}>
            {erro}
          </div>
        )}

        <button className="login-btn" onClick={handleSubmit} disabled={loading || !emailValido}>
          {loading
            ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #1a2744", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Verificando acesso...
              </span>
            : "Solicitar Acesso →"
          }
        </button>

        <p style={{ marginTop: 28, fontSize: ".7rem", color: "rgba(245,240,232,0.25)", letterSpacing: ".08em", lineHeight: 1.7 }}>
          Sem acesso? Entre em contato com<br />
          <span style={{ color: "rgba(201,168,76,0.5)" }}>contato@trinitysolarisbrasil.com.br</span>
        </p>
      </div>
    </div>
  );
}
