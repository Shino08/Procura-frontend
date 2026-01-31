// src/page/ErrorPage.jsx
import { useRouteError, Link, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../assets/logo20.png";

export const ErrorPage = () => {
  const error = useRouteError();
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar el tipo de dashboard desde la URL actual
  const dashboardType = location.pathname.includes("/dashboard/")
    ? location.pathname.split("/dashboard/")[1]?.split("/")[0]
    : null;

  // Determinar la ruta de retorno según el rol en localStorage o la URL
  const getBackRoute = () => {
    if (dashboardType) {
      return `/dashboard/${dashboardType}`;
    }
    
    const userRole = localStorage.getItem("userRol");
    if (userRole === "Administrador") return "/dashboard/admin";
    if (userRole === "Gestión") return "/dashboard/gestion";
    return "/dashboard/usuario";
  };

  const backRoute = getBackRoute();

  // Determinar el código y mensaje del error
  const errorCode = error?.status || "500";
  const errorTitle = error?.statusText || "Error Inesperado";
  const errorMessage = error?.message || "Ha ocurrido un problema al cargar esta página.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo y Branding */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={logoImage}
              alt="Sistema Procura"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Sistema Procura</h1>
        </div>

        {/* Card de Error */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 animate-scaleIn">
          {/* Código de Error Grande */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-6xl font-bold text-gray-800 mb-2">{errorCode}</h2>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">{errorTitle}</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {errorMessage}
            </p>
          </div>

          {/* Información Adicional de Debug (solo en desarrollo) */}
          {import.meta.env.DEV && error?.stack && (
            <details className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-orange-600">
                Detalles técnicos (desarrollo)
              </summary>
              <pre className="mt-3 text-xs text-gray-600 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Botones de Acción */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors flex items-center justify-center gap-2"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver Atrás
            </button>

            <Link
              to={backRoute}
              className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Ir al Dashboard
            </Link>
          </div>

          {/* Sugerencias */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">
              <strong>Sugerencias:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Verifica que la URL sea correcta
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Asegúrate de tener los permisos necesarios
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Si el problema persiste, contacta al administrador
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:soporte@sistemaprocura.com"
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Contacta a soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
