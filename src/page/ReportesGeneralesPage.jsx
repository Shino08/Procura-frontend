// src/page/ReportesGeneralesPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ReportesGeneralesPage = () => {
  const [periodoFiltro, setPeriodoFiltro] = useState('mes');
  const [tipoReporte, setTipoReporte] = useState('todos');

  // Estadísticas de ejemplo
  const estadisticasGenerales = [
    {
      title: "Total Solicitudes",
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "orange"
    },
    {
      title: "Usuarios Activos",
      value: "384",
      change: "+8.2%",
      trend: "up",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Procesadas",
      value: "1,089",
      change: "87.3%",
      trend: "up",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "green"
    },
    {
      title: "Pendientes",
      value: "158",
      change: "-2.4%",
      trend: "down",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "yellow"
    }
  ];

  // Datos para gráficos de barras (simplificado)
  const datosMensuales = [
    { mes: "Ene", solicitudes: 89, procesadas: 75 },
    { mes: "Feb", solicitudes: 102, procesadas: 94 },
    { mes: "Mar", solicitudes: 95, procesadas: 88 },
    { mes: "Abr", solicitudes: 118, procesadas: 109 },
    { mes: "May", solicitudes: 134, procesadas: 121 },
    { mes: "Jun", solicitudes: 156, procesadas: 142 },
    { mes: "Jul", solicitudes: 145, procesadas: 133 },
    { mes: "Ago", solicitudes: 167, procesadas: 154 },
    { mes: "Sep", solicitudes: 189, procesadas: 171 },
    { mes: "Oct", solicitudes: 201, procesadas: 184 },
    { mes: "Nov", solicitudes: 178, procesadas: 165 },
    { mes: "Dic", solicitudes: 163, procesadas: 151 }
  ];

  // Tipos de reporte disponibles
  const tiposDeReporte = [
    {
      id: "solicitudes",
      title: "Reporte de Solicitudes",
      description: "Análisis detallado de todas las solicitudes del sistema",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a2 2 0 002 2h4a2 2 0 002-2v-1m-6 0h6m-6 0H5a2 2 0 01-2-2V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1" />
        </svg>
      ),
      color: "orange",
      features: ["Filtrado por fechas", "Exportación Excel", "Gráficos interactivos"]
    },
    {
      id: "usuarios",
      title: "Reporte de Usuarios",
      description: "Estadísticas de actividad y participación de usuarios",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "blue",
      features: ["Actividad por usuario", "Roles y permisos", "Tiempos de respuesta"]
    },
    {
      id: "desempeño",
      title: "Reporte de Desempeño",
      description: "Métricas de rendimiento y eficiencia del sistema",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "green",
      features: ["Tiempos de procesamiento", "Tasa de aprobación", "Eficiencia operativa"]
    },
    {
      id: "inventario",
      title: "Reporte de Inventario",
      description: "Análisis de productos y existencias en el sistema",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "purple",
      features: ["Rotación de productos", "Stock crítico", "Valorización"]
    }
  ];

  // Activity reciente
  const actividadReciente = [
    {
      id: 1,
      usuario: "María González",
      accion: "Generó reporte de solicitudes",
      hora: "Hace 10 minutos",
      icon: "report",
      color: "orange"
    },
    {
      id: 2,
      usuario: "Carlos Rodríguez",
      accion: "Exportó datos a Excel",
      hora: "Hace 25 minutos",
      icon: "download",
      color: "green"
    },
    {
      id: 3,
      usuario: "Ana Martínez",
      accion: "Consultó métricas de desempeño",
      hora: "Hace 1 hora",
      icon: "chart",
      color: "blue"
    },
    {
      id: 4,
      usuario: "Luis Fernández",
      accion: "Actualizó filtros de reporte",
      hora: "Hace 2 horas",
      icon: "filter",
      color: "purple"
    }
  ];

  const getIconoActividad = (tipo) => {
    const iconos = {
      report: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      download: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      chart: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      filter: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      )
    };
    return iconos[tipo] || iconos.report;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver al Dashboard"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                  Reportes Generales
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">
                  Análisis y métricas del sistema
                </p>
              </div>
            </div>

            {/* Filtros */}
            {/* <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
                className="px-2 sm:px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white min-w-0 sm:min-w-[120px]"
              >
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="trimestre">Trimestre</option>
                <option value="anio">Año</option>
                <option value="todos">Todo</option>
              </select>

              <button className="px-2 sm:px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-xl whitespace-nowrap">
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">↓</span>
              </button>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Estadísticas Generales */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Estadísticas Generales
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {estadisticasGenerales.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-200`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {stat.icon.props.children}
                    </svg>
                  </div>
                  <span className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {stat.trend === 'down' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {stat.change}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-xs sm:text-xs lg:text-sm text-gray-600 leading-tight">
                    {stat.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tipos de Reporte */}
        {/* <section className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Tipos de Reporte
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {tiposDeReporte.map((reporte) => (
              <div key={reporte.id} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-200 cursor-pointer">
                <div className={`mb-4 sm:mb-6 inline-flex p-3 sm:p-4 rounded-xl bg-${reporte.color}-100 text-${reporte.color}-600 group-hover:scale-110 transition-transform duration-200`}>
                  {reporte.icon}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-orange-600 transition-colors">
                  {reporte.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-2">
                  {reporte.description}
                </p>

                <div className="space-y-2 mb-4 sm:mb-6">
                  {reporte.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-${reporte.color}-500 to-${reporte.color}-600 hover:from-${reporte.color}-600 hover:to-${reporte.color}-700 rounded-lg transition-all duration-200 shadow-md group-hover:shadow-lg`}>
                  Generar Reporte
                </button>
              </div>
            ))}
          </div>
        </section> */}

        {/* Gráfico de Actividad Mensual */}
        <section className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
            {/* Header del gráfico */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Solicitudes Mensuales
              </h3>
              <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600 whitespace-nowrap">Total</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 whitespace-nowrap">Procesadas</span>
                </div>
              </div>
            </div>

            {/* Gráfico de barras responsive */}
            <div className="space-y-2.5 sm:space-y-3">
              {datosMensuales.slice(0, 6).map((mes, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
                    {mes.mes}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 sm:h-7 lg:h-8 relative overflow-hidden min-w-0">
                    {/* Barra de procesadas (debajo) */}
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(mes.procesadas / Math.max(...datosMensuales.slice(0, 6).map(d => d.solicitudes))) * 100}%`
                      }}
                    >
                      <span className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                        {mes.procesadas}
                      </span>
                    </div>
                    {/* Barra de total (encima) */}
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(mes.solicitudes / Math.max(...datosMensuales.slice(0, 6).map(d => d.solicitudes))) * 100}%`
                      }}
                    >
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                        {mes.solicitudes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla simplificada para móvil */}
            <div className="mt-6 sm:hidden">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                <div className="text-left text-gray-600 pb-2 border-b border-gray-200">Mes</div>
                <div className="text-right text-gray-600 pb-2 border-b border-gray-200">Total</div>
                <div className="text-right text-gray-600 pb-2 border-b border-gray-200">Proc.</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                {datosMensuales.slice(0, 6).map((mes, index) => (
                  <>
                    <div key={`mes-${index}`} className="font-medium text-gray-800 py-1">{mes.mes}</div>
                    <div key={`total-${index}`} className="text-right text-gray-800 py-1">{mes.solicitudes}</div>
                    <div key={`proc-${index}`} className="text-right text-green-600 py-1">{mes.procesadas}</div>
                  </>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Actividad Reciente */}
        <section>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Actividad Reciente - 2 columnas en desktop, 1 en mobile/tablet */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 h-full">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Actividad Reciente
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {actividadReciente.map((actividad, index) => (
                    <div key={actividad.id} className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                      <div className={`p-2 rounded-lg bg-${actividad.color}-100 text-${actividad.color}-600 flex-shrink-0`}>
                        {getIconoActividad(actividad.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          <span className="font-semibold">{actividad.usuario}</span> {actividad.accion}
                        </p>
                        <p className="text-xs text-gray-500">
                          {actividad.hora}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen Rápido - 1 columna siempre */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 h-full">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Resumen Rápido
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                    <span className="text-xs sm:text-sm text-gray-600">Reportes hoy</span>
                    <span className="text-xs sm:text-sm font-bold text-orange-600">24</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                    <span className="text-xs sm:text-sm text-gray-600">Exportaciones semana</span>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">156</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                    <span className="text-xs sm:text-sm text-gray-600">Usuarios activos</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800">384</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                    <span className="text-xs sm:text-sm text-gray-600">Tasa aprobación</span>
                    <span className="text-xs sm:text-sm font-bold text-green-600">87.3%</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                    <span className="text-xs sm:text-sm text-gray-600">Tiempo promedio</span>
                    <span className="text-xs sm:text-sm font-bold text-purple-600">2.4 días</span>
                  </div>
                </div>

                {/* Botón de acción adicional */}
                {/* <div className="mt-6 pt-4 border-t border-gray-200">
                  <button className="w-full py-2.5 px-4 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                    Ver Reporte Completo
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};