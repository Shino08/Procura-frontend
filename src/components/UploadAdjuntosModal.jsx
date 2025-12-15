import { useMemo, useState } from "react";
import { BaseModal } from "./BaseModal";

export const UploadAdjuntosModal = ({
  open,
  onClose,
  onUpload,        // async ({ files, descripcion }) => void
  loading = false,
  accept = ".pdf,.png,.jpg,.jpeg,.xlsx,.doc,.docx",
}) => {
  const [files, setFiles] = useState([]);
  const [descripcion, setDescripcion] = useState("");

  const total = useMemo(() => files.length, [files]);

  const reset = () => {
    setFiles([]);
    setDescripcion("");
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose?.();
    }
  };

  const handleUpload = async () => {
    await onUpload?.({ files, descripcion });
    reset();
  };

  return (
    <BaseModal
      open={open}
      tone="default"
      title="Adjuntar archivos"
      description="Selecciona uno o varios archivos para anexarlos a esta solicitud/archivo."
      onClose={handleClose}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || files.length === 0}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
          >
            {loading ? "Subiendo..." : `Subir (${total})`}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: Cotización proveedor, especificación técnica..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Archivos</label>
          <input
            type="file"
            multiple
            accept={accept}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Formatos permitidos: {accept}
          </p>
        </div>

        {files.length ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Seleccionados</p>
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name} className="text-xs text-gray-700 truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
};
