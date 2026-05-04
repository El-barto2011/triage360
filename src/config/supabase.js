export const SUPABASE_URL = "https://dnlvzwrujosuckdzmffx.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHZ6d3J1am9zdWNrZHptZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg0MzAsImV4cCI6MjA5MDIzNDQzMH0.Bhw_ws8XNzWxJXBn1TzLjNppBD9CRWDTuEb_t92G9ZE";

export const sb = async (endpoint, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Prefer": "return=representation" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) { const e = await res.text(); console.error("Supabase error:", e); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};
