// src/components/NotificacionesPanel.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const NotificacionesPanel = ({ isOpen, onClose }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
    }
  }, [isOpen]);

  const cargarNotificaciones = async () => {
    setLoading(true);
    try {
      // TODO: Reemplazar con llamada real al backend
      // const response = await fetch('/api/notificaciones', {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      // const data = await response.json();
      
      // Datos de ejemplo
      const data = [
        {
          id: 1,
          tipo: 'estado_solicitud',
          titulo: 'Solicitud Aprobada',
          mensaje: 'Tu solicitud SOL-2025-001 ha sido aprobada completamente',
          solicitudId: 'SOL-2025-001',
          fecha: '2025-11-28T10:30:00',
          leida: false,
          icono: 'check',
          color: 'green'
        },
        {
          id: 2,
          tipo: 'estado_item',
          titulo: 'Ítem Rechazado',
          mensaje: 'El ítem #5 "Compresor de aire 25HP" de SOL-2025-002 fue rechazado: Presupuesto excedido',
          solicitudId: 'SOL-2025-002',
          itemLinea: 5,
          fecha: '2025-11-28T09:15:00',
          leida: false,
          icono: 'alert',
          color: 'red'
        },
        {
          id: 3,
          tipo: 'estado_solicitud',
          titulo: 'Solicitud En Proceso',
          mensaje: 'Tu solicitud SOL-2025-003 está siendo procesada',
          solicitudId: 'SOL-2025-003',
          fecha: '2025-11-27T16:45:00',
          leida: false,
          icono: 'clock',
          color: 'orange'
        },
        {
          id: 4,
          tipo: 'estado_item',
          titulo: 'Ítem Aprobado',
          mensaje: 'El ítem #12 "Válvula de bola 2 pulgadas" de SOL-2025-002 fue aprobado',
          solicitudId: 'SOL-2025-002',
          itemLinea: 12,
          fecha: '2025-11-27T14:20:00',
          leida: true,
          icono: 'check',
          color: 'green'
        },
        {
          id: 5,
          tipo: 'comentario',
          titulo: 'Nuevo Comentario',
          mensaje: 'El administrador agregó un comentario en SOL-2025-001: "Verificar especificaciones técnicas"',
          solicitudId: 'SOL-2025-001',
          fecha: '2025-11-27T11:00:00',
          leida: true,
          icono: 'message',
          color: 'blue'
        },
        {
          id: 6,
          tipo: 'estado_item',
          titulo: 'Ítems En Revisión',
          mensaje: '15 ítems de SOL-2025-003 están en revisión técnica',
          solicitudId: 'SOL-2025-003',
          fecha: '2025-11-26T18:30:00',
          leida: true,
          icono: 'document',
          color: 'blue'
        }
      ];

      setNotificaciones(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    try {
      // TODO: Llamada al backend
      // await fetch(`/api/notificaciones/${notificacionId}/leer`, {
      //   method: 'PUT',
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });

      setNotificaciones(prev =>
        prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      // TODO: Llamada al backend
      // await fetch('/api/notificaciones/leer-todas', {
      //   method: 'PUT',
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });

      setNotificaciones(prev =>
        prev.map(n => ({ ...n, leida: true }))
      );
    } catch (error) {
      console.error('Error al marcar todas:', error);
    }
  };

  const eliminarNotificacion = async (notificacionId) => {
    try {
      // TODO: Llamada al backend
      // await fetch(`/api/notificaciones/${notificacionId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });

      setNotificaciones(prev =>
        prev.filter(n => n.id !== notificacionId)
      );
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora - fechaNotif;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    
    return fechaNotif.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const getIcono = (tipo) => {
    const iconos = {
      check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
      alert: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      message: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    };
    return iconos[tipo] || iconos.document;
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Notificaciones</h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {notificacionesNoLeidas > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <p className="text-xs sm:text-sm text-white/90 animate-pulse-once">
                {notificacionesNoLeidas} sin leer
              </p>
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-white/90 hover:text-white underline transition-all duration-200 hover:scale-105 text-left sm:text-right"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 sm:h-48 animate-fade-in">
              <div className="relative">
                <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="absolute inset-0 rounded-full bg-orange-600/20 animate-ping"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 animate-slide-up">Cargando notificaciones...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4 animate-fade-in">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 animate-slide-up">No tienes notificaciones</p>
              <p className="text-xs text-gray-500 mt-1 animate-slide-up animation-delay-200">Te avisaremos cuando haya novedades</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notificaciones.map((notif, index) => (
                <div
                  key={notif.id}
                  className={`group p-3 sm:p-4 hover:bg-gray-50 transition-all duration-300 ${!notif.leida ? 'bg-orange-50/40 border-l-4 border-orange-400 animate-slide-in-left' : ''} hover:shadow-sm`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-3">
                    {/* Icono */}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-${notif.color}-100 group-hover:scale-110 transition-transform duration-200 ${!notif.leida ? 'ring-2 ring-offset-2 ring-orange-400 animate-pulse-once' : ''}`}>
                      <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-${notif.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {getIcono(notif.icono)}
                      </svg>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {notif.titulo}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.leida && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          )}
                          <button
                            onClick={() => eliminarNotificacion(notif.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all duration-200 hover:scale-110"
                            title="Eliminar"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {notif.mensaje}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatearFecha(notif.fecha)}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-2">
                          {notif.solicitudId && (
                            <Link
                              // to={`/solicitudes/${notif.solicitudId}`}
                              // onClick={() => {
                              //   marcarComoLeida(notif.id);
                              //   onClose();
                              // }}
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-all duration-200 hover:scale-105 whitespace-nowrap"
                            >
                              Ver →
                            </Link>
                          )}

                          {!notif.leida && (
                            <button
                              onClick={() => marcarComoLeida(notif.id)}
                              className="text-xs p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200 hover:scale-110"
                              title="Marcar como leída"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {/* {notificaciones.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link
              to="/notificaciones"
              onClick={onClose}
              className="block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        )} */}
      </div>
    </>
  );
};
