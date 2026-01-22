// src/page/SolicitudesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../services";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { CardSpinner } from "../components/LoadingSpinner";

const ITEMS_PER_PAGE = 10;

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const SolicitudesPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedUserName = localStorage.getItem("userCorreo") || "Usuario";
    setUserName(storedUserName);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchArchivos = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/archivos/usuario`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || "Error al obtener los archivos");
        }

        const data = await res.json();
        setArchivos(Array.isArray(data?.archivos) ? data.archivos : []);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivos();
    return () => controller.abort();
  }, []);

  const { filtered, totalPages, currentItems, startIndex, endIndex } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? archivos.filter((a) => {
          const idMatch = a.id.toLowerCase().includes(term);
          const fileMatch = (a.nombre || "").toLowerCase().includes(term);
          return idMatch || fileMatch;
        })
      : archivos;

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return {
      filtered,
      totalPages,
      currentItems: filtered.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    };
  }, [archivos, searchTerm, currentPage]);

  const handleViewDetails = (id) => navigate(`/solicitudes/usuario/${id}`);

  const onSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Custom action for the header
  const cargarSolicitudAction = (
    <Link
      to="/solicitudes/nueva"
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-600 hover:to-orange-700 sm:px-4"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <span className="hidden sm:inline">Cargar Solicitud</span>
      <span className="sm:hidden">Cargar</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header compartido */}
      <DashboardHeader
        userName={userName}
        roleLabel="Usuario"
        showBackButton={true}
        backTo="/dashboard"
        title="Mis Solicitudes"
        subtitle="Historial de archivos cargados"
        actions={cargarSolicitudAction}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Mis Solicitudes", active: true }
        ]}
      />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Search */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por número o nombre de archivo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <CardSpinner text="Cargando solicitudes..." />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && currentItems.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <svg className="mx-auto mb-4 h-14 w-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500">No se encontraron solicitudes</p>
          </div>
        )}

        {/* Tabla md+ */}
        {!loading && !error && currentItems.length > 0 && (
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">N° Solicitud</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Archivo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Fecha</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">Solicitudes</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {currentItems.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                          <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{a.id}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex max-w-xs items-center gap-2">
                        <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="truncate text-sm text-gray-700" title={a.nombre}>
                          {a.nombre}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">{formatFecha(a.fechaCreacion)}</td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                        {a.totalHojas}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(a.id)}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards mobile */}
        {!loading && !error && currentItems.length > 0 && (
          <div className="space-y-3 md:hidden">
            {currentItems.map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{a.id}</p>
                      <p className="text-xs text-gray-500">{formatFecha(a.fecha)}</p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    {a.totalHojas} ítems
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="truncate text-sm text-gray-700">{a.nombre}</p>
                </div>

                <div className="mt-3 flex justify-end border-t border-gray-200 pt-3">
                  <button
                    onClick={() => handleViewDetails(a.id)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && !error && filtered.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filtered.length)} de {filtered.length} solicitudes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              {/* Números solo en sm+ para no romper mobile */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`hidden rounded-lg px-3 py-2 text-sm font-medium sm:block ${
                    currentPage === n
                      ? "bg-orange-500 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
