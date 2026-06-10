import React from "react";

/**
 * ErrorBoundary global: si un componente revienta en render,
 * muestra una pantalla de recuperación en vez de dejar todo en blanco.
 * Crítico en terreno: un bug puntual no puede paralizar la carpa médica.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0d1b24", color: "#e8f0f8", fontFamily: "'DM Sans', sans-serif", padding: 24, textAlign: "center",
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Algo falló en esta pantalla</div>
          <div style={{ fontSize: 14, color: "#7a90a8", lineHeight: 1.7, marginBottom: 24 }}>
            El error quedó registrado. Tus datos están a salvo — recarga para continuar donde estabas.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#00c2a8", color: "#0d1b24", fontWeight: 800, fontSize: 15,
              padding: "12px 32px", borderRadius: 10, border: "none", cursor: "pointer",
            }}
          >
            Recargar TRIAGE360
          </button>
          <div style={{ fontSize: 11, color: "#2d3f52", marginTop: 20 }}>
            Si se repite, avisa al administrador · {String(this.state.error?.message || "").slice(0, 120)}
          </div>
        </div>
      </div>
    );
  }
}
