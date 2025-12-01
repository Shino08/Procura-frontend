// src/page/SolicitudesPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const SolicitudesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Datos de ejemplo - reemplazar con fetch real
  const solicitudes = [
    {
      id: 'SOL-2025-001',
      fecha: '2025-11-27',
      nombreArchivo: 'solicitud_proyecto_norte_nov2025.xlsx',
      totalItems: 156,
      observaciones: 'Solicitud urgente para proyecto Norte - Fase 1',
    },
    {
      id: 'SOL-2025-002',
      fecha: '2025-11-26',
      nombreArchivo: 'mantenimiento_preventivo_2025.csv',
      totalItems: 89,
      observaciones: 'Mantenimiento preventivo trimestral - Todas las instalaciones',
    },
    {
      id: 'SOL-2025-003',
      fecha: '2025-11-25',
      nombreArchivo: 'reposicion_stock_almacen.xlsx',
      totalItems: 234,
      observaciones: 'Reposición mensual de stock - Almacén central',
    },
    {
      id: 'SOL-2025-004',
      fecha: '2025-11-24',
      nombreArchivo: 'equipamiento_obra_sur.xlsx',
      totalItems: 67,
      observaciones: 'Equipamiento completo obra sur - Entregado',
    },
    {
      id: 'SOL-2025-005',
      fecha: '2025-11-23',
      nombreArchivo: 'sistema_contraincendios.csv',
      totalItems: 312,
      observaciones: 'Presupuesto excede límite autorizado - Requiere autorización gerencial',
    },
    {
      id: 'SOL-2025-006',
      fecha: '2025-11-22',
      nombreArchivo: 'suministros_varios_diciembre.xlsx',
      totalItems: 145,
      observaciones: 'Esperando cotización de proveedores',
    },
  ];

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesSearch = sol.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sol.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

  const handleViewDetails = (solicitudId) => {
    navigate(`/solicitudes/lista/${solicitudId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Mis Solicitudes</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Historial de archivos cargados</p>
              </div>
            </div>
            
            <Link 
              to="/solicitudes/nueva"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="hidden sm:inline">Cargar Solicitud</span>
              <span className="sm:hidden">Cargar</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por número o nombre de archivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">N° Solicitud</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Archivo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Carga</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Ítems</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentSolicitudes.map((solicitud) => (
                <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{solicitud.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 max-w-xs">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-700 truncate" title={solicitud.nombreArchivo}>
                        {solicitud.nombreArchivo}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(solicitud.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {solicitud.totalItems}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(solicitud.id)}
                      className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentSolicitudes.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No se encontraron solicitudes</p>
            </div>
          )}
        </div>

        {/* Cards Mobile */}
        <div className="md:hidden space-y-3">
          {currentSolicitudes.map((solicitud) => (
            <div key={solicitud.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{solicitud.id}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(solicitud.fecha).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  {solicitud.totalItems} ítems
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-700 truncate">{solicitud.nombreArchivo}</p>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleViewDetails(solicitud.id)}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Ver detalles →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 mt-4 gap-3">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSolicitudes.length)} de {filteredSolicitudes.length} solicitudes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
