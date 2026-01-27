// src/components/dashboard/SolicitudesRecientes.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InlineSpinner } from "./LoadingSpinner";

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatFechaRelativa = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatFecha(iso);
};

const getEstadoConfig = (estado) => {
  const configs = {
    Pendiente: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    "En Revisión": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
    "En Proceso": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
    Aprobada: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" },
    Completada: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    Rechazada: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  };
  return configs[estado] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200" };
};

export const SolicitudesRecientes = ({
  token,
  title = "Mis Solicitudes Recientes",
  endpoint = "http://localhost:3000/api/archivos",
  verTodasLink = "/solicitudes/admin",
  detalleBasePath = "/solicitudes/admin",
  limit = 5,
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Error ${res.status}: ${txt || "No se pudieron cargar solicitudes"}`);
        }

        const data = await res.json();
        const mapped = Array.isArray(data?.archivos) ? data.archivos : [];
        // Ordenar por fecha más reciente
        mapped.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        setRows(mapped);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [endpoint, token]);

  const top = useMemo(() => rows.slice(0, limit), [rows, limit]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl text-white shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{rows.length} solicitudes en total</p>
          </div>
        </div>
        <Link
          to={verTodasLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
        >
          Ver todas
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Estados de carga */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <InlineSpinner size="md" />
          <p className="text-sm text-gray-600">Cargando solicitudes…</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && top.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 font-medium">No hay solicitudes recientes</p>
          <p className="text-xs text-gray-400 mt-1">Las nuevas solicitudes aparecerán aquí</p>
        </div>
      )}

      {/* Desktop: Tabla mejorada */}
      {!loading && !error && top.length > 0 && (
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nombre del Archivo
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Hojas
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {top.map((s, idx) => {
                const estadoCfg = getEstadoConfig(s.estado);
                const detallePath = `${detalleBasePath}/${s.fileId ?? s.id}`;

                return (
                  <tr
                    key={s.fileId ?? s.id}
                    className={`group hover:bg-orange-50/50 transition-colors ${idx === 0 ? 'bg-orange-50/30' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-sm font-bold text-gray-700 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                        {s.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={s.nombre}>
                          {s.nombre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.usuarioCorreo?.split('@')[0] || 'Usuario'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                        {s.totalHojas}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${estadoCfg.bg} ${estadoCfg.text} ${estadoCfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`}></span>
                        {s.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {formatFechaRelativa(s.fechaCreacion)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFecha(s.fechaCreacion)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={detallePath}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
                      >
                        Ver
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile/Tablet: Cards mejoradas */}
      {!loading && !error && top.length > 0 && (
        <div className="lg:hidden divide-y divide-gray-100">
          {top.map((s, idx) => {
            const estadoCfg = getEstadoConfig(s.estado);
            const detallePath = `${detalleBasePath}/${s.fileId ?? s.id}`;

            return (
              <Link
                key={s.fileId ?? s.id}
                to={detallePath}
                className={`block p-4 hover:bg-orange-50/50 transition-colors ${idx === 0 ? 'bg-orange-50/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* ID Badge */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {s.id}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.usuarioCorreo?.split('@')[0] || 'Usuario'}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                        {s.totalHojas} hojas
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${estadoCfg.bg} ${estadoCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`}></span>
                          {s.estado || 'Pendiente'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFechaRelativa(s.fechaCreacion)}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                        Ver detalles
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer con info */}
      {!loading && !error && top.length > 0 && rows.length > limit && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Mostrando {top.length} de {rows.length} solicitudes •
            <Link to={verTodasLink} className="text-orange-600 font-medium hover:underline ml-1">
              Ver todas
            </Link>
          </p>
        </div>
      )}
    </section>
  );
};
