import { getStatusCfg, getTipoCfg } from "../../utils/solicitudesUi";
import { Modal } from "../ui/Modal";

export const ItemDetailsModal = ({
  open,
  item,
  activeTab,
  setActiveTab,
  onClose,
  onApproveClick,
  approvingDisabled,
}) => {
  if (!item) return null;

  const status = getStatusCfg(item.estado);
  const tipo = getTipoCfg(item.tipo);

  return (
    <Modal
      open={open}
      title={`Detalles del renglón #${item.linea}`}
      subtitle={item.codigo}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            onClick={onApproveClick}
            disabled={approvingDisabled}
            className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Aprobar cotización
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      }
    >
      {/* Tabs (responsive) */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            activeTab === "general" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("archivos")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            activeTab === "archivos" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-700"
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
                  {item.tipo}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
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
        <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
          Adjuntos: (conecta aquí tu data real de archivos del renglón).
        </div>
      )}
    </Modal>
  );
};
