import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModalConfirm } from "../components/ModalConfirm";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
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

  // Modales de detalle / aprobación
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveStep, setApproveStep] = useState("confirm");
  const [estados, setEstados] = useState([]);

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
      } catch (_) {}
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!fileId) return;

    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/archivos/detalles/${fileId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
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
        setSolicitudActivaId(mappedSolicitudes[0]?.id ?? null);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    return () => controller.abort();
  }, [fileId]);

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

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100">
        <p className="text-sm text-gray-600">Cargando detalles...</p>
      </div>
    );
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

  if (!header) {
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
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
                <div className="text-xs text-gray-600">B&D</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userCorreo");
              localStorage.removeItem("userRol");
              navigate("/login");
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded text-sm flex items-center space-x-2"
          >
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-orange-500">🏠</span>
              <span className="text-gray-400">/</span>
              <Link to="/solicitudes/usuario" className="text-gray-600 hover:text-gray-900">Mis Solicitudes</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Detalle {header.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Detalle de Solicitud</h1>
          <p className="text-sm text-gray-600">{header.nombreArchivo}</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${colorClasses[stat.color]} p-2 rounded-lg`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* File Info + Selector */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Info */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Archivo</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Fecha de carga</p>
                <p className="text-sm font-semibold text-gray-800">{formatFecha(header.fecha)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total ítems</p>
                <p className="text-sm font-semibold text-gray-800">{header.totalItems}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Observaciones</p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{header.observaciones}</p>
              </div>
            </div>
          </div>

          {/* Solicitud Selector */}
          {solicitudes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-5">
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

              {header?.archivoId && (
                <div className="mt-3">
                  <a
                    href={`${API_URL}/archivos/${header.archivoId}/descargar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Descargar PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search + Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Ítems de la Solicitud</h2>
            <p className="text-sm text-gray-600">{filteredItems.length} ítem{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}</p>
          </div>

          {currentItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-600">
              No se encontraron ítems con los filtros aplicados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                        <td className="py-4 px-4 text-sm text-gray-600 font-medium">{item.ultimaObservacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} de {filteredItems.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
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
