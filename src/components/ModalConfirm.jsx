import { Modal } from "./Modal";
import { getStatusCfg } from "../utils/solicitudesUi";

export const ModalConfirm = ({ open, item, step, onCancel, onConfirm }) => {
  if (!open || !item) return null;

  const status = getStatusCfg(item.estado);

  const title =
    step === "confirm" ? "Confirmar aprobación" : step === "processing" ? "Procesando..." : "Aprobación exitosa";

  return (
    <Modal
      open={open}
      title={title}
      subtitle={step === "confirm" ? `Renglón #${item.linea}` : ""}
      onClose={step === "confirm" ? onCancel : undefined}
      footer={
        step === "confirm" ? (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Confirmar
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600">
            {step === "processing" ? "Por favor espere..." : "Listo."}
          </div>
        )
      }
    >
      {step === "confirm" ? (
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            Esta acción marcará el renglón como <span className="font-semibold">Aprobado</span>.
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Código</span>
              <span className="font-mono font-semibold">{item.codigo}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Cantidad</span>
              <span className="font-semibold">
                {item.cantidad} {item.unidad}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Estado actual</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                {item.estado}
              </span>
            </div>
          </div>
        </div>
      ) : step === "processing" ? (
        <div className="grid place-items-center py-10">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
        </div>
      ) : (
        <div className="grid place-items-center py-10 text-sm text-gray-700">
          El renglón fue marcado como aprobado.
        </div>
      )}
    </Modal>
  );
};
