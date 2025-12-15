import { BaseModal } from "./BaseModal";

export const ResultModal = ({ open, tone = "success", title, description, buttonText = "Cerrar", onClose }) => {
  return (
    <BaseModal
      open={open}
      tone={tone}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className={`w-full rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold text-white ${
            tone === "success"
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          }`}
        >
          {buttonText}
        </button>
      }
    >
      <div
        className={`rounded-xl p-4 ${
          tone === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}
      >
        <p className="text-sm">{description}</p>
      </div>
    </BaseModal>
  );
};
