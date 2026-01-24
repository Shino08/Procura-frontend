import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModalConfirm } from "../components/ModalConfirm";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { ResultModal } from "../components/ResultModal";
import { DashboardHeader } from "../components/DashboardHeader";
import { Breadcrumb } from "../components/Breadcrumb";
import { PageLoader } from "../components/LoadingSpinner";
import { API_URL } from "../services";
import { formatFecha } from "../utils/solicitudesUi";

/* ----------------------------- UI configs ----------------------------- */
const STATUS_CONFIG = {
  Pendiente: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", border: "border-yellow-300" },
  "En Revisión": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-300" },
  Aprobado: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", border: "border-green-300" },
  "En Compra": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-300" },
  Recibido: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-300" },
  Cancelado: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", border: "border-red-300" },
};

const DEFAULT_STATUS = STATUS_CONFIG.Pendiente;
const getStatusCfg = (estado) => STATUS_CONFIG[estado] || DEFAULT_STATUS;
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/* ----------------------------- Data mapping ---------------------------- */
const mapApiToUi = (api) => {
  const file = api?.file || null;
  const solicitudes = Array.isArray(api?.solicitudes) ? api.solicitudes : [];

  const menuSolicitudes = solicitudes.map((s) => ({
    id: s.id,
    nombre: s.nombre || s.name || `Solicitud ${s.id}`,
    items: Array.isArray(s.items) ? s.items : [],
  }));

  return { file, menuSolicitudes };
};

const getItemEstadoNombre = (item) => item?.estado?.nombre || item?.estado || item?.estadoNombre || "Pendiente";

