// src/pages/dashboard/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificacionesPanel } from "../components/NotificacionesPanel";
import { useNotificaciones } from "../hooks/useNotifications";
import { SolicitudesRecientes } from "../components/SolicitudesRecientes";
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
                <div className="text-xs text-gray-600">B&D - Admin</div>
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
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
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
          <span className="text-orange-500">Home</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">Panel de Administración</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona todas las solicitudes y monitorea el rendimiento del sistema.
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

        {/* Charts and Notifications Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Chart Section - Placeholder */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Evolución de Solicitudes</h2>
                <p className="text-sm text-green-600 font-medium">Ver reportes completos →</p>
              </div>
              <Link to="/reportes" className="text-gray-400 hover:text-gray-600 text-xl">⋯</Link>
            </div>
            <div className="h-72 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p className="text-gray-500 text-sm mb-2">Gráficos detallados disponibles en Reportes</p>
                <Link to="/reportes" className="text-orange-500 text-sm font-semibold hover:underline">
                  Ver reportes completos
                </Link>
              </div>
            </div>
          </div>

          {/* Notifications Panel - Inline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
              <button
                onClick={() => setNotificacionesOpen(true)}
                className="text-orange-500 text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {loadingStats ? (
                <p className="text-sm text-gray-500 text-center py-4">Cargando notificaciones...</p>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">
                    {notificacionesNoLeidas > 0
                      ? `Tienes ${notificacionesNoLeidas} notificación${notificacionesNoLeidas > 1 ? 'es' : ''} sin leer`
                      : "No tienes notificaciones nuevas"}
                  </p>
                  <button
                    onClick={() => setNotificacionesOpen(true)}
                    className="text-orange-500 text-sm font-semibold hover:underline"
                  >
                    Ver panel completo
                  </button>
                </div>
              )}
            </div>
          </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.primary ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"} />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900">{action.title}</h3>
                    {action.primary && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-semibold">POPULAR</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{action.description}</p>
                  <span className={`text-sm font-semibold inline-flex items-center ${action.primary ? "text-orange-500" : "text-blue-500"}`}>
                    {action.primary ? "Gestionar ahora" : "Ver reportes"}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Active Projects/Requests */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Solicitudes Activas</h2>
              <p className="text-sm text-gray-600">Gestiona y aprueba solicitudes de compra</p>
            </div>
            <div className="flex space-x-2">
              <Link to="/solicitudes/admin" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium">General</Link>
              <Link to="/reportes" className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">Reportes</Link>
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
