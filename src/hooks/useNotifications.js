// src/hooks/useNotificaciones.js
import { useState, useEffect } from 'react';

export const useNotificaciones = () => {
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now());

  useEffect(() => {
    cargarContador();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarContador();
    }, 30000);

    return () => clearInterval(interval);
  }, [ultimaActualizacion]);

  const cargarContador = async () => {
    try {
      // TODO: Reemplazar con llamada real al backend
      // const response = await fetch('/api/notificaciones/no-leidas', {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      // const data = await response.json();
      // setNotificacionesNoLeidas(data.count);

      // Simulación
      setNotificacionesNoLeidas(3);
    } catch (error) {
      console.error('Error al cargar contador de notificaciones:', error);
    }
  };

  const actualizarContador = () => {
    setUltimaActualizacion(Date.now());
  };

  return {
    notificacionesNoLeidas,
    actualizarContador
  };
};
