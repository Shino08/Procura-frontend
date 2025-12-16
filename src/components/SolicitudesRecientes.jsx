// src/components/dashboard/SolicitudesRecientes.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getEstadoConfig = (estado) => {
  const configs = {
    Pendiente: { bg: "bg-yellow-100", text: "text-yellow-700" },
    "En Revisión": { bg: "bg-blue-100", text: "text-blue-700" },
    "En Proceso": { bg: "bg-orange-100", text: "text-orange-700" },
    Aprobada: { bg: "bg-green-100", text: "text-green-700" },
    Completada: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Rechazada: { bg: "bg-red-100", text: "text-red-700" },
  };
  return configs[estado] || configs.Pendiente;
};

export const SolicitudesRecientes = ({
  token,
  title = "Mis Solicitudes Recientes",
  endpoint = "http://localhost:3000/api/archivos",
  verTodasLink = "/solicitudes/admin",
  detalleBasePath = "/solicitudes/admin", // detalle: `${detalleBasePath}/${fileId}`
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
        console.log(data);

        const mapped = Array.isArray(data?.archivos) ? data.archivos : [];
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
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-gray-800 sm:text-lg">{title}</h3>
        <Link
          to={verTodasLink}
          className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          Ver todas
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Estados */}
      {loading && <div className="p-4 text-sm text-gray-600">Cargando solicitudes…</div>}
      {!loading && error && <div className="p-4 text-sm text-red-600">{error}</div>}
      {!loading && !error && top.length === 0 && (
        <div className="p-4 text-sm text-gray-600">No hay solicitudes recientes.</div>
      )}

      {/* Desktop: tabla */}
      {!loading && !error && top.length > 0 && (
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Solicitudes
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {top.map((s) => {
                const detallePath = `${detalleBasePath}/${s.fileId ?? s.id}`;

                return (
                  <tr key={s.fileId ?? s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{s.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={s.nombre}>
                      {s.nombre}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        {s.totalHojas}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatFecha(s.fechaCreacion)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={detallePath}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile/Tablet: cards */}
      {!loading && !error && top.length > 0 && (
        <div className="lg:hidden divide-y divide-gray-200">
          {top.map((s) => {
            const estadoCfg = getEstadoConfig(s.estado);
            const detallePath = `${detalleBasePath}/${s.fileId ?? s.id}`;

            return (
              <div key={s.fileId ?? s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{s.id}</p>
                    <p className="mt-1 text-xs text-gray-600 truncate">{s.archivo}</p>
                  </div>

                  <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    {s.items}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoCfg.bg} ${estadoCfg.text}`}>
                      {s.totalHojas}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatFecha(s.fechaCreacion)}
                    </span>
                  </div>

                  <Link to={detallePath} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                    Ver →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
