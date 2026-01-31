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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

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
        const uid = 1;
        const role = "Administrador";
        const res = await fetch(`${API_URL}/estados`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid,
            "x-user-role": role,
          },
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
      const uid = 1;
      const role = "Administrador";
      const res = await fetch(`${API_URL}/archivos/detalles/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid,
          "x-user-role": role,
        },
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
      pendientes: rows.filter((r) => r.estado === "Pendiente").length,
      enRevision: rows.filter((r) => r.estado === "En Revisión").length,
      aprobados: rows.filter((r) => r.estado === "Aprobado").length,
      enCompra: rows.filter((r) => r.estado === "En Compra").length,
      recibidos: rows.filter((r) => r.estado === "Recibido").length,
      cancelados: rows.filter((r) => r.estado === "Cancelado").length,
    };

    return { filteredRows, stats };
  }, [rows, searchTerm, statusFilter]);

  // Paginación calculada
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage, ITEMS_PER_PAGE]);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, solicitudActivaId]);

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

      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");

      await Promise.all(
        diffs.map((d) =>
          fetch(`${API_URL}/items/${d.itemId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": uid || "",
              "x-user-role": role || "Usuario",
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
    { label: "Pendientes", value: stats.pendientes, color: "yellow", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "En Revisión", value: stats.enRevision, color: "blue", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
    { label: "Aprobados", value: stats.aprobados, color: "green", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "En Compra", value: stats.enCompra, color: "purple", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "Recibidos", value: stats.recibidos, color: "emerald", icon: "M5 13l4 4L19 7" },
    { label: "Cancelados", value: stats.cancelados, color: "red", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const colorClasses = {
    orange: "bg-orange-50 text-orange-500",
    yellow: "bg-yellow-50 text-yellow-500",
    green: "bg-green-50 text-green-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    emerald: "bg-emerald-50 text-emerald-500",
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
          { label: "Home", to: "/dashboard/admin" },
          { label: "Solicitudes", to: "/solicitudes/admin" },
          { label: `Detalle #${file?.id ?? id}`, active: true }
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Detalle de Solicitud</h1>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{file?.nombre || `Archivo #${file?.id ?? id}`}</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${colorClasses[stat.color]} p-1.5 sm:p-2 rounded-lg flex-shrink-0 ml-2`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info + Search */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* File Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Información del Archivo</h3>
            <div className="grid grid-cols-2 gap-3 sm:space-y-0 sm:grid-cols-2">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Fecha de carga</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">{formatFecha(file?.fechaCreacion)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total ítems</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
            <div className="space-y-2 sm:space-y-3">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ítem..."
                className="w-full pl-3 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm"
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
        {solicitudes.length > 0 && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-5">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Solicitud / Hoja
            </label>
            <select
              value={solicitudActivaId ?? ""}
              onChange={(e) => setSolicitudActivaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {solicitudes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({(s.items || []).length} ítems)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items Table - Premium Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Ítems de la Solicitud</h2>
                <p className="text-xs text-gray-500">{filteredRows.length} ítem{filteredRows.length !== 1 ? 's' : ''} encontrado{filteredRows.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click en fila para detalles
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No se encontraron ítems</p>
              <p className="text-xs text-gray-400 mt-1">Intenta ajustar los filtros aplicados</p>
            </div>
          ) : (
            <>
              {/* Mobile hint */}
              <div className="flex sm:hidden items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 text-xs text-orange-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Desliza para ver más columnas
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 via-gray-100/50 to-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Unidad</th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((r, idx) => {
                      const status = getStatusCfg(r.estado);
                      return (
                        <tr
                          key={r.id}
                          className={`group cursor-pointer transition-all duration-150 hover:bg-orange-50/60 hover:shadow-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${idx === 0 ? 'bg-orange-50/40' : ''}`}
                          onClick={() => openItem(r)}
                        >
                          {/* Línea */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5">
                            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 text-xs sm:text-sm font-bold text-gray-700 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                              {r.linea}
                            </span>
                          </td>

                          {/* Código */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5">
                            <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-[10px] sm:text-xs font-mono font-semibold text-slate-700 group-hover:bg-slate-200 transition-colors">
                              {r.codigo}
                            </span>
                          </td>

                          {/* Descripción */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5 max-w-[180px] sm:max-w-sm">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate group-hover:text-gray-900" title={r.descripcion}>
                              {r.descripcion}
                            </p>
                          </td>

                          {/* Cantidad */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full bg-purple-100 text-xs sm:text-sm font-bold text-purple-700">
                              {r.cantidadTotal}
                            </span>
                          </td>

                          {/* Unidad */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5 text-center">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                              {r.unidad}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border ${status.bg} ${status.text} border-current/20`}>
                              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${status.dot}`} />
                              <span className="hidden sm:inline">{r.estado}</span>
                              <span className="sm:hidden">{r.estado.substring(0, 4)}</span>
                            </span>
                          </td>

                          {/* Observación */}
                          <td className="py-3.5 sm:py-4 px-3 sm:px-5">
                            <div className="flex items-center gap-2 max-w-[120px] sm:max-w-xs">
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate flex-1" title={r.ultimaObservacion || r.observacion}>
                                {r.ultimaObservacion || r.observacion || "—"}
                              </p>
                              <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer con paginación */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                {/* Info del total */}
                <div className="flex items-center gap-4">
                  <p className="text-xs text-gray-500">
                    Mostrando <span className="font-semibold text-gray-700">{paginatedRows.length}</span> de <span className="font-semibold text-gray-700">{filteredRows.length}</span> ítems
                  </p>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                    <span>Cantidad total:</span>
                    <span className="font-bold text-purple-600">
                      {filteredRows.reduce((sum, r) => sum + (parseFloat(r.cantidadTotal) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* Botón Anterior */}
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${currentPage === pageNum
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón Siguiente */}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-600">
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
