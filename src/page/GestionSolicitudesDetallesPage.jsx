// src/page/GestionSolicitudDetallesPage.jsx
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ----------------------------- UI helpers ----------------------------- */

const STATUS = ["Pendiente", "En Revisión", "Aprobado", "En Proceso", "Rechazado"];
const TIPOS = ["Productos", "Servicios", "Materiales", "Equipos"];

const STATUS_CONFIG = {
  Pendiente: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", border: "border-yellow-300" },
  "En Revisión": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-300" },
  Aprobado: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", border: "border-green-300" },
  Rechazado: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", border: "border-red-300" },
  "En Proceso": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-300" },
};

const TIPO_CONFIG = {
  Productos: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Servicios: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Materiales: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Equipos: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

const getStatusCfg = (estado) => STATUS_CONFIG[estado] || STATUS_CONFIG.Pendiente;
const getTipoCfg = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.Productos;

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

const clone = (obj) => JSON.parse(JSON.stringify(obj));

/* ------------------------------ UI pieces ----------------------------- */

const Modal = ({ open, tone = "default", title, description, onClose, actions }) => {
  if (!open) return null;

  const toneBar =
    tone === "success"
      ? "from-green-500 to-green-600"
      : tone === "danger"
      ? "from-red-500 to-red-600"
      : "from-gray-700 to-gray-800";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${toneBar}`} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">{title}</h3>
              {description ? <p className="mt-1 text-xs sm:text-sm text-gray-600">{description}</p> : null}
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Cerrar">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {actions ? <div className="mt-5 flex flex-col sm:flex-row gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, tone = "neutral" }) => {
  const toneStyles =
    tone === "success"
      ? "hover:border-green-300"
      : tone === "warning"
      ? "hover:border-yellow-300"
      : tone === "danger"
      ? "hover:border-red-300"
      : tone === "info"
      ? "hover:border-orange-300"
      : "hover:border-gray-300";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg ${toneStyles}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100">{icon}</div>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const ItemCard = ({ item, onEstado, onObs }) => {
  const status = getStatusCfg(item.estado);
  const tipo = getTipoCfg(item.tipo);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-mono">{item.codigo}</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2">{item.descripcion}</p>
        </div>

        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tipo.bg} ${tipo.text}`}>
          {item.tipo}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-gray-800">{item.cantidad}</span>
          <span className="text-gray-500">{item.unidad}</span>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {item.estado}
        </span>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Estado</label>
        <select
          value={item.estado}
          onChange={(e) => onEstado(item.linea, e.target.value)}
          className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 ${status.bg} ${status.text} ${status.border}`}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Observación admin</label>
        <div className="relative">
          <input
            value={item.observacion}
            onChange={(e) => onObs(item.linea, e.target.value)}
            placeholder="Agregar observación..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {item.observacion ? (
            <button
              onClick={() => onObs(item.linea, "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-red-600"
              title="Limpiar"
              aria-label="Limpiar observación"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- Page -------------------------------- */

export const GestionSolicitudesDetallesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");

  const [guardando, setGuardando] = useState(false);

  // Modales unificados (en vez de 4 booleanos repetidos)
  const [modal, setModal] = useState({ type: null }); // null | save | discard | success | error

  // Datos demo (igual que tu original, pero con initialState limpio)
  const solicitud = useMemo(
    () => ({
      id,
      cliente: "Juan Pérez",
      email: "juan.perez@empresa.com",
      fecha: "2025-11-27",
      nombreArchivo: "solicitud-proyecto-norte-nov-2025.xlsx",
      totalItems: 8,
      observaciones: "Solicitud urgente para proyecto Norte - Fase 1",
    }),
    [id]
  );

  const initialItems = useMemo(
    () => [
      { linea: 1, codigo: "PROD-001", descripcion: "Válvula de Bola 2\" Acero Inoxidable", cantidad: 25, tipo: "Productos", unidad: "Unidad", estado: "Aprobado", observacion: "Stock disponible" },
      { linea: 2, codigo: "PROD-002", descripcion: "Tubo PVC 4\" Schedule 40 - 6 metros", cantidad: 50, tipo: "Productos", unidad: "Metro", estado: "Aprobado", observacion: "Confirmar medidas" },
      { linea: 3, codigo: "MAT-015", descripcion: "Codo 90° 2\" Roscado Hierro Galvanizado", cantidad: 80, tipo: "Materiales", unidad: "Unidad", estado: "Pendiente", observacion: "" },
      { linea: 4, codigo: "SERV-008", descripcion: "Instalación sistema tubería completo", cantidad: 1, tipo: "Servicios", unidad: "Global", estado: "En Revisión", observacion: "" },
      { linea: 5, codigo: "EQUIP-022", descripcion: "Compresor de aire 25HP trifásico", cantidad: 2, tipo: "Equipos", unidad: "Unidad", estado: "Rechazado", observacion: "Presupuesto excedido" },
      { linea: 6, codigo: "MAT-045", descripcion: "Teflón industrial rollo 50m", cantidad: 15, tipo: "Materiales", unidad: "Rollo", estado: "Aprobado", observacion: "" },
      { linea: 7, codigo: "PROD-089", descripcion: "Válvula Compuerta 4\" Hierro Fundido", cantidad: 12, tipo: "Productos", unidad: "Unidad", estado: "Pendiente", observacion: "" },
      { linea: 8, codigo: "MAT-101", descripcion: "Niple Hierro Galvanizado 1/2\" x 6\"", cantidad: 100, tipo: "Materiales", unidad: "Unidad", estado: "En Proceso", observacion: "Pedido a proveedor" },
    ],
    []
  );

  // Guardar “original” en ref para evitar JSON stringify en cada render
  const originalRef = useRef(clone(initialItems));
  const [items, setItems] = useState(() => clone(initialItems));

  const hayCambios = useMemo(() => JSON.stringify(items) !== JSON.stringify(originalRef.current), [items]);

  const onEstado = (linea, estado) =>
    setItems((prev) => prev.map((it) => (it.linea === linea ? { ...it, estado } : it)));

  const onObs = (linea, observacion) =>
    setItems((prev) => prev.map((it) => (it.linea === linea ? { ...it, observacion } : it)));

  const { filteredItems, stats } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filteredItems = items.filter((it) => {
      const matchesSearch =
        !term ||
        it.codigo.toLowerCase().includes(term) ||
        it.descripcion.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "todos" || it.estado === statusFilter;
      const matchesTipo = tipoFilter === "todos" || it.tipo === tipoFilter;

      return matchesSearch && matchesStatus && matchesTipo;
    });

    const stats = {
      total: items.length,
      aprobados: items.filter((i) => i.estado === "Aprobado").length,
      pendientes: items.filter((i) => i.estado === "Pendiente" || i.estado === "En Revisión").length,
      enProceso: items.filter((i) => i.estado === "En Proceso").length,
      rechazados: items.filter((i) => i.estado === "Rechazado").length,
    };

    return { filteredItems, stats };
  }, [items, searchTerm, statusFilter, tipoFilter]);

  const guardarCambios = async () => {
    setModal({ type: null });
    setGuardando(true);

    try {
      // TODO: PUT backend
      await new Promise((r) => setTimeout(r, 900));
      originalRef.current = clone(items);
      setModal({ type: "success" });
    } catch {
      setModal({ type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const descartarCambios = () => {
    setItems(clone(originalRef.current));
    setModal({ type: null });
  };

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
                  {solicitud.id}
                </h1>
                <p className="hidden sm:block truncate text-xs text-gray-500">
                  Cliente: {solicitud.cliente}
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
        {/* Info solicitud */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{solicitud.cliente}</p>
              <p className="text-xs text-gray-500 truncate">{solicitud.email}</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs text-gray-500">Archivo</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{solicitud.nombreArchivo}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Fecha de carga</p>
              <p className="text-sm font-semibold text-gray-800">{formatFecha(solicitud.fecha)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Total"
            value={stats.total}
            icon={
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            label="Aprobados"
            value={stats.aprobados}
            tone="success"
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StatCard
            label="Pendientes"
            value={stats.pendientes}
            tone="warning"
            icon={
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="En proceso"
            value={stats.enProceso}
            tone="info"
            icon={
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
          <StatCard
            label="Rechazados"
            value={stats.rechazados}
            tone="danger"
            icon={
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="todos">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="todos">Todos los estados</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List (solo cards responsive; se elimina tabla redundante) */}
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            No se encontraron ítems con los filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.linea} item={item} onEstado={onEstado} onObs={onObs} />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Bar (solo si hay cambios) */}
      {hayCambios ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-200 bg-white shadow-2xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Cambios sin guardar</p>
                <p className="hidden sm:block text-xs text-gray-600">Guarda o descarta antes de salir.</p>
              </div>
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

      {/* Modales (reutilizable) */}
      <Modal
        open={modal.type === "save"}
        tone="success"
        title="¿Guardar cambios?"
        description="Se actualizarán estados y observaciones de los ítems modificados."
        onClose={() => setModal({ type: null })}
        actions={
          <>
            <button
              onClick={() => setModal({ type: null })}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={guardarCambios}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-green-600 hover:to-green-700"
            >
              Confirmar
            </button>
          </>
        }
      />

      <Modal
        open={modal.type === "discard"}
        tone="danger"
        title="¿Descartar cambios?"
        description="Se perderán todas las modificaciones realizadas."
        onClose={() => setModal({ type: null })}
        actions={
          <>
            <button
              onClick={() => setModal({ type: null })}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={descartarCambios}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-red-600 hover:to-red-700"
            >
              Descartar
            </button>
          </>
        }
      />

      <Modal
        open={modal.type === "success"}
        tone="success"
        title="Cambios guardados"
        description="Los cambios se guardaron correctamente."
        onClose={() => setModal({ type: null })}
        actions={
          <button
            onClick={() => {
              setModal({ type: null });
              navigate("/solicitudes/gestion");
            }}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-green-600 hover:to-green-700"
          >
            Entendido
          </button>
        }
      />

      <Modal
        open={modal.type === "error"}
        tone="danger"
        title="Error al guardar"
        description="Ocurrió un error al intentar guardar. Intenta nuevamente."
        onClose={() => setModal({ type: null })}
        actions={
          <button
            onClick={() => setModal({ type: null })}
            className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-red-600 hover:to-red-700"
          >
            Cerrar
          </button>
        }
      />
    </div>
  );
};
