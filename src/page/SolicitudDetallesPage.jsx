import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModalConfirm } from "../components/ModalConfirm";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { PageLoader } from "../components/LoadingSpinner";
import { API_URL } from "../services";
import { ITEMS_PER_PAGE, formatArchivoId, formatFecha } from "../utils/solicitudesUi";

/* Normaliza el response real del API a un shape estable para UI */
const mapApiToUi = (data) => {
  const file = data?.file || null;
  const solicitudesApi = Array.isArray(data?.solicitudes) ? data.solicitudes : [];

  const mappedSolicitudes = solicitudesApi.map((s) => {
    const itemsApi = Array.isArray(s.items) ? s.items : [];

    const items = itemsApi.map((it, idx) => ({
      id: it.id,
      linea: idx + 1,
      codigo: it.codigo || "-",
      descripcion: it.descripcion || "Sin descripción",
      unidad: it.unidad || "-",
      cantidadTotal: Number(it.cantidadTotal ?? 0),
      estado: it?.estado?.nombre || "Pendiente",
      estadoId: it?.estado?.id ?? null,
      ultimaObservacion: it?.ultimaObservacion?.observacion || "Sin observación",
    }));

    return {
      id: s.id,
      nombre: s.nombre || `Solicitud ${s.id}`,
      descripcion: s.descripcion || "",
      totalItems: items.length,
      items,
    };
  });

  const totalItemsArchivo = mappedSolicitudes.reduce((acc, s) => acc + s.totalItems, 0);

  const header = file
    ? {
      archivoId: file.id,
      id: formatArchivoId(file.id),
      fecha: file.fechaCreacion,
      nombreArchivo: file.nombre,
      totalItems: totalItemsArchivo,
      observaciones: `Solicitudes asociadas: ${mappedSolicitudes.length}`,
      url: file.url,
    }
    : null;

  return { header, mappedSolicitudes };
};

