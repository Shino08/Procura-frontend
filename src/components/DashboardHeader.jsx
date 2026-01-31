import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logoImage from "../assets/logo20.png";

// Función para convertir email a nombre legible
const emailToName = (email) => {
  if (!email) return "Usuario";
  const base = email.split("@")[0] || "Usuario";
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export const DashboardHeader = ({
  userName: userNameProp,
  roleLabel: roleLabelProp,
  notificacionesNoLeidas = 0,
  onOpenNotificaciones,
  showBackButton = false,
  backTo = null,
  title = null,
  subtitle = null,
  actions = null,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Obtener userName y roleLabel de manera consistente
  const { userName, roleLabel } = useMemo(() => {
    const storedEmail = localStorage.getItem("userCorreo");
    const storedRole = localStorage.getItem("userRol") || "Usuario";

    const rawUserName = userNameProp || storedEmail;

    const displayName = rawUserName?.includes("@")
      ? emailToName(rawUserName)
      : (rawUserName || "Usuario");

    return {
      userName: displayName,
      roleLabel: roleLabelProp || storedRole,
    };
  }, [userNameProp, roleLabelProp]);

  // ✅ Nueva función para salir al sistema de gestión
  const handleLogout = () => {
    // Limpiar solo datos específicos de Procura
    localStorage.removeItem("userId");
    localStorage.removeItem("userRol");
    
    // ✅ Redirigir al otro sistema (puerto 5173)
    window.location.href = "https://hilarious-blancmange-f07b86.netlify.app/InicioPlanificador";
  };

  const { tipo } = useParams();

  // ✅ headerConfig ahora determina backTo según el rol actual de localStorage
  const headerConfig = useMemo(() => {
    const storedRole = localStorage.getItem("userRol")?.toLowerCase();
    
    // Determinar la ruta de vuelta según el rol
    let backTo = "/dashboard/client"; // Default para usuarios
    
    if (storedRole === "administrador") {
      backTo = "/dashboard/admin";
    } else if (storedRole === "usuario") {
      backTo = "/dashboard/client";
    }

    // Mapeo de títulos según el tipo de página
    const titleMap = {
      admin: "Dashboard Admin",
      gestion: "Dashboard Gestión",
      user: "Dashboard Usuario",
      client: "Dashboard Cliente",
    };

    return {
      title: titleMap[tipo] || "Dashboard",
      backTo: backTo
    };
  }, [tipo]);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left Section - Logo + Optional Back Button + Title */}
            <div className="flex items-center gap-4">
              {/* Back Button (optional) */}
              {headerConfig.title && (
                <button
                  onClick={() =>
                    headerConfig.backTo
                      ? navigate(headerConfig.backTo)
                      : navigate(-1)
                  }
                  className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Volver"
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              {/* Logo Original MEJORADO */}
              <div className="flex items-center space-x-3 group">
                <img
                  src={logoImage}
                  alt="Logo"
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-200"
                />
                <div>
                  <div className="text-base font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                    Sistema Procura
                  </div>
                  <div className="text-xs text-gray-500">{roleLabel}</div>
                </div>
              </div>

              {/* Optional Title Section */}
              {title && (
                <div className="hidden lg:block ml-4 pl-4 border-l border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  {subtitle && (
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              {/* Custom Actions (optional) */}
              {actions && (
                <div className="hidden lg:flex items-center space-x-2">
                  {actions}
                </div>
              )}

              {/* Notifications Button */}
              {onOpenNotificaciones && (
                <button
                  onClick={onOpenNotificaciones}
                  className="relative text-gray-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                  aria-label="Notificaciones"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificacionesNoLeidas > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-md animate-pulse">
                      {notificacionesNoLeidas > 9
                        ? "9+"
                        : notificacionesNoLeidas}
                    </span>
                  )}
                </button>
              )}

              {/* User Avatar + Dropdown (Desktop) */}
              <div className="hidden md:flex items-center space-x-3">
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-orange-100">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Logout Button (Desktop) */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="hidden md:flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                title="Salir a Gestión"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden rounded-lg p-2 hover:bg-gray-100 transition-colors"
                aria-label="Abrir menú"
              >
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-base font-bold shadow-md ring-2 ring-orange-100">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
              </div>

              <div className="space-y-2">
                {onOpenNotificaciones && (
                  <button
                    onClick={() => {
                      onOpenNotificaciones();
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-between w-full rounded-lg px-4 py-3 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-gray-500 group-hover:text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                        Notificaciones
                      </span>
                    </div>
                    {notificacionesNoLeidas > 0 && (
                      <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                        {notificacionesNoLeidas > 9
                          ? "9+"
                          : notificacionesNoLeidas}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex items-center space-x-3 w-full rounded-lg px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors group"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-sm font-medium">Ir a Gestión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleIn">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              ¿Volver al Sistema de Gestión?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Serás redirigido al panel de gestión principal. Tus cambios en
              Procura se han guardado.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-md"
              >
                Ir a Gestión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
  