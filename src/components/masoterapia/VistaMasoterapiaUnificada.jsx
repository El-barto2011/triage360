import { useState } from "react";
import { C, S } from "../../config/theme";
import { VistaMasoterapiaMasiva } from "./VistaMasoterapiaMasiva";
import { VistaMasoterapiaEspecifica } from "./VistaMasoterapiaEspecifica";

export function VistaMasoterapiaUnificada({ usuario }) {
  const [subTab, setSubTab] = useState("masiva");

  return (
    <div>
      {/* Subtabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${C.border}`,
        paddingBottom: 8
      }}>
        <button
          style={{
            ...S.btn(subTab === "masiva" ? "primary" : "secondary"),
            flex: 1,
            fontSize: 14,
            fontWeight: 600
          }}
          onClick={() => setSubTab("masiva")}
        >
          🙌 Masiva
        </button>
        <button
          style={{
            ...S.btn(subTab === "especifica" ? "primary" : "secondary"),
            flex: 1,
            fontSize: 14,
            fontWeight: 600
          }}
          onClick={() => setSubTab("especifica")}
        >
          📋 Específica
        </button>
      </div>

      {/* Contenido según subtab */}
      {subTab === "masiva" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.textMuted }}>Masoterapia Masiva</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Contador de masajes para eventos masivos</div>
          </div>
          <VistaMasoterapiaMasiva usuario={usuario} />
        </div>
      )}

      {subTab === "especifica" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.textMuted }}>Masoterapia Específica</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Fichas individuales para torneos</div>
          </div>
          <VistaMasoterapiaEspecifica usuario={usuario} />
        </div>
      )}
    </div>
  );
}
