// ItemDetailsModal.jsx (CON CHAT de observaciones)
import { useEffect, useState, useRef } from "react";
import { getStatusCfg, getTipoCfg } from "../utils/solicitudesUi";
import { UploadAdjuntosModal } from "./UploadAdjuntosModal";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";
import { InlineSpinner } from "./LoadingSpinner";
import { API_URL } from "../services";

export const ItemDetailsModal = ({
  open,
  item,
  activeTab,
  setActiveTab,
  onClose,
  onItemUpdated,
}) => {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);
  const [errorAdjuntos, setErrorAdjuntos] = useState("");

  const [estados, setEstados] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(false);

  const [observaciones, setObservaciones] = useState([]);
  const [loadingObservaciones, setLoadingObservaciones] = useState(false);

  const [selectedEstadoId, setSelectedEstadoId] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [sendingObservacion, setSendingObservacion] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorSave, setErrorSave] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [approvingQuote, setApprovingQuote] = useState(false);

  // Estados para modales de confirmación
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [adjuntoToDelete, setAdjuntoToDelete] = useState(null);

  // Ref para scroll automático del chat
  const chatEndRef = useRef(null);

  // Detectar rol y usuario actual
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No hay token en localStorage");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const rol = payload.rol || payload.role || payload.nombreRol;
      const userId = payload.id || payload.userId || payload.sub;
      const userName = payload.nombre || payload.name || payload.username;
      
      setUserRole(rol);
      setCurrentUserId(userId);
      setCurrentUserName(userName);
    } catch (e) {
      console.error("❌ Error decodificando token:", e);
    }
  }, []);

  const roleNormalized = (userRole || "").trim().toLowerCase();
  const isAdmin = roleNormalized === "administrador";
  const isUser = roleNormalized === "procura" || roleNormalized === "usuario";

  // Scroll automático al final del chat
  useEffect(() => {
    if (activeTab === "observaciones" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [observaciones, activeTab]);

  // Cargar estados (solo admin)
  useEffect(() => {
    if (!open || !isAdmin) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingEstados(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/estados`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Error cargando estados");

        const data = await res.json();
        setEstados(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoadingEstados(false);
      }
    })();

    return () => controller.abort();
  }, [open, isAdmin]);

  useEffect(() => {
    if (!item) return;
    const estadoId = item.estado?.id ?? null;
    setSelectedEstadoId(estadoId);
  }, [item]);

  // Cargar adjuntos
  useEffect(() => {
    if (!open || !item?.id || activeTab !== "archivos") {
      setAdjuntos([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingAdjuntos(true);
        setErrorAdjuntos("");

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/items/${item.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Error cargando adjuntos");
        }

        const data = await res.json();
        const lista = Array.isArray(data?.archivos) ? data.archivos : Array.isArray(data) ? data : [];
        setAdjuntos(lista);
      } catch (e) {
        if (e.name !== "AbortError") setErrorAdjuntos(e.message || "Error inesperado");
      } finally {
        setLoadingAdjuntos(false);
      }
    })();

    return () => controller.abort();
  }, [open, item?.id, activeTab]);

// Cargar observaciones (chat)
useEffect(() => {
  if (!open || !item?.id || activeTab !== "observaciones") {
    setObservaciones([]);
    return;
  }

  const controller = new AbortController();

  (async () => {
    try {
      setLoadingObservaciones(true);

      const token = localStorage.getItem("token");

      // ✅ TU ENDPOINT REAL: GET /observaciones/:itemId
      const res = await fetch(`${API_URL}/observaciones/${item.id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Error cargando observaciones");

      const data = await res.json().catch(() => ({}));
      const lista = Array.isArray(data?.observaciones) ? data.observaciones : [];

      // ✅ Asegura orden viejo -> nuevo (sin depender del orderBy del backend)
      const ordered = [...lista].sort(
        (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
      );

      setObservaciones(ordered);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      setLoadingObservaciones(false);
    }
  })();

  return () => controller.abort();
}, [open, item?.id, activeTab]);

  if (!open || !item) return null;

  const status = getStatusCfg(item.estado?.nombre || item.estado);
  const tipo = getTipoCfg(item.tipo);

  // Guardar cambios (solo admin - solo estado)
  const handleGuardar = async () => {
    if (!isAdmin) return;

    setSaving(true);
    setErrorSave("");

    try {
      const token = localStorage.getItem("token");

      if (selectedEstadoId && selectedEstadoId !== item.estado?.id) {
        const resEstado = await fetch(`${API_URL}/estados/${item.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ idEstado: selectedEstadoId }),
        });

        if (!resEstado.ok) {
          const err = await resEstado.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Error al actualizar estado");
        }
      }

      setConfirmSaveOpen(false);
      onItemUpdated?.();
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
      setConfirmSaveOpen(false);
    } finally {
      setSaving(false);
    }
  };
  // Enviar observación (ambos roles)
const handleSendObservacion = async (e) => {
  e?.preventDefault();

  const texto = nuevaObservacion.trim();
  if (!texto || !item?.id) return;

  setSendingObservacion(true);
  setErrorSave("");

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/observaciones/${item.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ observacion: texto }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Error al enviar observación");
    }

    // Caso A: el backend devuelve la observación creada (recomendado)
    const maybeObs = await res.json().catch(() => null);

    if (maybeObs && maybeObs.id) {
      setObservaciones((prev) => [...prev, maybeObs]);
    } else {
      // Caso B: el backend devuelve solo {ok:true} o similar -> recargar lista
const res2 = await fetch(`${API_URL}/observaciones/${item.id}`, {
  headers: { Authorization: token ? `Bearer ${token}` : "" },
});

const data2 = await res2.json().catch(() => ({}));
const lista2 = Array.isArray(data2?.observaciones) ? data2.observaciones : [];

const ordered2 = [...lista2].sort(
  (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
);

setObservaciones(ordered2);

    }

    setNuevaObservacion("");
  } catch (err) {
    setErrorSave(err.message || "Error inesperado");
  } finally {
    setSendingObservacion(false);
  }
};

  const handleAprobarCotizacion = async () => {
    if (!isUser) return;

    setApprovingQuote(true);
    setErrorSave("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/estados/${item.id}/aprobar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al aprobar cotización");
      }

      window.location.reload();

      onItemUpdated?.();
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setApprovingQuote(false);
    }
  };

  const uploadAdjuntos = async ({ files, descripcion }) => {
    if (!isAdmin) return;
    if (!item?.id) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();

      files.forEach((f) => fd.append("archivo", f));
      fd.append("descripcion", descripcion || "");
      fd.append("itemId", String(item.id));

      const res = await fetch(`${API_URL}/items/${item.id}/adjuntar`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error subiendo adjuntos");
      }

      setUploadOpen(false);
      
      // Recargar adjuntos
      if (activeTab === "archivos") {
        const token2 = localStorage.getItem("token");
        const res2 = await fetch(`${API_URL}/items/${item.id}`, {
          headers: { Authorization: token2 ? `Bearer ${token2}` : "" },
        });
        if (res2.ok) {
          const data = await res2.json();
          setAdjuntos(Array.isArray(data?.archivos) ? data.archivos : []);
        }
      }
    } catch (e) {
      setErrorAdjuntos(e.message || "Error subiendo adjuntos");
    } finally {
      setUploading(false);
    }
  };

  const download = async (archivoId) => {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/items/${item.id}/${archivoId}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("No se pudo descargar");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `adjunto-${archivoId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setErrorAdjuntos(e.message || "Error al descargar");
    }
  };

  const requestDeleteAdjunto = (archivoId) => {
    setAdjuntoToDelete(archivoId);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAdjunto = async () => {
    if (!isAdmin || !adjuntoToDelete) return;

    setErrorAdjuntos("");

    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/items/${item.id}/adjuntos/${adjuntoToDelete}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al eliminar adjunto");
      }

      setAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoToDelete));
      setConfirmDeleteOpen(false);
      setAdjuntoToDelete(null);
    } catch (e) {
      setErrorAdjuntos(e.message || "Error inesperado al eliminar");
      setConfirmDeleteOpen(false);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAdjuntoToDelete(null);
  };

  return (
    <>
      <Modal
        open={open}
        title={`Detalles del renglón #${item.linea}`}
        subtitle={item.codigo}
        onClose={onClose}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
            {isAdmin && (
              <button
                onClick={() => setUploadOpen(true)}
                className="flex-1 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
              >
                Adjuntar archivos
              </button>
            )}

            {isUser && (
              <button
                onClick={handleAprobarCotizacion}
                disabled={approvingQuote}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
              >
                {approvingQuote ? "Aprobando..." : "Aprobar cotización"}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setConfirmSaveOpen(true)}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border whitespace-nowrap ${
              activeTab === "general"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("archivos")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border whitespace-nowrap ${
              activeTab === "archivos"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            Archivos
          </button>
          <button
            onClick={() => setActiveTab("observaciones")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border whitespace-nowrap ${
              activeTab === "observaciones"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            Observaciones
          </button>
        </div>

{activeTab === "general" && (
  <div className="space-y-3">
    {/* Header compacto con info clave */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-[10px] text-gray-500 mb-0.5">Línea</p>
        <p className="text-sm font-bold text-gray-800">{item.linea}</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-[10px] text-gray-500 mb-0.5">Código</p>
        <p className="text-xs font-semibold text-gray-800 font-mono truncate">{item.codigo}</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-[10px] text-gray-500 mb-0.5">Tipo</p>
        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${tipo.bg} ${tipo.text}`}>
          {item.tipo || "-"}
        </span>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-[10px] text-gray-500 mb-0.5">Cantidad</p>
        <p className="text-sm font-bold text-gray-800">{item.cantidadTotal}</p>
      </div>
    </div>

    {/* Estado y Descripción en grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Estado */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-[10px] font-semibold text-gray-600 mb-1.5">Estado actual</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {item.estado?.nombre || item.estado}
        </span>
      </div>

      {/* Descripción */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-[10px] font-semibold text-gray-600 mb-1.5">Descripción</p>
        <p className="text-xs text-gray-700 line-clamp-2">{item.descripcion}</p>
      </div>
    </div>

    {/* Cambiar estado (solo admin) */}
    {isAdmin && (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-[10px] font-semibold text-blue-700 mb-1.5">Cambiar estado</p>
        {loadingEstados ? (
          <div className="flex items-center gap-2">
            <InlineSpinner size="sm" />
            <p className="text-[10px] text-gray-500">Cargando estados...</p>
          </div>
        ) : (
          <select
            value={selectedEstadoId || ""}
            onChange={(e) => setSelectedEstadoId(Number(e.target.value))}
            className="w-full rounded-lg border border-blue-300 px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Selecciona estado --</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
    )}

    {/* Error */}
    {errorSave && (
      <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
        <p className="text-[10px] text-red-700">{errorSave}</p>
      </div>
    )}
  </div>
)}

        {activeTab === "archivos" && (
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700">
            {loadingAdjuntos ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <InlineSpinner size="md" />
                <p className="text-xs text-gray-500">Cargando adjuntos...</p>
              </div>
            ) : errorAdjuntos ? (
              <p className="text-xs text-red-600">{errorAdjuntos}</p>
            ) : adjuntos.length === 0 ? (
              <p className="text-xs text-gray-500">No hay archivos adjuntos.</p>
            ) : (
              <ul className="space-y-2">
                {adjuntos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.nombre}</p>
                      {a.descripcion && <p className="text-[11px] text-gray-500 truncate">{a.descripcion}</p>}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => download(a.id)}
                        className="rounded-lg bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100"
                      >
                        Ver
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => requestDeleteAdjunto(a.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "observaciones" && (
          <div className="flex flex-col h-96">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto rounded-t-xl bg-gray-50 p-4 space-y-3">
              {loadingObservaciones ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <InlineSpinner size="md" />
                  <p className="text-xs text-gray-500 text-center">Cargando observaciones...</p>
                </div>
              ) : observaciones.length === 0 ? (
                <p className="text-xs text-gray-500 text-center">No hay observaciones. Inicia la conversación.</p>
              ) : (
                observaciones.map((obs) => {
const myId = String(currentUserId ?? "");
const isOwnMessage =
  String(obs.idUsuario ?? "") === myId || String(obs.usuario?.id ?? "") === myId;

                  
                  return (
                    <div
                      key={obs.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? "bg-orange-500 text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <p className={`text-[10px] font-semibold mb-1 ${isOwnMessage ? "text-orange-100" : "text-gray-600"}`}>
                          {obs.usuario?.nombre || obs.usuario?.email || "Sistema"}
                        </p>
                        <p className="text-sm break-words">{obs.observacion}</p>
                        <p className={`text-[9px] mt-1 ${isOwnMessage ? "text-orange-200" : "text-gray-400"}`}>
                          {new Date(obs.fechaCreacion).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input de chat */}
            <form onSubmit={handleSendObservacion} className="border-t border-gray-200 bg-white rounded-b-xl p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaObservacion}
                  onChange={(e) => setNuevaObservacion(e.target.value)}
                  placeholder="Escribe una observación..."
                  disabled={sendingObservacion}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!nuevaObservacion.trim() || sendingObservacion}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                >
                  {sendingObservacion ? "..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal de subida (solo admin) */}
      {isAdmin && (
        <UploadAdjuntosModal
          open={uploadOpen}
          loading={uploading}
          onClose={() => setUploadOpen(false)}
          onUpload={uploadAdjuntos}
        />
      )}

      {/* Modal confirmación guardar */}
      <ConfirmModal
        open={confirmSaveOpen}
        tone="warning"
        title="Guardar cambios de estado"
        description="¿Estás seguro de que deseas actualizar el estado de este ítem?"
        confirmText="Guardar"
        cancelText="Cancelar"
        loading={saving}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={handleGuardar}
      />

      {/* Modal confirmación eliminar adjunto */}
      <ConfirmModal
        open={confirmDeleteOpen}
        tone="danger"
        title="Eliminar archivo adjunto"
        description="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este archivo?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={cancelDelete}
        onConfirm={confirmDeleteAdjunto}
      />
    </>
  );
};
