// src/pages/dashboard/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificacionesPanel } from "../components/NotificacionesPanel";
import { useNotificaciones } from "../hooks/useNotifications";
import { SolicitudesRecientes } from "../components/SolicitudesRecientes";
import { EvolucionChart } from "../components/EvolucionChart";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { CardSpinner } from "../components/LoadingSpinner";
import { API_URL } from "../services";

export const AdminDashboard = ({ token, userName }) => {
  const navigate = useNavigate();
  const { notificacionesNoLeidas, actualizarContador } = useNotificaciones();
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    proyectosActivos: 0,
    clientesActivos: 0,
    presupuestoTotal: 0,
    rendimiento: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas del admin
  useEffect(() => {
    if (!token) return;

    const fetchAdminData = async () => {
      try {
        const res = await fetch(`${API_URL}/archivos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const archivos = Array.isArray(data?.archivos) ? data.archivos : [];

          const activos = archivos.filter(a => a.estado !== "Completada" && a.estado !== "Rechazada").length;
          const completados = archivos.filter(a => a.estado === "Completada").length;
          const total = archivos.length;
          const rendimiento = total > 0 ? Math.round((completados / total) * 100) : 0;

          // Obtener clientes únicos (si hay campo cliente/usuario)
          const clientesUnicos = new Set();
          archivos.forEach(a => {
            if (a.usuarioCorreo || a.correo) {
              clientesUnicos.add(a.usuarioCorreo || a.correo);
            }
          });

          setStats({
            proyectosActivos: activos,
            clientesActivos: clientesUnicos.size,
            presupuestoTotal: 0, // Se puede calcular si hay campo presupuesto
            rendimiento
          });
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAdminData();
  }, [token]);

  const quickActions = useMemo(
    () => [
      { title: "Gestionar Solicitudes", description: "Revisar y aprobar solicitudes", link: "/solicitudes/admin", primary: true },
      { title: "Ver Reportes", description: "Análisis y estadísticas completas", link: "/reportes", primary: false },
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
      value: stats.proyectosActivos,
      iconPath: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z",
      color: "orange",
      trend: null
    },
    {
      title: "Clientes Activos",
      value: stats.clientesActivos,
      iconPath: "M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z",
      color: "blue",
      trend: null
    },
    {
      title: "Solicitudes Completadas",
      value: stats.proyectosActivos, // Placeholder
      iconPath: "M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z",
      color: "green",
      trend: null
    },
    {
      title: "Rendimiento",
      value: `${stats.rendimiento}%`,
      iconPath: "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z",
      color: "purple",
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

      <DashboardHeader 
      userName={userName}
      notificacionesNoLeidas={notificacionesNoLeidas}
      onOpenNotificaciones={() => setNotificacionesOpen(true)} 
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Panel de Administración", active: true }
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Panel de Administración</h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Gestiona todas las solicitudes y monitorea el rendimiento del sistema.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-4 sm:mb-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-3 sm:p-5">
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-500 text-[10px] sm:text-xs font-medium mb-1 truncate">{stat.title}</p>
                  <p className="text-xl sm:text-4xl font-bold text-gray-900">
                    {loadingStats ? "..." : stat.value}
                  </p>
                </div>
                <div className={`${colorClasses[stat.color].bg} p-1.5 sm:p-2.5 rounded-lg flex-shrink-0 ml-2`}>
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClasses[stat.color].text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d={stat.iconPath} />
                  </svg>
                </div>
              </div>
              {stat.trend && (
                <p className="text-green-600 text-[10px] sm:text-xs font-medium">{stat.trend}</p>
              )}
            </div>
          ))}
        </div>

        {/* Charts and Notifications Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5 mb-4 sm:mb-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Evolución de Solicitudes</h2>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Últimos 12 meses</p>
              </div>
              <Link to="/reportes" className="text-gray-400 hover:text-gray-600 text-xl">⋯</Link>
            </div>
            <EvolucionChart token={token} />
          </div>

          {/* Notifications Panel - Inline */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Notificaciones</h2>
                {notificacionesNoLeidas > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
                    {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
                  </span>
                )}
              </div>
              <button
                onClick={() => setNotificacionesOpen(true)}
                className="text-orange-500 text-xs sm:text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>

            {loadingStats ? (
              <div className="space-y-2 sm:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Notification Items */}
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Sistema funcionando correctamente</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Todas las solicitudes están sincronizadas</p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">Ahora</span>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Solicitudes pendientes de revisión</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">{stats.proyectosActivos} solicitudes esperando aprobación</p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">Hoy</span>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Rendimiento del sistema</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">{stats.rendimiento}% de solicitudes completadas</p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">Esta semana</span>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 sm:pt-3 border-t border-gray-100">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1.5 sm:mb-2">ACCIONES RÁPIDAS</p>
                  <div className="space-y-1">
                    <Link to="/solicitudes/admin" className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 hover:text-orange-600 py-1 sm:py-1.5">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Revisar solicitudes pendientes</span>
                      <span className="sm:hidden">Revisar pendientes</span>
                    </Link>
                    <Link to="/reportes" className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 hover:text-orange-600 py-1 sm:py-1.5">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Ver reportes generales
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => setNotificacionesOpen(true)}
                  className="w-full mt-1 sm:mt-2 text-center text-xs sm:text-sm text-orange-500 font-semibold hover:underline py-1.5 sm:py-2"
                >
                  Ver panel completo →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Projects/Requests */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 gap-2 sm:gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Solicitudes Activas</h2>
              <p className="text-xs sm:text-sm text-gray-600">Gestiona y aprueba solicitudes de compra</p>
            </div>
          </div>

          {/* Projects Table - Simplified for admin */}
          <SolicitudesRecientes
            token={token}
            title=""
            endpoint={`${API_URL}/archivos`}
            verTodasLink="/solicitudes/admin"
            detalleBasePath="/solicitudes/admin"
          />


        </div>
        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mt-4 sm:mt-6">
          {quickActions.map((action) => (
            <Link
              key={action.link}
              to={action.link}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${action.primary ? "bg-orange-50" : "bg-blue-50"}`}>
                  <svg
                    className={`w-5 h-5 sm:w-7 sm:h-7 ${action.primary ? "text-orange-500" : "text-blue-500"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.primary ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{action.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">{action.description}</p>
                  <span className={`text-xs sm:text-sm font-semibold inline-flex items-center ${action.primary ? "text-orange-500" : "text-blue-500"}`}>
                    {action.primary ? "Gestionar ahora" : "Ver reportes"}
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs sm:text-sm text-gray-600 text-center">
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
