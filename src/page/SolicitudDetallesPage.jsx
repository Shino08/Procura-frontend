import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      ultimaObservacion: it?.ultimaObservacion?.observacion || "Sin observación", // tu response no trae observación; si luego agregas campo en BD, mapea aquí
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
      archivoId: file.id,              // <-- ID real para descargar
      id: formatArchivoId(file.id),    // <-- ID “bonito” para mostrar
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
const [approveStep, setApproveStep] = useState("confirm"); // confirm | processing | success

// arriba, junto a otros estados
const [estados, setEstados] = useState([]);

// al montar (o cuando haya token)
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
      // Simulación breve
      await new Promise((r) => setTimeout(r, 900));

      // Actualiza estado local: item aprobado
      setSolicitudes((prev) =>
        prev.map((sol) => ({
          ...sol,
          items: sol.items.map((it) =>
            it.id === selectedItem.id ? { ...it, estado: "Aprobado" } : it
          ),
        }))
      );

      // Mantén el selectedItem sincronizado
      setSelectedItem((prev) => (prev ? { ...prev, estado: "Aprobado" } : prev));

      setApproveStep("success");

      setTimeout(() => {
        setConfirmOpen(false);
        setApproveStep("confirm");
        closeItemModal();
      }, 700);
    } catch (e) {
      // Si falla, vuelve a confirm
      setApproveStep("confirm");
      setConfirmOpen(false);
    }
  };


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

// dentro del useMemo de filtros
const filteredItems = itemsBase.filter((item) => {
  const term = searchTerm.trim().toLowerCase();
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

const download = async (archivoId) => {
  if (!archivoId) throw new Error("archivoId inválido");

  const token = localStorage.getItem("token");

  // Asegúrate que tu backend realmente sea /archivos/:id/descargar
  const url = `${API_URL}/archivos/${archivoId}/descargar`;

  const res = await fetch(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob); // URL temporal para el blob [web:537]

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = header?.nombreArchivo || `archivo-${archivoId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(objectUrl); // libera memoria [web:538]
};

const handleDescargarPDF = async () => {
  if (!solicitudActivaId) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/generar-pdf/${solicitudActivaId}`, {
      method: 'GET',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });

    if (!res.ok) throw new Error(`Error ${res.status} al generar PDF`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Items-aprobados-${solicitudActivaId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showModal('success', 'PDF generado', 'El reporte se descargó correctamente.');
  } catch (e) {
    showModal('error', 'Error', e.message);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-sm text-gray-600">Cargando detalles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!header) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
          No se encontraron datos.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => navigate("/solicitudes/usuario")}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Volver"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold text-gray-800 sm:text-lg">{header.id}</h1>
                <p className="hidden truncate text-xs text-gray-500 sm:block">{header.nombreArchivo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
{header?.archivoId ? (
  <button
    onClick={() => download(header.archivoId)}
    className="hidden sm:inline-flex rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
  >
    Descargar
  </button>
) : null}

              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white hover:from-orange-600 hover:to-orange-700 sm:text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-5 sm:py-7">
        {/* Summary */}
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
        <div>
          <p className="text-xs text-gray-500">Fecha carga</p>
          <p className="text-sm font-semibold text-gray-800">{formatFecha(header.fecha)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total ítems</p>
          <p className="text-sm font-semibold text-gray-800">{header.totalItems}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Observaciones</p>
          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{header.observaciones}</p>
        </div>
      </div>
    </div>

    {/* Selector + PDF (en la misma fila) */}
    {solicitudes.length > 0 && (
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
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
          </div>

          <button
            onClick={handleDescargarPDF}
            disabled={!solicitudActivaId}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>
    )}

    {/* Stats compactos (3 columnas en móvil, 5 en desktop) */}
    <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
      {[
        { label: "Total", value: stats.total },
        { label: "Aprobados", value: stats.aprobados },
        { label: "Pendientes", value: stats.pendientes },
        { label: "En proceso", value: stats.enProceso },
        { label: "Rechazados", value: stats.rechazados },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">{s.label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-800">{s.value}</p>
        </div>
      ))}
    </div>

    {/* Filters compactos */}
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Tabla responsive (única vista, sin duplicar cards) */}
        {currentItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            No se encontraron ítems con los filtros aplicados.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto" /* scroll horizontal en móvil */>
              <table className="min-w-[900px] w-full table-auto text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Unidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Observación</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openItem(item)}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                      <td className="px-6 py-4 text-gray-600 font-medium">{item.linea}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">{item.codigo}</td>
                      <td className="px-6 py-4 text-gray-800 max-w-[520px]">
                        <span className="line-clamp-2">{item.descripcion}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{item.cantidadTotal}</td>
                      <td className="px-6 py-4 text-gray-600">{item.unidad}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{item.ultimaObservacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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
      </main>      
      
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
