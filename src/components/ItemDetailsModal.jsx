// ItemDetailsModal.jsx (CORREGIDO: admin edita, usuario solo ve + aprueba)
import { useEffect, useState } from "react";
import { getStatusCfg, getTipoCfg } from "../utils/solicitudesUi";
import { UploadAdjuntosModal } from "./UploadAdjuntosModal";
import { Modal } from "./Modal";
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

  const [selectedEstadoId, setSelectedEstadoId] = useState(null);
  const [observacion, setObservacion] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorSave, setErrorSave] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [approvingQuote, setApprovingQuote] = useState(false);

  // Detectar rol (lee desde JWT para mayor seguridad)
  const [userRole, setUserRole] = useState(null);

  const [deletingAdjunto, setDeletingAdjunto] = useState(null); // id del adjunto en proceso de eliminación


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No hay token en localStorage");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const rol = payload.rol || payload.role || payload.nombreRol;
      setUserRole(rol);
    } catch (e) {
      console.error("❌ Error decodificando token:", e);
    }
  }, []);

  // Normaliza comparación (case-insensitive)
  const roleNormalized = (userRole || "").trim().toLowerCase();
  const isAdmin = roleNormalized === "administrador";
  const isUser = roleNormalized === "gerente";

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
    setObservacion(item.observacion || "");
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

  if (!open || !item) return null;

  const status = getStatusCfg(item.estado?.nombre || item.estado);
  const tipo = getTipoCfg(item.tipo);

  // Guardar cambios (solo admin)
  const handleGuardar = async () => {
    if (!isAdmin) return; // guard

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

      if (observacion.trim() && observacion.trim() !== item.observacion) {
        const resObs = await fetch(`${API_URL}/observaciones/${item.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ observacion: observacion.trim() }),
        });

        if (!resObs.ok) {
          const err = await resObs.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Error al guardar observación");
        }
      }

      onItemUpdated?.();
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  // Aprobar cotización (solo usuario)
  const handleAprobarCotizacion = async () => {
    if (!isUser) return; // guard

    setApprovingQuote(true);
    setErrorSave("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/items/${item.id}/aprobar-cotizacion`, {
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

      onItemUpdated?.();
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setApprovingQuote(false);
    }
  };

  const uploadAdjuntos = async ({ files, descripcion }) => {
    if (!isAdmin) return; // guard
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
      if (activeTab === "archivos") setActiveTab("archivos");
    } catch (e) {
      setErrorAdjuntos(e.message || "Error subiendo adjuntos");
    } finally {
      setUploading(false);
    }
  };

  const download = async (archivoId) => {
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
  };

  const deleteAdjunto = async (archivoId) => {
  if (!isAdmin) return; // guard
  if (!item?.id) return;

  const confirmar = window.confirm("¿Seguro que deseas eliminar este archivo adjunto?");
  if (!confirmar) return;

  setDeletingAdjunto(archivoId);
  setErrorAdjuntos("");

  try {
    const token = localStorage.getItem("token");
    const url = `${API_URL}/items/${item.id}/adjuntos/${archivoId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Error al eliminar adjunto");
    }

    // Actualiza la lista local sin recargar todo
    setAdjuntos((prev) => prev.filter((a) => a.id !== archivoId));
  } catch (e) {
    setErrorAdjuntos(e.message || "Error inesperado al eliminar");
  } finally {
    setDeletingAdjunto(null);
  }
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
                onClick={handleGuardar}
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
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
              activeTab === "general"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("archivos")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
              activeTab === "archivos"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            Archivos
          </button>
        </div>

        {activeTab === "general" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Línea</p>
                  <p className="text-sm font-semibold text-gray-800">{item.linea}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Código</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{item.codigo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <span className={`inline-block rounded px-3 py-1 text-xs font-semibold ${tipo.bg} ${tipo.text}`}>
                    {item.tipo || "-"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado actual</p>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    {item.estado?.nombre || item.estado}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Descripción</p>
              <p className="mt-2 text-sm text-gray-700">{item.descripcion}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Cantidad</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{item.cantidadTotal}</p>
            </div>

            {isAdmin && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">Cambiar estado</p>
                {loadingEstados ? (
                  <p className="text-xs text-gray-500">Cargando estados...</p>
                ) : (
                  <select
                    value={selectedEstadoId || ""}
                    onChange={(e) => setSelectedEstadoId(Number(e.target.value))}
                    className="w-full rounded-lg border border-blue-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {isAdmin && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">Observación</p>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Escribe una observación..."
                  rows={3}
                  className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            {isUser && (item.ultimaObservacion || item.observacion) ? (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Observación del administrador</p>
                <p className="text-sm text-gray-700">{item.ultimaObservacion || item.observacion}</p>
              </div>
            ) : null}

            {errorSave && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{errorSave}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700">
            {loadingAdjuntos ? (
              <p className="text-xs text-gray-500">Cargando adjuntos...</p>
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
            onClick={() => deleteAdjunto(a.id)}
            disabled={deletingAdjunto === a.id}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deletingAdjunto === a.id ? "..." : "Eliminar"}
          </button>
        )}
      </div>
    </li>
  ))}
</ul>

            )}
          </div>
        )}
      </Modal>

      {/* Modal de subida (solo admin) */}
      {isAdmin ? (
        <UploadAdjuntosModal
          open={uploadOpen}
          loading={uploading}
          onClose={() => setUploadOpen(false)}
          onUpload={uploadAdjuntos}
        />
      ) : null}
    </>
  );
};
