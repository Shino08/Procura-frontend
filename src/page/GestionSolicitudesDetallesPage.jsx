import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ModalConfirm } from "../components/ModalConfirm";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { ResultModal } from "../components/ResultModal";

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
/**
 * Backend: { file, solicitudes }
 * solicitudes: array de Solicitud, cada una con items[] y estado (relación) incluida. [web:175]
 *
 * Esta función normaliza para la tabla:
 * - hoja/solicitud (para selector)
 * - filas aplanadas por solicitud activa
 */
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
  const { id } = useParams(); // id del archivo

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActivaId, setSolicitudActivaId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [modal, setModal] = useState({ type: null }); // null | save | discard | success | error

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveStep, setApproveStep] = useState("confirm");

const [saveOpen, setSaveOpen] = useState(false);
const [discardOpen, setDiscardOpen] = useState(false);
const [successOpen, setSuccessOpen] = useState(false);
const [errorOpen, setErrorOpen] = useState(false);

const [estados, setEstados] = useState([]);        // [{id, nombre}]
const [statusFilter, setStatusFilter] = useState("todos"); // ahora guardará id o "todos"

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
};

  // snapshot original para detectar cambios
  const originalRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:3000/api/archivos/detalles/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || "Error al cargar detalles");
        }

        const api = await res.json();
        const mapped = mapApiToUi(api);

        setFile(mapped.file);
        setSolicitudes(mapped.menuSolicitudes);

        const firstId = mapped.menuSolicitudes[0]?.id ?? null;
        setSolicitudActivaId(firstId);

        // guardar snapshot original (para descartar / detectar cambios)
        originalRef.current = deepClone(mapped.menuSolicitudes);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    return () => controller.abort();
  }, [id]);

  const solicitudActiva = useMemo(() => {
    return solicitudes.find((s) => String(s.id) === String(solicitudActivaId)) || null;
  }, [solicitudes, solicitudActivaId]);

  // Normaliza filas de la solicitud activa a un shape estable para tabla
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
      estadoId,                 // <-- CLAVE para el filtro
      estado: estadoNombre,     // <-- lo que muestras en tabla/badge
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


  // Cambios: compara current vs snapshot original
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
    // guardamos como campo plano para UI; al guardar se traduce a lo que pida el backend
    updateItemInSolicitudActiva(itemId, { estado: { ...(typeof nuevoEstadoNombre === "string" ? { nombre: nuevoEstadoNombre } : {}) }, estadoNombre: nuevoEstadoNombre });
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
      // 1) calcular diffs (solo lo modificado)
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

      // 2) si no hay diffs, no hagas request
      if (diffs.length === 0) {
        setModal({ type: "success" });
        return;
      }

      const token = localStorage.getItem("token");

      // TODO: reemplaza por tu endpoint real.
      // Recomendación: endpoint batch para evitar N requests.
      // await fetch(`http://localhost:3000/api/archivos/${id}/items`, { method: "PUT", body: JSON.stringify({ diffs }) ... })

      await Promise.all(
        diffs.map((d) =>
          fetch(`http://localhost:3000/api/items/${d.itemId}`, {
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

      // 3) commit snapshot
      originalRef.current = deepClone(solicitudes);
      setModal({ type: "success" });
    } catch (e) {
      setModal({ type: "error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5">
          <p className="text-sm font-semibold text-red-600">Error</p>
          <p className="mt-1 text-xs text-gray-600">{error}</p>
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
                onClick={() => navigate("/solicitudes/admin")}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Volver"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-sm sm:text-base lg:text-xl font-bold text-gray-800">
                  Archivo #{file?.id ?? id}
                </h1>
                <p className="hidden sm:block truncate text-xs text-gray-500">
                  {file?.sourcefile || file?.nombreArchivo || "-"}
                </p>
              </div>

              {hayCambios ? (
                <span className="ml-1 hidden md:inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  Cambios sin guardar
                </span>
              ) : null}
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-5 pb-28 sm:pb-24">
        {/* Info + selector solicitud */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Fecha de carga</p>
              <p className="text-sm font-semibold text-gray-800">{formatFecha(file?.fechaCreacion || file?.fechaCreacion)}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">Solicitud / Hoja</p>
              <select
                value={solicitudActivaId ?? ""}
                onChange={(e) => setSolicitudActivaId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {solicitudes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({(s.items || []).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats compactas */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Total", stats.total],
            ["Aprob.", stats.aprobados],
            ["Pend.", stats.pendientes],
            ["Proceso", stats.enProceso],
            ["Rech.", stats.rechazados],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar código o descripción..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

        {/* Tabla responsive */}
        {filteredRows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            No se encontraron ítems con los filtros aplicados.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto" /* responsive scroll */>
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Cant.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Unidad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Obs. admin</th>
                  </tr>
                </thead>

<tbody className="divide-y divide-gray-200">
  {filteredRows.map((r) => {
    const status = getStatusCfg(r.estado);

    return (
      <tr
        key={r.id}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => openItem(r)}
      >
        <td className="px-4 py-3 text-gray-600 font-medium">{r.linea}</td>

        <td className="px-4 py-3">
          <span className="font-mono text-xs text-gray-700">{r.codigo}</span>
        </td>

        <td className="px-4 py-3 text-gray-800 max-w-[520px]">
          <span className="line-clamp-2">{r.descripcion}</span>
        </td>

        <td className="px-4 py-3 text-right font-semibold text-gray-800">{r.cantidadTotal}</td>

        <td className="px-4 py-3 text-gray-600">{r.unidad}</td>

        {/* Estado (solo visual) */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {r.estado}
          </span>
        </td>

        {/* Observación (solo visual) */}
        <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">
          {r.ultimaObservacion || r.observacion}
        </td>
      </tr>
    );
  })}
</tbody>

              </table>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar */}
      {hayCambios ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-200 bg-white shadow-2xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">Cambios sin guardar</p>
              <p className="hidden sm:block text-xs text-gray-600">Guarda o descarta antes de salir.</p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => setModal({ type: "discard" })}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-200 sm:flex-none"
              >
                Descartar
              </button>

              <button
                onClick={() => setModal({ type: "save" })}
                disabled={guardando}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 sm:flex-none"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

<ItemDetailsModal
  open={itemModalOpen}
  item={selectedItem}
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  onClose={closeItemModal}
  onItemUpdated={() => {
    // opcional: refrescar todo el archivo para ver los cambios
    window.location.reload(); // o llama fetchDetails() de nuevo
  }}
  approvingDisabled={false}
/>

<ModalConfirm
  open={confirmOpen}
  item={selectedItem}
  step={approveStep}
  onCancel={() => setConfirmOpen(false)}
/>


  <ConfirmModal
  open={saveOpen}
  tone="success"
  title="¿Guardar cambios?"
  description="Se actualizarán los ítems modificados."
  confirmText="Guardar"
  loading={guardando}
  onCancel={() => setSaveOpen(false)}
  onConfirm={guardarCambios}
/>

<ConfirmModal
  open={discardOpen}
  tone="danger"
  title="¿Descartar cambios?"
  description="Se perderán las modificaciones no guardadas."
  confirmText="Descartar"
  onCancel={() => setDiscardOpen(false)}
  onConfirm={descartarCambios}
/>

<ResultModal
  open={successOpen}
  tone="success"
  title="Operación exitosa"
  description="Acción completada correctamente."
  onClose={() => setSuccessOpen(false)}
/>

<ResultModal
  open={errorOpen}
  tone="danger"
  title="Error"
  description="Ocurrió un error. Intenta nuevamente."
  onClose={() => setErrorOpen(false)}
/>

    </div>
  );
};
