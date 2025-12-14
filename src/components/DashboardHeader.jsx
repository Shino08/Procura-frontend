// src/components/dashboard/DashboardHeader.jsx
import { useState } from "react";

export const DashboardHeader = ({
  userName,
  roleLabel,
  notificacionesNoLeidas,
  onOpenNotificaciones,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <div className="flex items-center gap-3">
            <img src="./src/assets/logo20.png" alt="Logo" className="h-9 w-9" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-800 sm:text-base">Sistema Procura</p>
              <p className="hidden text-xs text-gray-500 md:block">B&D</p>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onOpenNotificaciones}
              className="relative rounded-lg p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              title="Notificaciones"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="hidden text-right lg:block">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesión"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all ${mobileOpen ? "max-h-60" : "max-h-0"}`}>
          <div className="border-t border-gray-200 py-4">
            <div className="flex items-center gap-3 pb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => {
                  onOpenNotificaciones();
                  setMobileOpen(false);
                }}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">Notificaciones</span>
                {notificacionesNoLeidas > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
                    {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
