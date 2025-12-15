import { BaseModal } from "./BaseModal";

export const ConfirmModal = ({
  open,
  tone = "warning",
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <BaseModal
      open={open}
      tone={tone}
      title={title}
      description={description}
      onClose={loading ? undefined : onCancel}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-700">
        Verifica antes de continuar.
      </p>
    </BaseModal>
  );
};
