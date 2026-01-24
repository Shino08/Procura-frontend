// Spinner principal mejorado con diseño moderno
export const LoadingSpinner = ({
  size = "md",
  text = "Cargando...",
  fullScreen = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
    xl: "h-3 w-3",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50/95 to-white/95 backdrop-blur-sm"
    : "flex flex-col items-center justify-center py-8";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-5">
        {/* Spinner circular con gradiente */}
        <div className="relative">
          <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-400 animate-spin`}
            style={{ animationDuration: '0.8s' }}
          ></div>
          {/* Punto central con pulso */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${dotSizes[size]} rounded-full bg-orange-500 animate-pulse`}></div>
          </div>
        </div>

        {/* Texto con animación sutil */}
        {text && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600">{text}</p>
            <span className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Spinner inline mejorado para botones o espacios pequeños
export const InlineSpinner = ({ size = "sm", className = "", color = "gray" }) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const colorClasses = {
    gray: "border-gray-300 border-t-gray-600",
    orange: "border-orange-200 border-t-orange-600",
    white: "border-white/30 border-t-white",
    blue: "border-blue-200 border-t-blue-600",
    green: "border-green-200 border-t-green-600",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 ${colorClasses[color]} animate-spin ${className}`}
      style={{ animationDuration: '0.6s' }}
    />
  );
};

// Spinner para overlays/cards mejorado
export const CardSpinner = ({ text = "Procesando...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="flex flex-col items-center gap-5">
        {/* Spinner con anillos múltiples */}
        <div className="relative h-14 w-14">
          {/* Anillo exterior */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
          {/* Anillo interior */}
          <div className="absolute inset-2 rounded-full border-3 border-gray-50"></div>
          <div
            className="absolute inset-2 rounded-full border-3 border-transparent border-b-orange-400 animate-spin"
            style={{ animationDuration: '0.7s', animationDirection: 'reverse' }}
          ></div>
          {/* Centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
          </div>
        </div>

        {/* Texto con dots animados */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-600">{text}</p>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '100ms' }}></span>
            <span className="h-1 w-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '200ms' }}></span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Nuevo: Skeleton loader para listas
export const SkeletonLoader = ({ rows = 3, className = "" }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Nuevo: Overlay spinner para acciones
export const OverlaySpinner = ({ show = false, text = "Procesando..." }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"
            style={{ animationDuration: '0.7s' }}
          ></div>
        </div>
        <p className="text-sm font-medium text-gray-700">{text}</p>
      </div>
    </div>
  );
};

// Nuevo: Page loader con logo/branding
export const PageLoader = ({ text = "Cargando..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col items-center gap-6">
        {/* Logo placeholder o icono */}
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {/* Spinner alrededor del logo */}
          <div
            className="absolute -inset-2 rounded-2xl border-4 border-transparent border-t-orange-300 border-r-orange-200 animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>
        </div>

        {/* Texto y dots */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-semibold text-gray-700">{text}</p>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};
