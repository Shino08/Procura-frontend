// src/pages/dashboard/ClienteDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificacionesPanel } from "../components/NotificacionesPanel";
import { useNotificaciones } from "../hooks/useNotifications";
import { SolicitudesRecientes } from "../components/SolicitudesRecientes";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { CardSpinner } from "../components/LoadingSpinner";
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
            totalPresupuesto: 0,
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
      { 
        title: "Nueva Solicitud", 
        description: "Crear solicitud de compra", 
        link: "/solicitudes/nueva", 
        primary: true,
        icon: "M12 4v16m8-8H4"
      },
      { 
        title: "Mis Solicitudes", 
        description: "Ver historial completo", 
        link: "/solicitudes/usuario", 
        primary: false,
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      },
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
      bgGradient: "from-orange-500 to-orange-600",
      subtitle: "En proceso"
    },
    {
      title: "Completadas",
      value: stats.solicitudesCompletadas,
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "green",
      bgGradient: "from-green-500 to-green-600",
      subtitle: "Este mes"
    },
    {
      title: "Rendimiento",
      value: `${stats.rendimiento}%`,
      iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      color: "purple",
      bgGradient: "from-purple-500 to-purple-600",
      subtitle: "Tasa de aprobación"
    },
    {
      title: "Total Solicitudes",
      value: stats.solicitudesActivas + stats.solicitudesCompletadas,
      iconPath: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
      subtitle: "Historial completo"
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
      {/* Header compartido */}
      <DashboardHeader
        userName={userName}
        roleLabel="Usuario"
        notificacionesNoLeidas={notificacionesNoLeidas}
        onOpenNotificaciones={() => setNotificacionesOpen(true)}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Mi Panel", active: true }
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">¡Hola, {userName}!</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra tus solicitudes y haz seguimiento.
          </p>
        </div>

        {/* Stats Cards con efectos hover mejorados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {statCards.map((stat, idx) => (
            <div 
              key={idx} 
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
            >
              {/* Borde superior con gradiente */}
              <div className={`h-1 bg-gradient-to-r ${stat.bgGradient}`}/>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 transition-colors group-hover:text-gray-700">
                      {loadingStats ? (
                        <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"/>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${colorClasses[stat.color].bg} p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <svg 
                      className={`w-5 h-5 ${colorClasses[stat.color].text}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d={stat.iconPath}
                      />
                    </svg>
                  </div>
                </div>

                {/* Barra de progreso para rendimiento */}
                {stat.title === "Rendimiento" && !loadingStats && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full bg-gradient-to-r ${stat.bgGradient} transition-all duration-500`}
                        style={{ width: `${stats.rendimiento}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Efecto de brillo en hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}/>
            </div>
          ))}
        </div>

        {/* Quick Actions con menos padding */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quickActions.map((action) => (
              <Link
                key={action.link}
                to={action.link}
                className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  action.primary ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-5">
                  {/* Icono y badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      action.primary 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                    } transition-colors`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon}/>
                      </svg>
                    </div>
                  </div>

                  {/* Contenido */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {action.description}
                  </p>

                  {/* CTA */}
                  <div className={`inline-flex items-center gap-2 text-sm font-semibold ${
                    action.primary ? 'text-orange-600' : 'text-gray-600 group-hover:text-blue-600'
                  } transition-colors`}>
                    {action.primary ? "Comenzar ahora" : "Ir al módulo"}
                    <svg 
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>

                {/* Borde inferior con gradiente (solo en hover) */}
                <div className={`h-1 bg-gradient-to-r ${
                  action.primary 
                    ? 'from-orange-500 to-orange-600' 
                    : 'from-blue-500 to-blue-600'
                } transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}/>
              </Link>
            ))}
          </div>
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
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-600">
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
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar sesión?</h3>
              <p className="text-sm text-gray-600">
                Tendrás que iniciar sesión nuevamente para acceder.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancelar
              </button>
              <button 
                onClick={confirmLogout} 
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
