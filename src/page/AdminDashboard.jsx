// src/pages/dashboard/AdminDashboard.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificacionesPanel } from "../components/NotificacionesPanel";
import { useNotificaciones } from "../hooks/useNotifications";
import { DashboardHeader } from "../components/DashboardHeader";

export const AdminDashboard = ({ token, userName }) => {
  const navigate = useNavigate();
  const { notificacionesNoLeidas, actualizarContador } = useNotificaciones();

  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const quickActions = useMemo(
    () => [
      { title: "Gestionar Solicitudes", description: "Revisar y aprobar", link: "/solicitudes/gestion", primary: true },
      { title: "Reportes Generales", description: "Análisis de datos", link: "/reportes", primary: false },
    ],
    []
  );

  const logout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userCorreo");
    localStorage.removeItem("userRol");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <DashboardHeader
        userName={userName}
        roleLabel="Administrador de Procura"
        notificacionesNoLeidas={notificacionesNoLeidas}
        onOpenNotificaciones={() => setNotificacionesOpen(true)}
        onLogout={logout}
      />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">Panel de administración</h2>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">Gestiona y aprueba solicitudes de compra.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.link}
              to={a.link}
              className={`rounded-2xl p-5 transition hover:-translate-y-0.5 ${
                a.primary ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg" : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-base font-bold">{a.title}</p>
              <p className={`mt-1 text-sm ${a.primary ? "text-white/90" : "text-gray-600"}`}>{a.description}</p>
            </Link>
          ))}
        </div>

        {/* Aquí renderiza el componente "SolicitudesRecientes" SOLO con vista admin */}
        {/* <SolicitudesRecientes token={token} role="admin" /> */}
      </main>

      <NotificacionesPanel
        isOpen={notificacionesOpen}
        onClose={() => {
          setNotificacionesOpen(false);
          actualizarContador();
        }}
      />

      {/* Reemplaza tu modal actual por un componente LogoutModal reutilizable */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 text-center">¿Cerrar sesión?</h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Tendrás que iniciar sesión nuevamente para acceder.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setShowLogoutModal(false)} className="rounded-xl bg-gray-100 px-4 py-3 font-semibold">
                Cancelar
              </button>
              <button onClick={confirmLogout} className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
