import { useState } from "react";
import { C, S } from "../../config/theme";
import { SUPABASE_URL, SUPABASE_KEY, saveSession } from "../../config/supabase";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Ingresa tu email y contraseña"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
      saveSession(data); // guarda access+refresh token y agenda renovación automática
      const token = data.access_token;
      const userId = data.user?.id;
      // Obtener perfil con rol
      const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${userId}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
      });
      const perfiles = await perfilRes.json();
      const perfil = perfiles?.[0] || {};
      onLogin({
        token,
        id: perfil.id,
        email: data.user?.email,
        nombre: perfil.nombre || data.user?.email,
        rol: perfil.rol || 'profesional',
        evento_id: perfil.evento_id || null,
        profesion: perfil.profesion || '',
      });
    } catch (e) { setError("Error de conexión"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: 420, padding: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {/* Logo animado: el anillo de triaje se dibuja verde→amarillo→rojo, late la cruz y aparece el nombre */}
          <svg viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, margin: "0 auto 8px", display: "block" }}>
            <style>{`
              @keyframes t360dibujar { from { stroke-dashoffset: 62.2; } to { stroke-dashoffset: 0; } }
              @keyframes t360pop { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }
              @keyframes t360texto { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
              /* Estado base = visible; la animación oculta solo al inicio (fill backwards).
                 Si el navegador no anima (iOS antiguos), el logo igual se ve completo. */
              .t360-arco { stroke-dasharray: 62.2; stroke-dashoffset: 0; animation: t360dibujar .5s ease-out backwards; }
              .t360-a2 { animation-delay: .4s; }
              .t360-a3 { animation-delay: .8s; }
              .t360-cruz { transform-box: fill-box; transform-origin: center; animation: t360pop .35s cubic-bezier(.34,1.56,.64,1) 1.2s backwards; }
              .t360-nombre { animation: t360texto .5s ease-out 1.5s backwards; }
              .t360-tag { animation: t360texto .5s ease-out 1.75s backwards; }
              @media (prefers-reduced-motion: reduce) {
                .t360-arco, .t360-cruz, .t360-nombre, .t360-tag { animation: none; }
              }
            `}</style>
            <g>
              <path className="t360-arco" d="M 50 16 A 34 34 0 0 1 82.92 58.51" fill="none" stroke="#34D88B" strokeWidth="10" strokeLinecap="round"/>
              <path className="t360-arco t360-a2" d="M 79.44 67 A 34 34 0 0 1 26.17 74.25" fill="none" stroke="#FCD34D" strokeWidth="10" strokeLinecap="round"/>
              <path className="t360-arco t360-a3" d="M 20.56 67 A 34 34 0 0 1 40.92 17.24" fill="none" stroke="#F87171" strokeWidth="10" strokeLinecap="round"/>
            </g>
            <g className="t360-cruz">
              <rect x="37" y="44" width="26" height="13" rx="3.5" fill="#FFFFFF"/>
              <rect x="43.5" y="37.5" width="13" height="26" rx="3.5" fill="#FFFFFF"/>
            </g>
            <g className="t360-nombre">
              <text x="104" y="56" fill="#e8f0f8" fontSize="27" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="800" letterSpacing="-0.5">
                TRIAGE<tspan fill="#00c2a8">360</tspan>
              </text>
            </g>
            <g className="t360-tag">
              <text x="105" y="74" fill="#7a90a8" fontSize="9" fontFamily="'DM Sans', Arial, sans-serif" letterSpacing="3">GESTIÓN CLÍNICA INTELIGENTE</text>
            </g>
          </svg>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Email</label>
          <input style={S.input} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Contraseña</label>
          <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>{error}</div>}
        <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", fontSize: 15, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <div style={{ marginTop: 20, padding: "12px 14px", background: C.surface2, borderRadius: 8, fontSize: 12, color: C.textMuted }}>
          <strong>💡 Primera vez:</strong> Los usuarios son creados por el administrador en Supabase → Authentication → Users
        </div>
      </div>
    </div>
  );
}
