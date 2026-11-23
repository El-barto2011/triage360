/* Pruebas de pantalla del hallazgo 14 (recuperar y cambiar contraseña).
   Supabase Auth se simula con fetch falso; no se toca ningún dato real. */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Login } from "./Login";
import { RecuperarPassword } from "./RecuperarPassword";
import { Configuracion } from "../admin/Configuracion";
import { clearSession } from "../../config/supabase";

const resp = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
afterEach(() => { delete global.fetch; clearSession(); });

describe("Login → ¿Olvidaste tu contraseña?", () => {
  it("pide el enlace y muestra el mismo mensaje exista o no la cuenta", async () => {
    global.fetch = jest.fn(async () => resp(200));
    render(<Login onLogin={() => {}} />);
    fireEvent.click(screen.getByText("¿Olvidaste tu contraseña?"));
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "persona@ejemplo.cl" } });
    fireEvent.click(screen.getByText("Enviar enlace"));
    expect(await screen.findByRole("status")).toHaveTextContent(/Si el correo está registrado/);
    expect(global.fetch.mock.calls[0][0]).toContain("/auth/v1/recover");
  });

  it("muestra el aviso tras cambiar la contraseña", () => {
    render(<Login onLogin={() => {}} aviso="Contraseña actualizada. Ingresa con tu nueva contraseña." />);
    expect(screen.getByRole("status")).toHaveTextContent(/Contraseña actualizada/);
  });
});

describe("RecuperarPassword (pantalla del enlace)", () => {
  const rec = { access_token: "TEMP", refresh_token: "R", expires_at: 2000000000 };

  it("valida antes de enviar", async () => {
    global.fetch = jest.fn();
    render(<RecuperarPassword recuperacion={rec} onTerminar={() => {}} />);
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "corta1" } });
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "corta1" } });
    fireEvent.click(screen.getByText("Guardar contraseña"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/al menos 10/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("guarda con la sesión del enlace, la cierra y vuelve al login", async () => {
    global.fetch = jest.fn(async () => resp(200));
    const onTerminar = jest.fn();
    render(<RecuperarPassword recuperacion={rec} onTerminar={onTerminar} />);
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "triage2026x" } });
    fireEvent.change(screen.getByLabelText("Repite la contraseña"), { target: { value: "triage2026x" } });
    fireEvent.click(screen.getByText("Guardar contraseña"));
    await waitFor(() => expect(onTerminar).toHaveBeenCalledWith(expect.stringMatching(/actualizada/)));
    const urls = global.fetch.mock.calls.map(c => c[0]);
    expect(urls[0]).toMatch(/\/auth\/v1\/user$/);
    expect(urls[1]).toMatch(/\/auth\/v1\/logout$/);
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer TEMP");
  });

  it("con enlace expirado solo ofrece volver al login", () => {
    const onTerminar = jest.fn();
    render(<RecuperarPassword recuperacion={{ error: "El enlace no es válido o ya expiró. Solicita uno nuevo." }} onTerminar={onTerminar} />);
    expect(screen.queryByLabelText("Nueva contraseña")).toBeNull();
    fireEvent.click(screen.getByText("Volver al inicio de sesión"));
    expect(onTerminar).toHaveBeenCalledWith(null);
  });
});

describe("Configuración → Cambiar contraseña", () => {
  const profesional = { email: "persona@ejemplo.cl", nombre: "Persona Prueba", rol: "profesional", profesion: "Paramédico" };
  const admin = { ...profesional, rol: "admin" };

  it("un profesional ve su cuenta y el cambio de contraseña, no la configuración de la organización", () => {
    render(<Configuracion industriaKey="eventos" setIndustriaKey={() => {}} usuario={profesional} />);
    expect(screen.getByText("🔒 Cambiar contraseña")).toBeInTheDocument();
    expect(screen.queryByText("🏭 Tipo de Organización")).toBeNull();
    expect(screen.queryByText("🎨 Apariencia")).toBeNull();
  });

  it("el admin sigue viendo todo", () => {
    render(<Configuracion industriaKey="eventos" setIndustriaKey={() => {}} usuario={admin} />);
    expect(screen.getByText("🏭 Tipo de Organización")).toBeInTheDocument();
    expect(screen.getByText("🔒 Cambiar contraseña")).toBeInTheDocument();
  });

  it("rechaza si la contraseña actual es incorrecta y no cambia nada", async () => {
    global.fetch = jest.fn(async () => resp(400));
    render(<Configuracion industriaKey="eventos" setIndustriaKey={() => {}} usuario={profesional} />);
    fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: "mala" } });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "triage2026x" } });
    fireEvent.change(screen.getByLabelText("Repite la nueva"), { target: { value: "triage2026x" } });
    fireEvent.click(screen.getAllByText("Cambiar contraseña").find(el => el.tagName === "BUTTON"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/actual no es correcta/);
    expect(global.fetch).toHaveBeenCalledTimes(1);   // solo la verificación, ningún PUT
  });

  it("con la contraseña actual correcta, cambia la contraseña", async () => {
    global.fetch = jest.fn(async (url) => String(url).includes("grant_type=password")
      ? resp(200, { access_token: "NUEVO", refresh_token: "R2", expires_in: 3600 })
      : resp(200));
    render(<Configuracion industriaKey="eventos" setIndustriaKey={() => {}} usuario={profesional} />);
    fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: "anterior2025" } });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "triage2026x" } });
    fireEvent.change(screen.getByLabelText("Repite la nueva"), { target: { value: "triage2026x" } });
    fireEvent.click(screen.getAllByText("Cambiar contraseña").find(el => el.tagName === "BUTTON"));
    expect(await screen.findByRole("status")).toHaveTextContent(/Contraseña actualizada/);
    const put = global.fetch.mock.calls.find(c => c[1]?.method === "PUT");
    expect(put[1].headers.Authorization).toBe("Bearer NUEVO");
  });
});

describe("App abierta desde el enlace del correo", () => {
  it("muestra la pantalla de nueva contraseña y borra los tokens de la URL", async () => {
    const App = require("../../App").default;
    window.history.replaceState(null, "", "/#access_token=TEMP&expires_in=3600&refresh_token=R&token_type=bearer&type=recovery");
    render(<App />);
    expect(await screen.findByText("🔒 Nueva contraseña")).toBeInTheDocument();
    expect(window.location.hash).toBe("");
    window.history.replaceState(null, "", "/");
  });
});
