// ItemDetailsModal.jsx (CON CHAT de observaciones)
import { useEffect, useState, useRef } from "react";
import { getStatusCfg, getTipoCfg } from "../utils/solicitudesUi";
import { UploadAdjuntosModal } from "./UploadAdjuntosModal";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";
import { InlineSpinner } from "./LoadingSpinner";
import { API_URL } from "../services";

export const ItemDetailsModal = ({
  open,
  item,
  activeTab,
  setActiveTab,
  onClose,
  onItemUpdated,
}) => {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loadingAdjuntos, setLoadingAdjuntos] = useState(false);
  const [errorAdjuntos, setErrorAdjuntos] = useState("");

  const [estados, setEstados] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(false);

  const [observaciones, setObservaciones] = useState([]);
  const [loadingObservaciones, setLoadingObservaciones] = useState(false);

  const [selectedEstadoId, setSelectedEstadoId] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [sendingObservacion, setSendingObservacion] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorSave, setErrorSave] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [approvingQuote, setApprovingQuote] = useState(false);
  const [cancellingQuote, setCancellingQuote] = useState(false);

  // Estados para modales de confirmación
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [adjuntoToDelete, setAdjuntoToDelete] = useState(null);

  // Ref para scroll automático del chat
  const chatEndRef = useRef(null);

  // Detectar rol y usuario actual
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    const role = localStorage.getItem("userRol");
    const userName = localStorage.getItem("userCorreo");

    setCurrentUserId(uid);
    setUserRole(role);
    setCurrentUserName(userName);
  }, []);

  const roleNormalized = (userRole || "").trim().toLowerCase();
  const isAdmin = roleNormalized === "administrador";
  const isUser = roleNormalized === "procura" || roleNormalized === "usuario";

  // Detectar estados del ítem para lógica de flujo secuencial
  const itemEstadoNombre = item?.estado?.nombre || item?.estado || "";
  const isApproved = itemEstadoNombre.toLowerCase() === "aprobado";
  const isEnRevision = itemEstadoNombre.toLowerCase() === "en revisión";
  const isCancelado = itemEstadoNombre.toLowerCase() === "cancelado";
  const isEnCompra = itemEstadoNombre.toLowerCase() === "en compra";
  const isRecibido = itemEstadoNombre.toLowerCase() === "recibido";

  // El usuario solo puede aprobar/cancelar cuando está en "En Revisión"
  const canUserAct = isUser && isEnRevision;
  // Una vez aprobado, no puede cancelar
  const cannotCancel = isApproved || isEnCompra || isRecibido || isCancelado;

  // Secuencia de estados válida
  const ESTADO_SEQUENCE = ["Pendiente", "En Revisión", "Aprobado", "En Compra", "Recibido"];

  // Obtener siguiente estado válido para admin
  const getNextValidStates = (currentEstado) => {
    const currentIndex = ESTADO_SEQUENCE.findIndex(
      (e) => e.toLowerCase() === (currentEstado || "").toLowerCase()
    );

    // Si el item está aprobado, admin puede pasar a "En Compra"
    if (currentEstado?.toLowerCase() === "aprobado") {
      return estados.filter((e) => e.nombre?.toLowerCase() === "en compra");
    }

    // Si está en compra, puede pasar a "Recibido"
    if (currentEstado?.toLowerCase() === "en compra") {
      return estados.filter((e) => e.nombre?.toLowerCase() === "recibido");
    }

    // Si está pendiente, solo puede pasar a "En Revisión"
    if (currentEstado?.toLowerCase() === "pendiente") {
      return estados.filter((e) => e.nombre?.toLowerCase() === "en revisión");
    }

    // En Revisión: no puede cambiar (espera al usuario)
    if (currentEstado?.toLowerCase() === "en revisión") {
      return [];
    }

    // Estado final o cancelado: no hay siguiente
    return [];
  };

  const validNextStates = getNextValidStates(itemEstadoNombre);

  // Scroll automático al final del chat
  useEffect(() => {
    if (activeTab === "observaciones" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [observaciones, activeTab]);

  // Cargar estados (solo admin)
  useEffect(() => {
    if (!open || !isAdmin) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingEstados(true);
        const uid = localStorage.getItem("userId");
        const role = localStorage.getItem("userRol");
        const res = await fetch(`${API_URL}/estados`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Error cargando estados");

        const data = await res.json();
        setEstados(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoadingEstados(false);
      }
    })();

    return () => controller.abort();
  }, [open, isAdmin]);

  useEffect(() => {
    if (!item) return;
    const estadoId = item.estado?.id ?? null;
    setSelectedEstadoId(estadoId);
  }, [item]);

  // Cargar adjuntos
  useEffect(() => {
    if (!open || !item?.id || activeTab !== "archivos") {
      setAdjuntos([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingAdjuntos(true);
        setErrorAdjuntos("");

        const uid = localStorage.getItem("userId");
        const role = localStorage.getItem("userRol");
        const res = await fetch(`${API_URL}/items/${item.id}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Error cargando adjuntos");
        }

        const data = await res.json();
        const lista = Array.isArray(data?.archivos) ? data.archivos : Array.isArray(data) ? data : [];
        setAdjuntos(lista);
      } catch (e) {
        if (e.name !== "AbortError") setErrorAdjuntos(e.message || "Error inesperado");
      } finally {
        setLoadingAdjuntos(false);
      }
    })();

    return () => controller.abort();
  }, [open, item?.id, activeTab]);

  // Cargar observaciones (chat)
  useEffect(() => {
    if (!open || !item?.id || activeTab !== "observaciones") {
      setObservaciones([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingObservaciones(true);

        const uid = localStorage.getItem("userId");
        const role = localStorage.getItem("userRol");

        // ✅ TU ENDPOINT REAL: GET /observaciones/:itemId
        const res = await fetch(`${API_URL}/observaciones/${item.id}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Error cargando observaciones");

        const data = await res.json().catch(() => ({}));
        const lista = Array.isArray(data?.observaciones) ? data.observaciones : [];

        // ✅ Asegura orden viejo -> nuevo (sin depender del orderBy del backend)
        const ordered = [...lista].sort(
          (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
        );

        setObservaciones(ordered);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoadingObservaciones(false);
      }
    })();

    return () => controller.abort();
  }, [open, item?.id, activeTab]);

  if (!open || !item) return null;

  const status = getStatusCfg(item.estado?.nombre || item.estado);
  const tipo = getTipoCfg(item.tipo);

  // Guardar cambios (solo admin - solo estado)
  const handleGuardar = async () => {
    if (!isAdmin) return;

    setSaving(true);
    setErrorSave("");

    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");

      if (selectedEstadoId && selectedEstadoId !== item.estado?.id) {
        const resEstado = await fetch(`${API_URL}/estados/${item.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
          body: JSON.stringify({ idEstado: selectedEstadoId }),
        });

        if (!resEstado.ok) {
          const err = await resEstado.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Error al actualizar estado");
        }
      }

      setConfirmSaveOpen(false);
      onItemUpdated?.();
      onClose();
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
      setConfirmSaveOpen(false);
    } finally {
      setSaving(false);
    }
  };
  // Enviar observación (ambos roles)
  const handleSendObservacion = async (e) => {
    e?.preventDefault();

    const texto = nuevaObservacion.trim();
    if (!texto || !item?.id) return;

    setSendingObservacion(true);
    setErrorSave("");

    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");

      const res = await fetch(`${API_URL}/observaciones/${item.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
        body: JSON.stringify({ observacion: texto }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al enviar observación");
      }

      // Caso A: el backend devuelve la observación creada (recomendado)
      const maybeObs = await res.json().catch(() => null);

      if (maybeObs && maybeObs.id) {
        setObservaciones((prev) => [...prev, maybeObs]);
      } else {
        // Caso B: el backend devuelve solo {ok:true} o similar -> recargar lista
        const res2 = await fetch(`${API_URL}/observaciones/${item.id}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
        });

        const data2 = await res2.json().catch(() => ({}));
        const lista2 = Array.isArray(data2?.observaciones) ? data2.observaciones : [];

        const ordered2 = [...lista2].sort(
          (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
        );

        setObservaciones(ordered2);

      }

      setNuevaObservacion("");
    } catch (err) {
      setErrorSave(err.message || "Error inesperado");
    } finally {
      setSendingObservacion(false);
    }
  };

  const handleAprobarCotizacion = async () => {
    if (!isUser) return;

    setApprovingQuote(true);
    setErrorSave("");

    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");

      const res = await fetch(`${API_URL}/estados/${item.id}/aprobar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al aprobar cotización");
      }

      // Actualizar el estado local del item para reflejar el cambio inmediatamente
      // Llamar al callback para que el componente padre actualice sus datos
      onItemUpdated?.();

      // Cerrar el modal después de una pequeña pausa para que el usuario vea el éxito
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setApprovingQuote(false);
    }
  };

  // Cancelar solicitud (solo usuario, solo en "En Revisión")
  const handleCancelarSolicitud = async () => {
    if (!isUser || !isEnRevision) return;

    setCancellingQuote(true);
    setErrorSave("");

    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");

      const res = await fetch(`${API_URL}/estados/${item.id}/cancelar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al cancelar solicitud");
      }

      onItemUpdated?.();

      setTimeout(() => {
        onClose();
      }, 300);
    } catch (e) {
      setErrorSave(e.message || "Error inesperado");
    } finally {
      setCancellingQuote(false);
    }
  };

  const uploadAdjuntos = async ({ files, descripcion }) => {
    if (!isAdmin) return;
    if (!item?.id) return;

    setUploading(true);
    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");
      const fd = new FormData();

      files.forEach((f) => fd.append("archivo", f));
      fd.append("descripcion", descripcion || "");
      fd.append("itemId", String(item.id));

      const res = await fetch(`${API_URL}/items/${item.id}/adjuntar`, {
        method: "POST",
        headers: {
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error subiendo adjuntos");
      }

      setUploadOpen(false);

      // Recargar adjuntos
      if (activeTab === "archivos") {
        const uid = localStorage.getItem("userId");
        const role = localStorage.getItem("userRol");
        const res2 = await fetch(`${API_URL}/items/${item.id}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid || "",
            "x-user-role": role || "Usuario",
          },
        });
        if (res2.ok) {
          const data = await res2.json();
          setAdjuntos(Array.isArray(data?.archivos) ? data.archivos : []);
        }
      }
    } catch (e) {
      setErrorAdjuntos(e.message || "Error subiendo adjuntos");
    } finally {
      setUploading(false);
    }
  };

  const download = async (archivoId) => {
    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");
      const url = `${API_URL}/items/${item.id}/${archivoId}`;

      const res = await fetch(url, {
        headers: {
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
      });
      if (!res.ok) throw new Error("No se pudo descargar");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `adjunto-${archivoId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setErrorAdjuntos(e.message || "Error al descargar");
    }
  };

  const requestDeleteAdjunto = (archivoId) => {
    setAdjuntoToDelete(archivoId);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAdjunto = async () => {
    if (!isAdmin || !adjuntoToDelete) return;

    setErrorAdjuntos("");

    try {
      const uid = localStorage.getItem("userId");
      const role = localStorage.getItem("userRol");
      const url = `${API_URL}/items/${item.id}/adjuntos/${adjuntoToDelete}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "x-user-id": uid || "",
          "x-user-role": role || "Usuario",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Error al eliminar adjunto");
      }

      setAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoToDelete));
      setConfirmDeleteOpen(false);
      setAdjuntoToDelete(null);
    } catch (e) {
      setErrorAdjuntos(e.message || "Error inesperado al eliminar");
      setConfirmDeleteOpen(false);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAdjuntoToDelete(null);
  };

  return (
    <>
      <Modal
        open={open}
        title={`Detalles del renglón #${item.linea}`}
        subtitle={item.codigo}
        onClose={onClose}
        footer={
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Botones de acción - stack en móvil, row en desktop */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cerrar
              </button>

              {/* Botón adjuntar archivos (admin) */}
              {isAdmin && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="hidden xs:inline">Adjuntar</span>
                  <span className="xs:hidden">Adjuntar</span>
                </button>
              )}

              {/* Botones usuario: Aprobar/Cancelar solo en "En Revisión" */}
              {isUser && (
                <>
                  {/* Mensaje cuando ya está aprobado */}
                  {isApproved && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-semibold text-green-700">Aprobado</span>
                    </div>
                  )}

                  {/* Mensaje cuando está cancelado */}
                  {isCancelado && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-semibold text-red-700">Cancelado</span>
                    </div>
                  )}

                  {/* Mensaje cuando está en proceso (En Compra/Recibido) */}
                  {(isEnCompra || isRecibido) && (
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-blue-700">{itemEstadoNombre}</span>
                    </div>
                  )}

                  {/* Mensaje cuando está pendiente (esperando revisión del admin) */}
                  {itemEstadoNombre.toLowerCase() === "pendiente" && (
                    <div className="flex items-center gap-2 rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-yellow-700">Esperando revisión</span>
                    </div>
                  )}

                  {/* Botones Aprobar/Cancelar solo en "En Revisión" */}
                  {canUserAct && (
                    <>
                      {/* Botón Cancelar */}
                      <button
                        onClick={handleCancelarSolicitud}
                        disabled={cancellingQuote}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {cancellingQuote ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="hidden sm:inline">Cancelar solicitud</span>
                            <span className="sm:hidden">Cancelar</span>
                          </>
                        )}
                      </button>

                      {/* Botón Aprobar */}
                      <button
                        onClick={handleAprobarCotizacion}
                        disabled={approvingQuote}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {approvingQuote ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="hidden sm:inline">Aprobar cotización</span>
                            <span className="sm:hidden">Aprobar</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Botón guardar cambios (admin) */}
              {isAdmin && (
                <button
                  onClick={() => setConfirmSaveOpen(true)}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">Guardar cambios</span>
                      <span className="sm:hidden">Guardar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Tabs con iconos y diseño mejorado */}
        <div className="mb-4 sm:mb-5 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === "general"
              ? "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            General
          </button>
          <button
            onClick={() => setActiveTab("archivos")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === "archivos"
              ? "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Archivos
          </button>
          <button
            onClick={() => setActiveTab("observaciones")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === "observaciones"
              ? "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden xs:inline">Observaciones</span>
            <span className="xs:hidden">Chat</span>
          </button>
        </div>

        {activeTab === "general" && (
          <div className="space-y-3 sm:space-y-4">
            {/* Header compacto con info clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-3.5 border border-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-blue-100">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-500">Línea</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{item.linea}</p>
              </div>

              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-3.5 border border-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-purple-100">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-500">Código</p>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 font-mono truncate">{item.codigo}</p>
              </div>

              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-3.5 border border-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-orange-100">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-500">Tipo</p>
                </div>
                <span className={`inline-block rounded-md sm:rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${tipo.bg} ${tipo.text}`}>
                  {item.tipo || "-"}
                </span>
              </div>

              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-3.5 border border-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-green-100">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-500">Cantidad</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{item.cantidadTotal}</p>
              </div>
            </div>

            {/* Estado y Descripción en grid simétrico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {/* Estado */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gray-200">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-600">Estado actual</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold ${status.bg} ${status.text}`}
                >
                  <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${status.dot}`} />
                  {item.estado?.nombre || item.estado}
                </span>
              </div>

              {/* Descripción */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gray-200">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-600">Descripción</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed line-clamp-3">{item.descripcion || "Sin descripción"}</p>
              </div>
            </div>

            {/* Cambiar estado (solo admin) */}
            {isAdmin && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-blue-700">Cambiar estado</p>
                </div>
                {loadingEstados ? (
                  <div className="flex items-center gap-2">
                    <InlineSpinner size="sm" />
                    <p className="text-xs text-gray-500">Cargando estados...</p>
                  </div>
                ) : validNextStates.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-gray-600">
                      {isEnRevision
                        ? "Esperando que el usuario apruebe o cancele"
                        : isRecibido || isCancelado
                          ? "Estado final alcanzado"
                          : "No hay transiciones disponibles"}
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedEstadoId || ""}
                    onChange={(e) => setSelectedEstadoId(Number(e.target.value))}
                    className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">-- Selecciona estado --</option>
                    {validNextStates.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Error */}
            {errorSave && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-700">{errorSave}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "archivos" && (
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700">
            {loadingAdjuntos ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <InlineSpinner size="md" />
                <p className="text-xs text-gray-500">Cargando adjuntos...</p>
              </div>
            ) : errorAdjuntos ? (
              <p className="text-xs text-red-600">{errorAdjuntos}</p>
            ) : adjuntos.length === 0 ? (
              <p className="text-xs text-gray-500">No hay archivos adjuntos.</p>
            ) : (
              <ul className="space-y-2">
                {adjuntos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.nombre}</p>
                      {a.descripcion && <p className="text-[11px] text-gray-500 truncate">{a.descripcion}</p>}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => download(a.id)}
                        className="rounded-lg bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100"
                      >
                        Ver
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => requestDeleteAdjunto(a.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "observaciones" && (
          <div className="flex flex-col h-64 sm:h-80 md:h-96">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto rounded-t-lg sm:rounded-t-xl bg-gray-50 p-3 sm:p-4 space-y-2 sm:space-y-3">
              {loadingObservaciones ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                  <InlineSpinner size="md" />
                  <p className="text-xs text-gray-500 text-center">Cargando observaciones...</p>
                </div>
              ) : observaciones.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6 sm:py-8">No hay observaciones. Inicia la conversación.</p>
              ) : (
                observaciones.map((obs) => {
                  const myId = String(currentUserId ?? "");
                  const isOwnMessage =
                    String(obs.idUsuario ?? "") === myId || String(obs.usuario?.id ?? "") === myId;


                  return (
                    <div
                      key={obs.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 ${isOwnMessage
                          ? "bg-orange-500 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                          }`}
                      >
                        <p className={`text-[9px] sm:text-[10px] font-semibold mb-0.5 sm:mb-1 ${isOwnMessage ? "text-orange-100" : "text-gray-600"}`}>
                          {obs.usuario?.nombre || obs.usuario?.email || "Sistema"}
                        </p>
                        <p className="text-xs sm:text-sm break-words">{obs.observacion}</p>
                        <p className={`text-[8px] sm:text-[9px] mt-0.5 sm:mt-1 ${isOwnMessage ? "text-orange-200" : "text-gray-400"}`}>
                          {new Date(obs.fechaCreacion).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input de chat */}
            <form onSubmit={handleSendObservacion} className="border-t border-gray-200 bg-white rounded-b-lg sm:rounded-b-xl p-2 sm:p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaObservacion}
                  onChange={(e) => setNuevaObservacion(e.target.value)}
                  placeholder="Escribe una observación..."
                  disabled={sendingObservacion}
                  className="flex-1 rounded-lg border border-gray-300 px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!nuevaObservacion.trim() || sendingObservacion}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 flex-shrink-0"
                >
                  {sendingObservacion ? "..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal de subida (solo admin) */}
      {isAdmin && (
        <UploadAdjuntosModal
          open={uploadOpen}
          loading={uploading}
          onClose={() => setUploadOpen(false)}
          onUpload={uploadAdjuntos}
        />
      )}

      {/* Modal confirmación guardar */}
      <ConfirmModal
        open={confirmSaveOpen}
        tone="warning"
        title="Guardar cambios de estado"
        description="¿Estás seguro de que deseas actualizar el estado de este ítem?"
        confirmText="Guardar"
        cancelText="Cancelar"
        loading={saving}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={handleGuardar}
      />

      {/* Modal confirmación eliminar adjunto */}
      <ConfirmModal
        open={confirmDeleteOpen}
        tone="danger"
        title="Eliminar archivo adjunto"
        description="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este archivo?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={cancelDelete}
        onConfirm={confirmDeleteAdjunto}
      />
    </>
  );
};
