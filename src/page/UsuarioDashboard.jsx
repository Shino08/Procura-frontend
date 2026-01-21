// src/pages/dashboard/ClienteDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificacionesPanel } from "../components/NotificacionesPanel";
import { useNotificaciones } from "../hooks/useNotifications";
import { SolicitudesRecientes } from "../components/SolicitudesRecientes";
import { API_URL } from "../services";

export const UsuarioDashboard = ({ token, userName }) => {
  const navigate = useNavigate();
  const { notificacionesNoLeidas, actualizarContador } = useNotificaciones();
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    solicitudesActivas: 0,
    solicitudesCompletadas: 0,
    totalPresupuesto: 0,
    rendimiento: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas del usuario
  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/archivos/usuario`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const archivos = Array.isArray(data?.archivos) ? data.archivos : [];

          const activas = archivos.filter(a => a.estado !== "Completada" && a.estado !== "Rechazada").length;
          const completadas = archivos.filter(a => a.estado === "Completada").length;
          const total = archivos.length;
          const rendimiento = total > 0 ? Math.round((completadas / total) * 100) : 0;

          setStats({
            solicitudesActivas: activas,
            solicitudesCompletadas: completadas,
            totalPresupuesto: 0, // Se puede calcular si hay campo presupuesto
            rendimiento
          });
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [token]);

  const quickActions = useMemo(
    () => [
      { title: "Nueva Solicitud", description: "Crear solicitud de compra", link: "/solicitudes/nueva", primary: true },
      { title: "Mis Solicitudes", description: "Ver historial completo", link: "/solicitudes/usuario", primary: false },
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

  const statCards = [
    {
      title: "Solicitudes Activas",
      value: stats.solicitudesActivas,
      iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      color: "orange",
      trend: null
    },
    {
      title: "Completadas este mes",
      value: stats.solicitudesCompletadas,
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "green",
      trend: null
    },
    {
      title: "Rendimiento",
      value: `${stats.rendimiento}%`,
      iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      color: "purple",
      trend: null
    },
    {
      title: "Total Solicitudes",
      value: stats.solicitudesActivas + stats.solicitudesCompletadas,
      iconPath: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "blue",
      trend: null
    },
  ];

  const colorClasses = {
    orange: { bg: "bg-orange-50", text: "text-orange-500" },
    green: { bg: "bg-green-50", text: "text-green-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-500" },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">Sistema Procura</div>
                <div className="text-xs text-gray-600">B&D</div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setNotificacionesOpen(true)}
              className="relative text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
                </span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded text-sm flex items-center space-x-2"
            >
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-orange-500">🏠</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">Mi Panel</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">¡Hola, {userName}!</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra tus solicitudes y haz seguimiento.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {loadingStats ? "..." : stat.value}
                  </p>
                </div>
                <div className={`${colorClasses[stat.color].bg} p-2.5 rounded-lg`}>
                  <svg className={`w-5 h-5 ${colorClasses[stat.color].text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d={stat.iconPath}/>
                  </svg>
                </div>
              </div>
              {stat.trend && (
                <p className="text-green-600 text-xs font-medium">{stat.trend}</p>
              )}
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {quickActions.map((action) => (
            <Link
              key={action.link}
              to={action.link}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${action.primary ? "bg-orange-50" : "bg-blue-50"}`}>
                  <svg
                    className={`w-7 h-7 ${action.primary ? "text-orange-500" : "text-blue-500"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900">{action.title}</h3>
                    {action.primary && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-semibold">NUEVO</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{action.description}</p>
                  <span className={`text-sm font-semibold inline-flex items-center ${action.primary ? "text-orange-500" : "text-blue-500"}`}>
                    {action.primary ? "Comenzar ahora" : "Ver solicitudes"}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Requests */}
        <SolicitudesRecientes
          token={token}
          title="Mis Solicitudes Recientes"
          endpoint={`${API_URL}/archivos/usuario`}
          verTodasLink="/solicitudes/usuario"
          detalleBasePath="/solicitudes/usuario"
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2026 Sistema Procura - Business & Development. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NotificacionesPanel
        isOpen={notificacionesOpen}
        onClose={() => {
          setNotificacionesOpen(false);
          actualizarContador();
        }}
      />

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