/* -------------------------------- Page -------------------------------- */
export const GestionSolicitudesDetallesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActivaId, setSolicitudActivaId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [modal, setModal] = useState({ type: null });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveStep, setApproveStep] = useState("confirm");
  const [estados, setEstados] = useState([]);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [userName, setUserName] = useState("");

  const originalRef = useRef(null);

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
      const res = await fetch(`${API_URL}/archivos/detalles/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        signal: signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Error al cargar detalles");
      }

      const api = await res.json();
      const mapped = mapApiToUi(api);

      setFile(mapped.file);
      setSolicitudes(mapped.menuSolicitudes);

      // Mantener solicitud activa si existe
      setSolicitudActivaId((prevId) => {
        const exists = mapped.menuSolicitudes.some((s) => String(s.id) === String(prevId));
        return exists ? prevId : mapped.menuSolicitudes[0]?.id ?? null;
      });
      originalRef.current = deepClone(mapped.menuSolicitudes);
      return true;
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Error inesperado");
      }
      return false;
    }
  };

  // Función de refresh para callbacks (sin loading)
  const refreshData = async () => {
    await fetchDetails();
  };

  // Carga inicial de datos
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError("");
      await fetchDetails(controller.signal);
      setLoading(false);
    };

    loadData();
    return () => controller.abort();
  }, [id]);

  const solicitudActiva = useMemo(() => {
    return solicitudes.find((s) => String(s.id) === String(solicitudActivaId)) || null;
  }, [solicitudes, solicitudActivaId]);

  const rows = useMemo(() => {
    const items = solicitudActiva?.items || [];
    return items.map((it, idx) => {
      const estadoId = it?.estado?.id ?? null;
      const estadoNombre = it?.estado?.nombre ?? getItemEstadoNombre(it);

      return {
        id: it.id,
        linea: idx + 1,
        codigo: String(it.codigo || it.sku || "-"),
        descripcion: String(it.descripcion || "-"),
        cantidadTotal: it.cantidadTotal ?? it.cantidad ?? 0,
        unidad: it.unidad || "-",
        tipo: it.tipo || "-",
        estadoId,
        estado: estadoNombre,
        ultimaObservacion: it?.ultimaObservacion?.observacion || "",
      };
    });
  }, [solicitudActiva]);

  const { filteredRows, stats } = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();

    const filteredRows = rows.filter((r) => {
      const matchesSearch =
        !term ||
        (r.codigo || "").toLowerCase().includes(term) ||
        (r.descripcion || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "todos" || String(r.estadoId) === String(statusFilter);

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total: rows.length,
      aprobados: rows.filter((r) => r.estado === "Aprobado").length,
      pendientes: rows.filter((r) => r.estado === "Pendiente" || r.estado === "En Revisión").length,
      enProceso: rows.filter((r) => r.estado === "En Proceso").length,
      rechazados: rows.filter((r) => r.estado === "Rechazado").length,
    };

    return { filteredRows, stats };
  }, [rows, searchTerm, statusFilter]);

  const hayCambios = useMemo(() => {
    if (!originalRef.current) return false;
    return JSON.stringify(solicitudes) !== JSON.stringify(originalRef.current);
  }, [solicitudes]);

  const updateItemInSolicitudActiva = (itemId, patch) => {
    setSolicitudes((prev) =>
      prev.map((s) => {
        if (String(s.id) !== String(solicitudActivaId)) return s;
        return {
          ...s,
          items: (s.items || []).map((it) => (String(it.id) === String(itemId) ? { ...it, ...patch } : it)),
        };
      })
    );
  };

  const onChangeEstado = (itemId, nuevoEstadoNombre) => {
    updateItemInSolicitudActiva(itemId, {
      estado: { ...(typeof nuevoEstadoNombre === "string" ? { nombre: nuevoEstadoNombre } : {}) },
      estadoNombre: nuevoEstadoNombre
    });
  };

  const onChangeObs = (itemId, observacion) => {
    updateItemInSolicitudActiva(itemId, { observacion });
  };

  const descartarCambios = () => {
    if (!originalRef.current) return;
    setSolicitudes(deepClone(originalRef.current));
    setModal({ type: null });
  };

  const guardarCambios = async () => {
    setModal({ type: null });
    setGuardando(true);

    try {
      const original = originalRef.current || [];
      const current = solicitudes;

      const diffs = [];
      for (const s of current) {
        const s0 = original.find((x) => String(x.id) === String(s.id));
        const items0 = s0?.items || [];
        for (const it of s.items || []) {
          const it0 = items0.find((x) => String(x.id) === String(it.id));
          if (!it0) continue;

          const estadoNow = getItemEstadoNombre(it);
          const estadoOld = getItemEstadoNombre(it0);
          const obsNow = it.observacion || "";
          const obsOld = it0.observacion || "";

          if (estadoNow !== estadoOld || obsNow !== obsOld) {
            diffs.push({ itemId: it.id, estadoNombre: estadoNow, observacion: obsNow });
          }
        }
      }

      if (diffs.length === 0) {
        setModal({ type: "success" });
        return;
      }

      const token = localStorage.getItem("token");

      await Promise.all(
        diffs.map((d) =>
          fetch(`${API_URL}/items/${d.itemId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              estadoNombre: d.estadoNombre,
              observacion: d.observacion,
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err.error || err.message || "Error guardando un ítem");
            }
          })
        )
      );

      originalRef.current = deepClone(solicitudes);
      setModal({ type: "success" });
    } catch (e) {
      setModal({ type: "error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const openItem = (item) => {
    setSelectedItem(item);
    setActiveTab("general");
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setSelectedItem(null);
  };

  if (loading) {
    return <PageLoader text="Cargando detalles de la solicitud..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5">
          <p className="text-sm font-semibold text-red-600">Error</p>
          <p className="mt-1 text-xs text-gray-600">{error}</p>
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
        roleLabel="Administrador"
        showBackButton={true}
        backTo="/solicitudes/admin"
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: "Solicitudes", to: "/solicitudes/admin" },
          { label: `Detalle #${file?.id ?? id}`, active: true }
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Detalle de Solicitud</h1>
          <p className="text-sm text-gray-600">{file?.nombre || `Archivo #${file?.id ?? id}`}</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info + Search */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Info */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Archivo</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Fecha de carga</p>
                <p className="text-sm font-semibold text-gray-800">{formatFecha(file?.fechaCreacion)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total ítems</p>
                <p className="text-sm font-semibold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="space-y-3">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ítem..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="todos">Todos los estados</option>
                {estados.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Solicitud Selector */}
        {solicitudes.length > 1 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Solicitud / Hoja
            </label>
            <select
              value={solicitudActivaId ?? ""}
              onChange={(e) => setSolicitudActivaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {solicitudes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({(s.items || []).length} ítems)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Ítems de la Solicitud</h2>
            <p className="text-sm text-gray-600">{filteredRows.length} ítem{filteredRows.length !== 1 ? 's' : ''} encontrado{filteredRows.length !== 1 ? 's' : ''}</p>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-600">
              No se encontraron ítems con los filtros aplicados.
            </div>
          ) : (
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
                  {filteredRows.map((r) => {
                    const status = getStatusCfg(r.estado);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openItem(r)}
                      >
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{r.linea}</td>
                        <td className="py-4 px-4 text-sm font-mono text-gray-700">{r.codigo}</td>
                        <td className="py-4 px-4 text-sm text-gray-800 max-w-md truncate" title={r.descripcion}>
                          {r.descripcion}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right font-semibold">{r.cantidadTotal}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{r.unidad}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                            {r.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {r.ultimaObservacion || r.observacion || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>© 2026 Sistema Procura - Business & Development. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Bottom Bar for Changes */}
      {hayCambios ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-200 bg-white shadow-2xl">
          <div className="container mx-auto flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">Cambios sin guardar</p>
              <p className="hidden sm:block text-xs text-gray-600">Guarda o descarta antes de salir.</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => setModal({ type: "discard" })}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 sm:flex-none"
              >
                Descartar
              </button>
              <button
                onClick={() => setModal({ type: "save" })}
                disabled={guardando}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 sm:flex-none"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <ItemDetailsModal
        open={itemModalOpen}
        item={selectedItem}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={closeItemModal}
        onItemUpdated={refreshData}
        approvingDisabled={false}
      />

      <ModalConfirm
        open={confirmOpen}
        item={selectedItem}
        step={approveStep}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmModal
        open={modal.type === "save"}
        tone="success"
        title="¿Guardar cambios?"
        description="Se actualizarán los ítems modificados."
        confirmText="Guardar"
        loading={guardando}
        onCancel={() => setModal({ type: null })}
        onConfirm={guardarCambios}
      />

      <ConfirmModal
        open={modal.type === "discard"}
        tone="danger"
        title="¿Descartar cambios?"
        description="Se perderán las modificaciones no guardadas."
        confirmText="Descartar"
        onCancel={() => setModal({ type: null })}
        onConfirm={descartarCambios}
      />

      <ResultModal
        open={modal.type === "success"}
        tone="success"
        title="Operación exitosa"
        description="Acción completada correctamente."
        onClose={() => setModal({ type: null })}
      />

      <ResultModal
        open={modal.type === "error"}
        tone="danger"
        title="Error"
        description={modal.message || "Ocurrió un error. Intenta nuevamente."}
        onClose={() => setModal({ type: null })}
      />
    </div>
  );
};
