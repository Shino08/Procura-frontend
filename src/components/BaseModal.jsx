import { useEffect } from "react";

export const BaseModal = ({ open, title, description, tone = "default", onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const toneBar =
    tone === "success"
      ? "from-green-500 to-green-600"
      : tone === "danger"
      ? "from-red-500 to-red-600"
      : tone === "warning"
      ? "from-yellow-500 to-yellow-600"
      : "from-gray-700 to-gray-800";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4 modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl modal-content-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${toneBar}`} />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">{title}</h3>
              {description ? <p className="mt-1 text-xs sm:text-sm text-gray-600">{description}</p> : null}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 max-h-[70vh] overflow-y-auto">{children}</div>
        </div>

        {footer ? <div className="border-t border-gray-200 bg-gray-50 p-4">{footer}</div> : null}
      </div>
    </div>
  );
};
