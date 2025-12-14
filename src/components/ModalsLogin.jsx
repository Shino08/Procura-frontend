export const ModalsLogin = ({ open, type = "error", title, message, onClose }) => {
  if (!open) return null;

  const isError = type === "error";

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog" 
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold ${isError ? "text-red-700" : "text-emerald-700"}`}>
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <button
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-4 py-3 font-semibold text-white ${
            isError ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
