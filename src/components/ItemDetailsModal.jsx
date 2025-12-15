// ItemDetailsModal.jsx (admin con edición de estado + observación)
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
  onItemUpdated, // callback cuando se guarda (opcional)
}) => {
  // Hooks siempre arriba
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

  // Cargar lista de estados (solo 1 vez cuando se abre el modal)
  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  // Sincronizar estado/observación cuando cambia el item
  useEffect(() => {
    if (!item) return;

    // buscar idEstado desde item.estado (puede venir como { id, nombre } o solo nombre)
    const estadoId = item.estado?.id ?? null;
    setSelectedEstadoId(estadoId);
    setObservacion(item.observacion || "");
  }, [item]);

  // Cargar adjuntos cuando se cambia a tab "archivos"
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

  // Early return después de hooks
  if (!open || !item) return null;

  const status = getStatusCfg(item.estado?.nombre || item.estado);
  const tipo = getTipoCfg(item.tipo);

  const handleGuardar = async () => {
    setSaving(true);
    setErrorSave("");

    try {
      const token = localStorage.getItem("token");

      // 1) Actualizar estado (si cambió)
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

      // 2) Crear observación (si hay texto nuevo)
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

      onItemUpdated?.(); // notifica al padre para refrescar
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

const uploadAdjuntos = async ({ files, descripcion }) => {
  if (!item?.id) return;

  setUploading(true);
  try {
    const token = localStorage.getItem("token");
    const fd = new FormData();

    files.forEach((f) => fd.append("archivo", f)); // multer: upload.array("files")
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

    // refrescar lista si estás en tab archivos
    if (activeTab === "archivos") {
      // truco rápido: fuerza recarga de adjuntos volviendo a setActiveTab
      // (mejor: extraer fetchAdjuntos a función y llamarla aquí)
      setActiveTab("archivos");
    }
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
  const href = URL.createObjectURL(blob);
  window.open(href, "_blank");
};

  return (
    <Modal
      open={open}
      title={`Detalles del renglón #${item.linea}`}
      subtitle={item.codigo}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex-1 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
          >
            Adjuntar archivos
          </button> 
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      }
    >

      <UploadAdjuntosModal
        open={uploadOpen}
        loading={uploading}
        onClose={() => setUploadOpen(false)}
        onUpload={uploadAdjuntos}
      />
      
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
          {/* Info básica */}
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
                  {item.tipo}
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
            <p className="mt-1 text-xl font-bold text-gray-800">
              {item.cantidad} {item.unidad}
            </p>
          </div>

          {/* Edición de estado */}
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

          {/* Edición de observación */}
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

          {errorSave ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{errorSave}</p>
            </div>
          ) : null}
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
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{a.nombre}</p>
                    {a.descripcion ? <p className="text-[11px] text-gray-500 truncate">{a.descripcion}</p> : null}
                  </div>

                <button
                  onClick={() => download(a.id)}
                  className="shrink-0 rounded-lg bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100"
                >
                  Ver
                </button>
                </li>
              ))}
            </ul>
            
          )}
        </div>
        
      )}
    </Modal>
    
  );
};
