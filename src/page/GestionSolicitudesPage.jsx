// src/page/GestionSolicitudesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../services";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { CardSpinner, LoadingSpinner } from "../components/LoadingSpinner";

const ITEMS_PER_PAGE = 10;

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const GestionSolicitudesPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedUserName = localStorage.getItem("userCorreo") || "Usuario";
    setUserName(storedUserName);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchUploads = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/archivos`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || "Error al obtener archivos");
        }

        const data = await res.json();
        const uploads = Array.isArray(data?.archivos) ? data.archivos : [];
        setSolicitudes(uploads); // listo
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
    return () => controller.abort();
  }, []);

  const { filtered, totalPages, pageItems, startIndex, endIndex } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? solicitudes.filter((s) => {
        const t1 = String(s.id).includes(term);
        const t2 = (s.nombre || "").toLowerCase().includes(term);
        const t3 = (s.tipoArchivo || "").toLowerCase().includes(term);
        return t1 || t2 || t3;
      })
      : solicitudes;

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return {
      filtered,
      totalPages,
      pageItems: filtered.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    };
  }, [solicitudes, searchTerm, currentPage]);

  const onSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const viewDetails = (id) => navigate(`/solicitudes/admin/${id}`);

  const download = async (archivoId) => {
    try {
      if (!archivoId) throw new Error("ID de archivo inválido");

      const token = localStorage.getItem("token");
      const url = `${API_URL}/archivos/${archivoId}/descargar`;

      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Error HTTP ${res.status}`);
      }

      // Obtén el nombre del archivo desde el header Content-Disposition o usa el de la solicitud
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `archivo-${archivoId}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }

      // Busca el nombre original en el array de solicitudes si no viene en el header
      const solicitud = solicitudes.find(s => s.id === archivoId);
      if (solicitud?.nombre) {
        fileName = solicitud.nombre;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      alert(error.message || "No se pudo descargar el archivo");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 shadow">
          <p className="text-sm font-semibold text-red-600">Error al cargar solicitudes</p>
          <p className="mt-1 text-xs text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header compartido */}
      <DashboardHeader
        userName={userName}
        roleLabel="Administrador"
        showBackButton={true}
        backTo="/dashboard"
        title="Gestión de Solicitudes"
        subtitle="Administrar solicitudes (archivos) subidos por Procura"
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Gestión de Solicitudes", active: true }
        ]}
      />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filtro */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por N°, archivo o cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Loading state for table area */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <svg className="h-10 w-10 animate-spin rounded-full border-solid border-orange-200 border-t-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Cargando solicitudes...</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && pageItems.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            No se encontraron solicitudes.
          </div>
        )}

        {/* Desktop table */}
        {!loading && pageItems.length > 0 && (
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-xs font-semibold uppercase text-gray-600">Solicitud</th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-xs font-semibold uppercase text-gray-600">Cliente</th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-xs font-semibold uppercase text-gray-600">Archivo</th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-xs font-semibold uppercase text-gray-600">Fecha</th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-[10px] lg:text-xs font-semibold uppercase text-gray-600">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {pageItems.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="grid h-8 w-8 lg:h-10 lg:w-10 place-items-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex-shrink-0">
                            <svg className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-xs lg:text-sm font-semibold text-gray-800">{s.id}</span>
                        </div>
                      </td>

                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        {s.usuario ? <p className="text-[10px] lg:text-xs text-gray-500">{s.usuario}</p> : <span className="text-gray-400">-</span>}
                      </td>

                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="flex max-w-[120px] lg:max-w-xs items-center gap-1.5 lg:gap-2">
                          <svg className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="truncate text-xs lg:text-sm text-gray-700" title={s.nombre}>
                            {s.nombre}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-sm text-gray-600">{formatFecha(s.fechaCreacion)}</td>

                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="flex justify-end gap-1.5 lg:gap-2">
                          <button
                            onClick={() => download(s.id)}
                            className="rounded-lg border border-gray-300 px-2 lg:px-3 py-1.5 lg:py-2 text-[10px] lg:text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <span className="hidden lg:inline">Descargar</span>
                            <svg className="lg:hidden h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>

                          <button
                            onClick={() => viewDetails(s.id)}
                            className="rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-[10px] lg:text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <span className="hidden lg:inline">Gestionar →</span>
                            <span className="lg:hidden">Ver</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && pageItems.length > 0 && (
          <div className="space-y-4 md:hidden">
            {pageItems.map((s) => (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatFecha(s.fechaCreacion)}</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-orange-400 mt-2" />
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="text-sm font-semibold text-gray-800">{s.cliente}</p>
                  {s.correo ? <p className="mt-1 text-xs text-gray-500">{s.correo}</p> : null}
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500">Archivo</p>
                  <p className="mt-1 truncate text-sm text-gray-700">{s.nombre}</p>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className="mt-1 text-sm text-gray-700">{s.observaciones}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => download(s.id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Descargar
                  </button>
                  <button
                    onClick={() => viewDetails(s.id)}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filtered.length)} de {filtered.length}
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">←</span>
              </button>

              <span className="text-xs sm:text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
