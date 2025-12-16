import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalsLogin } from "../components/ModalsLogin";
import { API_URL } from "../services";

const initialForm = { correo: "", contrasenia: "" };

const decodeJwtPayload = (token) => {
  const payloadB64 = token?.split?.(".")?.[1];
  if (!payloadB64) return null;
  return JSON.parse(atob(payloadB64));
};

export const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [showcontrasenia, setShowcontrasenia] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const openModal = ({ type = "error", title, message }) =>
    setModal({ open: true, type, title, message });

  const closeModal = () =>
    setModal({ open: false, type: "error", title: "", message: "" });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      console.log(data);

      if (!res.ok) {
        openModal({
          type: "error",
          title: "Error de autenticación",
          message:
            data?.message ||
            "Credenciales inválidas. Verifica tu correo y contraseña.",
        });
        return;
      }

      localStorage.setItem("token", data.token);

      const payload = decodeJwtPayload(data.token);
      if (payload?.rol) localStorage.setItem("userRol", payload.rol);
      if (payload?.correo) localStorage.setItem("userCorreo", payload.correo);

      // Ajusta la ruta según tu app:
      navigate("/dashboard");
    } catch {
      openModal({
        type: "error",
        title: "Error de conexión",
        message:
          "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 p-4 sm:p-6">
    {/* Contenedor tipo "card" grande, dos paneles */}
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
      {/* Panel izquierdo */}
      <section className="relative bg-[#f15a29] p-6 text-white sm:p-10 hidden sm:block">
        {/* Decoración sutil */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex h-full flex-col justify-between gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="./src/assets/logo20.png"
                alt="Logo"
                className="h-12 w-auto brightness-0 invert"
              />
              <div className="leading-tight">
                <p className="text-lg font-bold">Sistema Procura</p>
                <p className="text-sm opacity-90">Aprovisionamiento estratégico</p>
              </div>
            </div>

            <h2 className="mt-10 text-2xl font-bold sm:text-3xl">
              Control y compras en un solo lugar
            </h2>
            <p className="mt-2 max-w-md text-sm opacity-90 sm:text-base">
              Accede para gestionar solicitudes, inventario y reportes.
            </p>

            {/* Bullets (sin exceso) */}
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-1">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Gestión inteligente de compras
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Inventario en tiempo real
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Reportes y trazabilidad
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs opacity-85">
            © 2025 Corporación Business & Development
          </div>
        </div>
      </section>

      {/* Panel derecho (form) */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Correo</span>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={onChange}
                autoComplete="email"
                required
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Contraseña</span>
              <div className="relative mt-1">
                <input
                  name="contrasenia"
                  type={showcontrasenia ? "text" : "password"}
                  value={form.contrasenia}
                  onChange={onChange}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-20 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowcontrasenia((v) => !v)}
                  className="absolute inset-y-0 right-2 my-2 rounded-xl px-3 text-sm font-medium text-gray-500 hover:bg-gray-100"
                >
                  {showcontrasenia ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          {/* Footer solo mobile (porque en desktop ya está en panel izq) */}
          <p className="mt-6 text-center text-xs text-gray-400 lg:hidden">
            © 2025 Corporación Business & Development
          </p>
        </div>
      </section>
    </div>

    <ModalsLogin
      open={modal.open}
      type={modal.type}
      title={modal.title}
      message={modal.message}
      onClose={closeModal}
    />
  </div>
);

};
