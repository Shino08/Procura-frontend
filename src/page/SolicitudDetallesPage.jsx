// src/page/SolicitudDetallesPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const SolicitudDetallesPage = () => {
  const navigate = useNavigate();
  const { fileId } = useParams();

  // Header general del archivo
  const [solicitud, setSolicitud] = useState(null);

  // Lista de solicitudes (una por hoja), cada una con sus items
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActivaId, setSolicitudActivaId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Cargar detalles desde backend
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');

        // Endpoint de detalles de archivo
        const res = await fetch(`http://localhost:3000/api/uploads/files/${fileId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || errData.message || 'Error al obtener detalles del archivo'
          );
        }

        const data = await res.json();
        const archivo = data.file;
        const solicitudesApi = data.solicitudes || [];

        if (!archivo) {
          throw new Error('Archivo no encontrado.');
        }

        if (!solicitudesApi.length) {
          // si quieres permitir archivos sin solicitudes, puedes no lanzar error
          throw new Error('El archivo no tiene solicitudes asociadas.');
        }

        // Mapear solicitudes + sus items (una solicitud = una hoja)
        const mappedSolicitudes = solicitudesApi.map((s, idxSolicitud) => {
          const materiales = s.data || [];

          const items = materiales.map((m, idxItem) => ({
            linea: idxItem + 1,
            codigo: m.codigo || `MAT-${m.id}`,
            descripcion: m.descripcion || '(Sin descripción)',
            cantidad: m.cantidad_total || 0,
            tipo: 'Materiales',
            unidad: m.unidad || 'UND',
            estado: 'Pendiente',   // cuando tengas estado real, lo mapeas aquí
            observacion: '',       // si tienes campo observación en BD, úsalo
          }));

          return {
            id: s.id ?? `${idxSolicitud + 1}`,                       // id de la solicitud
            nombre: s.name ?? `Solicitud ${idxSolicitud + 1}`,       // nombre de hoja
            totalItems: items.length,
            items,
          };
        });

        // Header general del archivo (usa el total sumado de todas las solicitudes)
        const totalItemsArchivo = mappedSolicitudes.reduce(
          (acc, s) => acc + s.totalItems,
          0
        );

        const mappedSolicitudHeader = {
          id: `ARC-${String(archivo.id).padStart(4, '0')}`,
          fecha: archivo.created_at,
          nombreArchivo: archivo.source_file,
          totalItems: totalItemsArchivo,
          observaciones: `Solicitudes asociadas: ${mappedSolicitudes.length}`,
        };

        setSolicitud(mappedSolicitudHeader);
        setSolicitudes(mappedSolicitudes);
        setSolicitudActivaId(mappedSolicitudes[0]?.id ?? null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (fileId) fetchDetails();
  }, [fileId]);

  const getStatusConfig = (estado) => {
    const configs = {
      Pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500' },
      'En Revisión': { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' },
      Aprobado: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' },
      Rechazado: { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' },
      'En Proceso': { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500' },
    };
    return configs[estado] || configs.Pendiente;
  };

  const getTipoConfig = (tipo) => {
    const configs = {
      Productos: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      Servicios: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      Materiales: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      Equipos: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    };
    return configs[tipo] || configs.Productos;
  };

  // 2) Obtener items de la solicitud activa
  const solicitudActiva =
    solicitudes.find((s) => String(s.id) === String(solicitudActivaId)) ||
    solicitudes[0] ||
    null;

  const itemsBase = solicitudActiva ? solicitudActiva.items : [];

  // 3) Filtros sobre items de la solicitud activa
  const filteredItems = itemsBase.filter((item) => {
    const matchesSearch =
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.estado === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || item.tipo === tipoFilter;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // 4) Estadísticas (por solicitud activa)
  const stats = {
    total: itemsBase.length,
    aprobados: itemsBase.filter((i) => i.estado === 'Aprobado').length,
    pendientes: itemsBase.filter((i) => i.estado === 'Pendiente' || i.estado === 'En Revisión').length,
    enProceso: itemsBase.filter((i) => i.estado === 'En Proceso').length,
    rechazados: itemsBase.filter((i) => i.estado === 'Rechazado').length,
  };

  // 5) Paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // 6) Estados de carga / error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">Cargando detalles de la solicitud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-xl px-6 py-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm text-gray-700">
          No se encontraron datos para este archivo.
        </div>
      </div>
    );
  }

  // 7) UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate('/solicitudes/lista')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                  {solicitud.id}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block truncate">
                  {solicitud.nombreArchivo}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 text-xs sm:text-sm font-semibold flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Información del archivo */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Fecha de Carga</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(solicitud.fecha).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Total de Ítems (todas las solicitudes)</p>
              <p className="text-sm font-semibold text-gray-800">{solicitud.totalItems} ítems</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Observaciones</p>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{solicitud.observaciones}</p>
            </div>
          </div>
        </div>

        {/* Selector de Solicitud / Hoja */}
        {solicitudes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
              Solicitud / Hoja
            </label>
            <select
              value={solicitudActivaId ?? ''}
              onChange={(e) => {
                setSolicitudActivaId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              {solicitudes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.totalItems} ítems)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Estadísticas de la solicitud activa */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
              <p className="text-sm text-gray-600">Total</p>
            </div>

            {/* Aprobados */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.aprobados}</h3>
              <p className="text-sm text-gray-600">Aprobados</p>
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-yellow-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.pendientes}</h3>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>

            {/* En Proceso */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.enProceso}</h3>
              <p className="text-sm text-gray-600">En Proceso</p>
            </div>

            {/* Rechazados */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-red-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.rechazados}</h3>
              <p className="text-sm text-gray-600">Rechazados</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="todos">Todos los tipos</option>
              <option value="Productos">Productos</option>
              <option value="Servicios">Servicios</option>
              <option value="Materiales">Materiales</option>
              <option value="Equipos">Equipos</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Aprobado">Aprobado</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unidad</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((item) => {
                  const statusConfig = getStatusConfig(item.estado);
                  const tipoConfig = getTipoConfig(item.tipo);
                  
                  return (
                    <tr key={item.linea} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 font-medium">{item.linea}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">{item.codigo}</td>
                      <td className="px-6 py-4 text-gray-800 max-w-xs">{item.descripcion}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{item.cantidad}</td>
                      <td className="px-6 py-4 text-gray-600">{item.unidad}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badge}`}></span>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate" title={item.observacion}>
                        {item.observacion || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {currentItems.length === 0 && (
            <div className="text-center py-16">
              <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No se encontraron ítems con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden space-y-4">
          {currentItems.map((item) => {
            const statusConfig = getStatusConfig(item.estado);
            const tipoConfig = getTipoConfig(item.tipo);
            
            return (
              <div key={item.linea} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                {/* Header del Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                      {item.linea}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-gray-500 mb-1">{item.codigo}</p>
                      <p className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2">{item.descripcion}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text}`}>
                    {item.tipo}
                  </span>
                </div>

                {/* Info Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-3">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="font-semibold text-gray-800">{item.cantidad}</span>
                    <span className="text-gray-500">{item.unidad}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badge}`}></span>
                    {item.estado}
                  </span>
                </div>

                {/* Observación */}
                {item.observacion && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Observación:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{item.observacion}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State - Mobile */}
          {currentItems.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No se encontraron ítems</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl border border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 mt-6 sm:mt-8 gap-4 shadow-sm">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Mostrando <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, filteredItems.length)}</span> de <span className="font-semibold">{filteredItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
