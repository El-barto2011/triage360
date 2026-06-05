import { useState } from "react";
import { C, S } from "../../config/theme";
import { SUPABASE_URL, SUPABASE_KEY } from "../../config/supabase";

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
          <svg viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 300, margin: "0 auto 8px", display: "block" }}>
            <defs>
              <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5c8"/>
                <stop offset="100%" stopColor="#00a896"/>
              </linearGradient>
              <filter id="gl">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="bgG" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00c2a8" stopOpacity="0.12"/>
                <stop offset="100%" stopColor="#00c2a8" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="url(#bgG)"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="#1e2d3d" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="url(#lg1)" strokeWidth="2.8"
              strokeDasharray="170 56" strokeDashoffset="-28" strokeLinecap="round" filter="url(#gl)"/>
            <circle cx="74" cy="26" r="2.5" fill="#00e5c8" filter="url(#gl)"/>
            <circle cx="26" cy="26" r="2.5" fill="#00a896" filter="url(#gl)"/>
            <rect x="38" y="45" width="24" height="8" rx="2.5" fill="url(#lg1)" filter="url(#gl)"/>
            <rect x="46" y="37" width="8" height="24" rx="2.5" fill="url(#lg1)" filter="url(#gl)"/>
            <polyline points="14,50 20,50 24,41 28,59 32,46 36,52 44,50 56,50 60,42 64,58 68,50 72,50 76,44 79,55 83,50 88,50"
              fill="none" stroke="#00c2a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            <line x1="103" y1="22" x2="103" y2="78" stroke="#1e2d3d" strokeWidth="1"/>
            <text x="118" y="44" fill="#e8f0f8" fontSize="26" fontFamily="Arial Black, sans-serif" fontWeight="900" letterSpacing="1">
              TRIAGE<tspan fill="url(#lg1)">360</tspan>
            </text>
            <text x="118" y="60" fill="#7a90a8" fontSize="9" fontFamily="Arial, sans-serif" letterSpacing="3">GESTIÓN CLÍNICA INTELIGENTE</text>
            <text x="118" y="78" fill="#2d3f52" fontSize="8" fontFamily="Arial, sans-serif" letterSpacing="1">Powered by <tspan fill="#00c2a8" fontWeight="700">TRIAGE360</tspan></text>
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
