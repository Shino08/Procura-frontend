import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ModalConfirm } from "../components/ModalConfirm";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { ITEMS_PER_PAGE, formatArchivoId, formatFecha } from "../utils/solicitudesUi";
import { API_URL } from "../services";

export const SolicitudDetallesPage = () => {
  const navigate = useNavigate();
  const { fileId } = useParams();

  const [header, setHeader] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActivaId, setSolicitudActivaId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modales
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveStep, setApproveStep] = useState("confirm"); // confirm | processing | success

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
        const archivo = data?.file;
        const solicitudesApi = Array.isArray(data?.solicitudes) ? data.solicitudes : [];

        if (!archivo) throw new Error("Archivo no encontrado.");

        const mappedSolicitudes = solicitudesApi.map((s, idxSolicitud) => {
          const materiales = Array.isArray(s.data) ? s.data : [];
          const items = materiales.map((m, idxItem) => ({
            linea: idxItem + 1,
            codigo: m.codigo,
            descripcion: m.descripcion || "Sin descripción",
            cantidad: m.cantidadtotal || 0,
            tipo: "Materiales",
            unidad: m.unidad,
            estado: "Pendiente",
            observacion: "",
          }));

          return {
            id: s.id ?? idxSolicitud + 1,
            nombre: s.name ?? `Solicitud ${idxSolicitud + 1}`,
            totalItems: items.length,
            items,
          };
        });

        const totalItemsArchivo = mappedSolicitudes.reduce((acc, s) => acc + s.totalItems, 0);

        setHeader({
          id: formatArchivoId(archivo.id),
          fecha: archivo.createdat,
          nombreArchivo: archivo.sourcefile,
          totalItems: totalItemsArchivo,
          observaciones: `Solicitudes asociadas: ${mappedSolicitudes.length}`,
        });

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

  const solicitudActiva = useMemo(
    () => solicitudes.find((s) => String(s.id) === String(solicitudActivaId)) || solicitudes[0] || null,
    [solicitudes, solicitudActivaId]
  );

  const itemsBase = solicitudActiva?.items || [];

  const { filteredItems, stats, totalPages, currentItems, startIndex, endIndex } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filteredItems = itemsBase.filter((item) => {
      const matchesSearch =
        !term ||
        item.codigo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "todos" || item.estado === statusFilter;
      const matchesTipo = tipoFilter === "todos" || item.tipo === tipoFilter;

      return matchesSearch && matchesStatus && matchesTipo;
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
  }, [itemsBase, searchTerm, statusFilter, tipoFilter, currentPage]);

  const openItem = (item) => {
    setSelectedItem(item);
    setActiveTab("general");
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setSelectedItem(null);
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

      // Aquí conectas tu API real (en tu código era simulado)
      await new Promise((r) => setTimeout(r, 1200));

      setSolicitudes((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.map((it) =>
            it.linea === selectedItem.linea ? { ...it, estado: "Aprobado" } : it
          ),
        }))
      );

      setSelectedItem((p) => (p ? { ...p, estado: "Aprobado" } : p));
      setApproveStep("success");

      setTimeout(() => {
        setConfirmOpen(false);
        setApproveStep("confirm");
        setItemModalOpen(false);
      }, 900);
    } catch {
      setConfirmOpen(false);
      setApproveStep("confirm");
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
                onClick={() => navigate("/solicitudes/lista")}
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

            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white hover:from-orange-600 hover:to-orange-700 sm:text-sm"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-5 sm:py-7">
        {/* Summary */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        {/* Selector de hoja */}
        {solicitudes.length > 0 && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Solicitud / Hoja</label>
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
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total", value: stats.total },
            { label: "Aprobados", value: stats.aprobados },
            { label: "Pendientes", value: stats.pendientes },
            { label: "En proceso", value: stats.enProceso },
            { label: "Rechazados", value: stats.rechazados },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar código o descripción..."
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />

            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="todos">Todos los tipos</option>
              <option value="Productos">Productos</option>
              <option value="Servicios">Servicios</option>
              <option value="Materiales">Materiales</option>
              <option value="Equipos">Equipos</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Aprobado">Aprobado</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* List */}
        {currentItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            No se encontraron ítems con los filtros aplicados.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Unidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Obs.</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr
                      key={item.linea}
                      onClick={() => openItem(item)}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                      <td className="px-6 py-4 text-gray-600 font-medium">{item.linea}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">{item.codigo}</td>
                      <td className="px-6 py-4 text-gray-800 max-w-md">{item.descripcion}</td>
                      <td className="px-6 py-4 text-gray-700">{item.tipo}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{item.cantidad}</td>
                      <td className="px-6 py-4 text-gray-600">{item.unidad}</td>
                      <td className="px-6 py-4 text-gray-700">{item.estado}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">{item.observacion || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet */}
            <div className="lg:hidden divide-y divide-gray-200">
              {currentItems.map((item) => (
                <button
                  key={item.linea}
                  onClick={() => openItem(item)}
                  className="w-full text-left p-4 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-mono">{item.codigo}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2">{item.descripcion}</p>
                      <p className="mt-2 text-xs text-gray-600">
                        {item.cantidad} {item.unidad} • {item.tipo}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                      {item.estado}
                    </span>
                  </div>
                </button>
              ))}
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
