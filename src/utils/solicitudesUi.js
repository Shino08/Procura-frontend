export const ITEMS_PER_PAGE = 25;

export const STATUS_CONFIG = {
  Pendiente: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "En Revisión": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "En Proceso": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  Aprobado: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  Rechazado: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export const TIPO_CONFIG = {
  Productos: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Servicios: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Materiales: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Equipos: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

export const getStatusCfg = (estado) => STATUS_CONFIG[estado] || STATUS_CONFIG.Pendiente;
export const getTipoCfg = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.Productos;

export const formatArchivoId = (id) => `ARC-${String(id).padStart(4, "0")}`;

export const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
