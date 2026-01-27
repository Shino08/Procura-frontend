// src/page/ReportesGeneralesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { API_URL } from '../services';

// Función para formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", { year: 'numeric', month: 'short', day: 'numeric' });
};

// Obtener nombre del mes
const getNombreMes = (mesIndex) => {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return meses[mesIndex];
};

export const ReportesGeneralesPage = () => {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [archivos, setArchivos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [error, setError] = useState(null);

  // Filtros
  const [periodoFiltro, setPeriodoFiltro] = useState('all'); // 'all', 'month', 'week'
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUserName = localStorage.getItem("userCorreo") || "Usuario";
    setUserName(storedUserName);
  }, []);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch archivos
        const archivosRes = await fetch(`${API_URL}/archivos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!archivosRes.ok) throw new Error("Error al cargar archivos");

        const archivosData = await archivosRes.json();
        const archivosArray = Array.isArray(archivosData?.archivos) ? archivosData.archivos : [];
        setArchivos(archivosArray);

        // Fetch estados
        const estadosRes = await fetch(`${API_URL}/estados`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (estadosRes.ok) {
          const estadosData = await estadosRes.json();
          setEstados(Array.isArray(estadosData) ? estadosData : []);
        }

      } catch (err) {
        console.error("Error loading report data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  // Filtrar archivos por período
  const archivosFiltrados = useMemo(() => {
    let filtered = [...archivos];

    const now = new Date();

    if (periodoFiltro === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(a => new Date(a.fechaCreacion) >= weekAgo);
    } else if (periodoFiltro === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(a => new Date(a.fechaCreacion) >= monthAgo);
    }

    if (estadoFiltro !== 'todos') {
      filtered = filtered.filter(a => a.estado === estadoFiltro);
    }

    return filtered;
  }, [archivos, periodoFiltro, estadoFiltro]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = archivosFiltrados.length;

    // Contar por estados
    const porEstado = {};
    archivosFiltrados.forEach(a => {
      const estado = a.estado || 'Sin estado';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });

    // Usuarios únicos
    const usuariosUnicos = new Set();
    archivosFiltrados.forEach(a => {
      if (a.usuarioCorreo || a.correo) {
        usuariosUnicos.add(a.usuarioCorreo || a.correo);
      }
    });

    // Conteo de items totales
    let totalItems = 0;
    archivosFiltrados.forEach(a => {
      if (a.solicitudes) {
        a.solicitudes.forEach(s => {
          totalItems += (s.items?.length || 0);
        });
      }
    });

    // Estados específicos
    const pendientes = archivosFiltrados.filter(a =>
      a.estado === 'Pendiente' || a.estado === 'En Proceso'
    ).length;

    const completados = archivosFiltrados.filter(a =>
      a.estado === 'Completada'
    ).length;

    const tasaCompletado = total > 0 ? Math.round((completados / total) * 100) : 0;

    return {
      total,
      porEstado,
      usuariosUnicos: usuariosUnicos.size,
      totalItems,
      pendientes,
      completados,
      tasaCompletado
    };
  }, [archivosFiltrados]);

  // Datos para gráfico mensual (últimos 6 meses)
  const datosMensuales = useMemo(() => {
    const mesesData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();

      const solicitudesDelMes = archivos.filter(a => {
        const fechaArchivo = new Date(a.fechaCreacion);
        return fechaArchivo.getMonth() === mes && fechaArchivo.getFullYear() === año;
      });

      const completadasDelMes = solicitudesDelMes.filter(a => a.estado === 'Completada').length;

      mesesData.push({
        id: `${año}-${mes}`,
        mes: getNombreMes(mes),
        año: año,
        solicitudes: solicitudesDelMes.length,
        completadas: completadasDelMes
      });
    }

    return mesesData;
  }, [archivos]);

  // Máximo para escalar las barras
  const maxSolicitudes = Math.max(...datosMensuales.map(d => d.solicitudes), 1);

  // Actividad reciente (últimas 5 solicitudes)
  const actividadReciente = useMemo(() => {
    return [...archivos]
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        nombre: a.nombre,
        usuario: a.usuarioCorreo || a.correo || 'Usuario',
        fecha: a.fechaCreacion,
        estado: a.estado || 'Sin estado'
      }));
  }, [archivos]);

  // Colores para estados
  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      'En Proceso': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
      'Completada': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
      'Rechazada': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return colores[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  // Stats cards config
  const estadisticasGenerales = [
    {
      id: 'total-solicitudes',
      title: "Total Solicitudes",
      value: stats.total,
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "orange"
    },
    {
      id: 'usuarios-activos',
      title: "Usuarios",
      value: stats.usuariosUnicos,
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "blue"
    },
    {
      id: 'completadas',
      title: "Completadas",
      value: stats.completados,
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "green"
    },
    {
      id: 'pendientes',
      title: "Pendientes",
      value: stats.pendientes,
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "yellow"
    }
  ];

  // Color classes para Tailwind JIT
  const colorClasses = {
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        roleLabel="Administrador"
        showBackButton={true}
        backTo="/dashboard"
        title="Reportes Generales"
        subtitle="Análisis y métricas del sistema"
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Reportes Generales", active: true }
        ]}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Filtros */}
        <section className="mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-800">Filtros de Reporte</h2>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filtro por período */}
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Todo el tiempo</option>
                  <option value="month">Último mes</option>
                  <option value="week">Última semana</option>
                </select>

                {/* Filtro por estado */}
                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="todos">Todos los estados</option>
                  {estados.map(e => (
                    <option key={e.id} value={e.nombre}>{e.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos del reporte...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Estadísticas Generales */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                Estadísticas Generales
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {estadisticasGenerales.map((stat) => (
                  <div
                    key={stat.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg ${colorClasses[stat.color].bg} ${colorClasses[stat.color].text} group-hover:scale-110 transition-transform duration-200`}>
                        {stat.icon}
                      </div>
                      {stat.id === 'completadas' && stats.total > 0 && (
                        <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                          {stats.tasaCompletado}%
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-1">
                        {stat.value.toLocaleString()}
                      </h3>
                      <p className="text-xs sm:text-xs lg:text-sm text-gray-600 leading-tight">
                        {stat.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gráfico de Actividad Mensual */}
            <section className="mb-6 sm:mb-8">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    Solicitudes por Mes (Últimos 6 meses)
                  </h3>
                  <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-600 whitespace-nowrap">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 whitespace-nowrap">Completadas</span>
                    </div>
                  </div>
                </div>

                {/* Gráfico de barras */}
                <div className="space-y-2.5 sm:space-y-3">
                  {datosMensuales.map((mes) => (
                    <div key={mes.id} className="flex items-center gap-2 sm:gap-4">
                      <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
                        {mes.mes}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 sm:h-8 relative overflow-hidden min-w-0">
                        {/* Barra de total */}
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700 ease-out flex items-center justify-end"
                          style={{
                            width: mes.solicitudes > 0 ? `${(mes.solicitudes / maxSolicitudes) * 100}%` : '0%',
                            minWidth: mes.solicitudes > 0 ? '30px' : '0'
                          }}
                        >
                          <span className="pr-2 text-xs font-semibold text-white">
                            {mes.solicitudes}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 sm:w-20 text-right">
                        <span className="text-xs sm:text-sm text-green-600 font-medium">
                          {mes.completadas} comp.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mensaje si no hay datos */}
                {datosMensuales.every(m => m.solicitudes === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay datos para mostrar en este período</p>
                  </div>
                )}
              </div>
            </section>

            {/* Distribución por Estados y Actividad Reciente */}
            <section>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

                {/* Distribución por Estados */}
                <div className="xl:col-span-1">
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 h-full">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                      Por Estado
                    </h3>

                    <div className="space-y-3">
                      {Object.entries(stats.porEstado).length > 0 ? (
                        Object.entries(stats.porEstado).map(([estado, cantidad]) => {
                          const color = getEstadoColor(estado);
                          const porcentaje = stats.total > 0 ? Math.round((cantidad / stats.total) * 100) : 0;

                          return (
                            <div key={estado} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${color.dot}`}></span>
                                <span className="text-sm text-gray-700">{estado}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800">{cantidad}</span>
                                <span className="text-xs text-gray-500">({porcentaje}%)</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay datos</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actividad Reciente */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 h-full">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                      Últimas Solicitudes
                    </h3>

                    <div className="space-y-3 sm:space-y-4">
                      {actividadReciente.length > 0 ? (
                        actividadReciente.map((item) => {
                          const color = getEstadoColor(item.estado);
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                            >
                              <div className="p-2 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate mb-1" title={item.nombre}>
                                  {item.nombre}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span>{item.usuario.split('@')[0]}</span>
                                  <span>•</span>
                                  <span>{formatFecha(item.fecha)}</span>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-medium ${color.bg} ${color.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                                <span className="hidden sm:inline">{item.estado}</span>
                                <span className="sm:hidden">{item.estado.slice(0, 3)}</span>
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No hay solicitudes registradas</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Resumen Rápido */}
            <section className="mt-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                  Resumen del Sistema
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{archivos.length}</p>
                    <p className="text-xs text-gray-600">Total General</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.usuariosUnicos}</p>
                    <p className="text-xs text-gray-600">Usuarios</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.tasaCompletado}%</p>
                    <p className="text-xs text-gray-600">Tasa Completado</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{estados.length}</p>
                    <p className="text-xs text-gray-600">Estados</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-600">
          <p>© 2026 Sistema Procura - Business & Development. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
