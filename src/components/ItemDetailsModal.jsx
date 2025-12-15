import { useState, useEffect } from "react";
import { getStatusCfg, getTipoCfg } from "../utils/solicitudesUi";
import { Modal } from "./Modal";
import { API_URL } from "../services";

export const ItemDetailsModal = ({
  open,
  item,
  activeTab,
  setActiveTab,
  onClose,
  onAdjuntarClick,
  onApproveClick,
  approvingDisabled,
}) => {

  const [adjuntos, setAdjuntos] = useState([]);
  const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);
  const [errorAdjuntos, setErrorAdjuntos] = useState("");

  // Fetch de adjuntos: solo cuando el modal está abierto, hay item y estás en tab "archivos"
  useEffect(() => {
    if (!open || !item?.id || activeTab !== "archivos") return;

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
const lista =
  Array.isArray(data?.archivos) ? data.archivos :
  Array.isArray(data?.adjuntos) ? data.adjuntos :
  Array.isArray(data) ? data :
  [];

setAdjuntos(lista);

      } catch (e) {
        if (e.name !== "AbortError") setErrorAdjuntos(e.message || "Error inesperado");
      } finally {
        setLoadingAdjuntos(false);
      }
    })();

    return () => controller.abort();
  }, [open, item?.id, activeTab]);

  // Render condition AL FINAL (después de hooks)
  if (!open || !item) return null;

  return (
    <Modal
      open={open}
      title={`Detalles del renglón #${item.linea}`}
      subtitle={item.codigo}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
          <button
            onClick={onAdjuntarClick}
            className="flex-1 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
          >
            Adjuntar archivos
          </button>
          <button
            onClick={onApproveClick}
            disabled={approvingDisabled}
            className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Aprobar cotización
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
                {/* <span className={`inline-block rounded px-3 py-1 text-xs font-semibold ${tipo.bg} ${tipo.text}`}>
                  {item.tipo}
                </span> */}
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
                >
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {item.estado}
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

          {item.observacion ? (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Observación</p>
              <p className="mt-2 text-sm text-gray-700">{item.observacion}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700 space-y-3">
          {loadingAdjuntos ? (
            <p className="text-xs text-gray-500">Cargando adjuntos...</p>
          ) : errorAdjuntos ? (
            <p className="text-xs text-red-600">{errorAdjuntos}</p>
          ) : adjuntos.length === 0 ? (
            <p className="text-xs text-gray-500">No hay archivos adjuntos para este renglón.</p>
          ) : (
            <ul className="space-y-2">
              {adjuntos.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{a.nombre}</p>
                    {a.tipoArchivo ? <p className="text-[11px] text-gray-500 truncate">{a.tipoArchivo}</p> : null}
                  </div>

                  <a
                    href={`${API_URL.replace(/\/api$/, "")}${a.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    Ver
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
};
