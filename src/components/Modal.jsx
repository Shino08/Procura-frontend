import { useEffect } from "react";

export const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl modal-content-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold truncate">{title}</p>
              {subtitle ? <p className="text-sm text-orange-100 truncate">{subtitle}</p> : null}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/15 transition-colors duration-200"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">{children}</div>

        {/* Footer */}
        {footer ? <div className="border-t border-gray-200 bg-gray-50 p-4">{footer}</div> : null}
      </div>
    </div>
  );
};