export const SolicitudDetallesPage = () => {
  const navigate = useNavigate();
  const { fileId } = useParams();

  const [header, setHeader] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActivaId, setSolicitudActivaId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Modales de detalle / aprobación
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveStep, setApproveStep] = useState("confirm");
  const [estados, setEstados] = useState([]);
  const [userName, setUserName] = useState("");

  // Obtener userName del localStorage
  useEffect(() => {
    const storedUserName = localStorage.getItem("userCorreo") || "Usuario";
    setUserName(storedUserName);
  }, []);

  // Fetch estados
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/estados`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setEstados(Array.isArray(data) ? data : []);
      } catch (_) { }
    })();
    return () => controller.abort();
  }, []);

  // Función para cargar/refrescar los datos
  const fetchDetails = async (signal) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/archivos/detalles/${fileId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        signal: signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Error al obtener detalles");
      }

      const data = await res.json();
      const { header, mappedSolicitudes } = mapApiToUi(data);

      if (!header) throw new Error("Archivo no encontrado.");

      setHeader(header);
      setSolicitudes(mappedSolicitudes);

      // Mantener la solicitud activa si aún existe, sino usar la primera
      setSolicitudActivaId((prevId) => {
        const exists = mappedSolicitudes.some((s) => String(s.id) === String(prevId));
        return exists ? prevId : mappedSolicitudes[0]?.id ?? null;
      });

      return true;
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Error inesperado");
      }
      return false;
    }
  };

  // Función de refresh para usar en callbacks (sin loading)
  const refreshData = async () => {
    await fetchDetails();
  };

  // Carga inicial de datos
  useEffect(() => {
    if (!fileId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError("");
      await fetchDetails(controller.signal);
      setLoading(false);
    };

    loadData();
    return () => controller.abort();
  }, [fileId]);

  // FUNCIÓN DE DESCARGA DEL ARCHIVO ORIGINAL
  const handleDownload = async () => {
    if (!header?.archivoId) return;

    setDownloading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/archivos/${header.archivoId}/descargar`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al descargar el archivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = header.nombreArchivo || `solicitud-${header.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      alert(`Error al descargar: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // FUNCIÓN PARA GENERAR PDF DE ITEMS APROBADOS
  const handleGeneratePdf = async () => {
    if (!solicitudActivaId) {
      alert("No hay solicitud activa seleccionada");
      return;
    }

    setGeneratingPdf(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/generar-pdf/${solicitudActivaId}`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al generar el PDF");
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      // Crear URL temporal
      const url = window.URL.createObjectURL(blob);

      // Crear enlace de descarga
      const link = document.createElement("a");
      link.href = url;

      // Obtener nombre del archivo desde el header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `reporte-solicitud-${solicitudActivaId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert(`Error al generar PDF: ${error.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const solicitudActiva = useMemo(() => {
    return solicitudes.find((s) => String(s.id) === String(solicitudActivaId)) || solicitudes[0] || null;
  }, [solicitudes, solicitudActivaId]);

  const itemsBase = solicitudActiva?.items || [];

  const { filteredItems, stats, totalPages, currentItems, startIndex, endIndex } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filteredItems = itemsBase.filter((item) => {
      const matchesSearch =
        !term ||
        item.codigo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "todos" || String(item.estadoId) === String(statusFilter);

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total: itemsBase.length,
      aprobados: itemsBase.filter((i) => i.estado === "Aprobado").length,
      pendientes: itemsBase.filter((i) => i.estado === "Pendiente" || i.estado === "En Revisión").length,
      enProceso: itemsBase.filter((i) => i.estado === "En Proceso").length,
      rechazados: itemsBase.filter((i) => i.estado === "Rechazado").length,
    };

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return {
      filteredItems,
      stats,
      totalPages,
      currentItems: filteredItems.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    };
  }, [itemsBase, searchTerm, statusFilter, currentPage]);

  const onSearch = (v) => {
    setSearchTerm(v);
    setCurrentPage(1);
  };

  const onStatusFilter = (v) => {
    setStatusFilter(v);
    setCurrentPage(1);
  };

  const openItem = (item) => {
    setSelectedItem(item);
    setActiveTab("general");
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setSelectedItem(null);
    setActiveTab("general");
  };

  const startApprove = () => {
    if (!selectedItem) return;
    setApproveStep("confirm");
    setConfirmOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedItem) return;

    try {
      setApproveStep("processing");
      await new Promise((r) => setTimeout(r, 900));

      setSolicitudes((prev) =>
        prev.map((sol) => ({
          ...sol,
          items: sol.items.map((it) =>
            it.id === selectedItem.id ? { ...it, estado: "Aprobado" } : it
          ),
        }))
      );

      setSelectedItem((prev) => (prev ? { ...prev, estado: "Aprobado" } : prev));
      setApproveStep("success");

      setTimeout(() => {
        setConfirmOpen(false);
        setApproveStep("confirm");
        closeItemModal();
      }, 700);
    } catch (e) {
      setApproveStep("confirm");
      setConfirmOpen(false);
    }
  };

  // Estados de carga y error deben evaluarse primero
  if (loading) {
    return <PageLoader text="Cargando detalles de la solicitud..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  // Solo mostrar "No se encontraron datos" si ya terminó de cargar y no hay header
  if (!loading && !header) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
          No se encontraron datos.
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: "Total Ítems", value: stats.total, color: "orange", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { label: "Aprobados", value: stats.aprobados, color: "green", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Pendientes", value: stats.pendientes, color: "blue", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "En Proceso", value: stats.enProceso, color: "purple", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { label: "Rechazados", value: stats.rechazados, color: "red", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const colorClasses = {
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header compartido */}
      <DashboardHeader
        userName={userName}
        roleLabel="Usuario"
        showBackButton={true}
        backTo="/solicitudes/usuario"
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Mis Solicitudes", to: "/solicitudes/usuario" },
          { label: `Detalle ${header.id}`, active: true }
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Detalle de Solicitud</h1>
          <p className="text-xs sm:text-sm text-gray-600 break-all">{header.nombreArchivo}</p>
        </div>

        {/* Stats Cards Grid - Responsive: 1 col mobile, 2 sm, 3 md, 5 lg */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${colorClasses[stat.color]} p-2 rounded-lg flex-shrink-0 ml-2`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* File Info + Selector */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* File Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Archivo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500">Fecha de carga</p>
                <p className="text-sm font-semibold text-gray-800">{formatFecha(header.fecha)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total ítems</p>
                <p className="text-sm font-semibold text-gray-800">{header.totalItems}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500">Observaciones</p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{header.observaciones}</p>
              </div>
            </div>
          </div>

          {/* Solicitud Selector + Botones de Descarga */}
          {solicitudes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solicitud / Hoja
              </label>
              <select
                value={solicitudActivaId ?? ""}
                onChange={(e) => {
                  setSolicitudActivaId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {solicitudes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.totalItems} ítems)
                  </option>
                ))}
              </select>

              {/* Botones de descarga - stack en mobile, row en sm+ */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {/* BOTÓN DESCARGAR ARCHIVO ORIGINAL */}
                {header?.archivoId && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${downloading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
                      }`}
                  >
                    {downloading ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="hidden xs:inline">Descargando...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">Descargar Original</span>
                        <span className="sm:hidden">Descargar</span>
                      </>
                    )}
                  </button>
                )}

                {/* BOTÓN GENERAR PDF DE ITEMS APROBADOS */}
                {solicitudActivaId && stats.aprobados > 0 && (
                  <button
                    onClick={handleGeneratePdf}
                    disabled={generatingPdf}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${generatingPdf
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md"
                      }`}
                  >
                    {generatingPdf ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="hidden xs:inline">Generando...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">PDF Aprobados ({stats.aprobados})</span>
                        <span className="sm:hidden">PDF ({stats.aprobados})</span>
                      </>
                    )}
                  </button>
                )}

                {solicitudActivaId && stats.aprobados === 0 && (
                  <div className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm text-gray-500 bg-gray-50 border border-gray-200 text-center">
                    <span className="hidden sm:inline">No hay ítems aprobados para generar PDF</span>
                    <span className="sm:hidden">Sin ítems aprobados</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search + Filter */}
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar código o descripción..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              {estados.map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Ítems de la Solicitud</h2>
            <p className="text-xs sm:text-sm text-gray-600">{filteredItems.length} ítem{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}</p>
          </div>

          {currentItems.length === 0 ? (
            <div className="p-8 sm:p-10 text-center text-sm text-gray-600">
              No se encontraron ítems con los filtros aplicados.
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y divide-gray-100">
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openItem(item)}
                    className="p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500">#{item.linea}</span>
                          <span className="text-sm font-mono text-gray-700 truncate">{item.codigo}</span>
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2">{item.descripcion}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 flex-shrink-0">
                        {item.estado}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span><strong className="text-gray-700">{item.cantidadTotal}</strong> {item.unidad}</span>
                      </div>
                      <span className="truncate max-w-[150px]" title={item.ultimaObservacion}>{item.ultimaObservacion}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">CÓDIGO</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">DESCRIPCIÓN</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">CANTIDAD</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">UNIDAD</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ESTADO</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">OBSERVACIÓN</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{item.linea}</td>
                        <td className="py-4 px-4 text-sm font-mono text-gray-700">{item.codigo}</td>
                        <td className="py-4 px-4 text-sm text-gray-800 max-w-md truncate" title={item.descripcion}>
                          {item.descripcion}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right font-semibold">{item.cantidadTotal}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{item.unidad}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            {item.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 font-medium max-w-xs truncate" title={item.ultimaObservacion}>{item.ultimaObservacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} de {filteredItems.length}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Anterior</span>
                      <span className="sm:hidden">←</span>
                    </button>
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 min-w-[60px] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <span className="sm:hidden">→</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>© 2026 Sistema Procura - Business & Development. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modals */}
      <ItemDetailsModal
        open={itemModalOpen}
        item={selectedItem}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={closeItemModal}
        onItemUpdated={refreshData}
        onApproveClick={startApprove}
        approvingDisabled={false}
      />

      <ModalConfirm
        open={confirmOpen}
        item={selectedItem}
        step={approveStep}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmApprove}
      />
    </div>
  );
};
