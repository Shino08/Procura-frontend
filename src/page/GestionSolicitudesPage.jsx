// src/page/GestionSolicitudesPage.jsx (Vista Admin - Lista de Solicitudes)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GestionSolicitudesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Datos de ejemplo - reemplazar con fetch real
  const solicitudes = [
    {
      id: 'SOL-2025-001',
      cliente: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      fecha: '2025-11-27',
      nombreArchivo: 'solicitud_proyecto_norte_nov2025.xlsx',
      totalItems: 156,
      itemsAprobados: 120,
      itemsPendientes: 25,
      itemsRechazados: 11,
      observaciones: 'Solicitud urgente para proyecto Norte - Fase 1',
    },
    {
      id: 'SOL-2025-002',
      cliente: 'María González',
      email: 'maria.gonzalez@empresa.com',
      fecha: '2025-11-26',
      nombreArchivo: 'mantenimiento_preventivo_2025.csv',
      totalItems: 89,
      itemsAprobados: 65,
      itemsPendientes: 20,
      itemsRechazados: 4,
      observaciones: 'Mantenimiento preventivo trimestral',
    },
    {
      id: 'SOL-2025-003',
      cliente: 'Carlos Ramírez',
      email: 'carlos.ramirez@empresa.com',
      fecha: '2025-11-25',
      nombreArchivo: 'reposicion_stock_almacen.xlsx',
      totalItems: 234,
      itemsAprobados: 0,
      itemsPendientes: 234,
      itemsRechazados: 0,
      observaciones: 'Reposición mensual de stock',
    },
    {
      id: 'SOL-2025-004',
      cliente: 'Ana Torres',
      email: 'ana.torres@empresa.com',
      fecha: '2025-11-24',
      nombreArchivo: 'equipamiento_obra_sur.xlsx',
      totalItems: 67,
      itemsAprobados: 67,
      itemsPendientes: 0,
      itemsRechazados: 0,
      observaciones: 'Equipamiento completo obra sur',
    },
    {
      id: 'SOL-2025-005',
      cliente: 'Luis Morales',
      email: 'luis.morales@empresa.com',
      fecha: '2025-11-23',
      nombreArchivo: 'sistema_contraincendios.csv',
      totalItems: 312,
      itemsAprobados: 45,
      itemsPendientes: 180,
      itemsRechazados: 87,
      observaciones: 'Sistema contra incendios - Requiere revisión presupuesto',
    },
  ];

  const clientes = [...new Set(solicitudes.map(s => s.cliente))];

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesSearch = sol.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sol.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sol.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = clienteFilter === 'todos' || sol.cliente === clienteFilter;
    return matchesSearch && matchesCliente;
  });

  // Paginación
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

  const handleViewDetails = (solicitudId) => {
    navigate(`/solicitudes/gestion/${solicitudId}`);
  };

  const getProgresoColor = (aprobados, total) => {
    const porcentaje = (aprobados / total) * 100;
    if (porcentaje === 100) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-orange-500';
    return 'bg-yellow-500';
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
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Gestión de Solicitudes</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Administrar solicitudes de clientes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por N°, archivo o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={clienteFilter}
              onChange={(e) => setClienteFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla Desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Solicitud</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Archivo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Ítems</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Progreso</th>
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
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{solicitud.cliente}</p>
                      <p className="text-xs text-gray-500">{solicitud.email}</p>
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
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {solicitud.itemsAprobados} de {solicitud.totalItems} aprobados
                        </span>
                        <span className="font-semibold text-gray-800">
                          {Math.round((solicitud.itemsAprobados / solicitud.totalItems) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getProgresoColor(solicitud.itemsAprobados, solicitud.totalItems)}`}
                          style={{ width: `${(solicitud.itemsAprobados / solicitud.totalItems) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-yellow-600">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          {solicitud.itemsPendientes} pend.
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {solicitud.itemsRechazados} rech.
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(solicitud.id)}
                      className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                      Gestionar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <p className="text-xs text-gray-500">{solicitud.cliente}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  {solicitud.totalItems} ítems
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-gray-600">
                  <p className="truncate">{solicitud.nombreArchivo}</p>
                  <p className="mt-1">{new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-semibold text-gray-800">
                      {Math.round((solicitud.itemsAprobados / solicitud.totalItems) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgresoColor(solicitud.itemsAprobados, solicitud.totalItems)}`}
                      style={{ width: `${(solicitud.itemsAprobados / solicitud.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600">{solicitud.itemsAprobados} aprob.</span>
                    <span className="text-yellow-600">{solicitud.itemsPendientes} pend.</span>
                    <span className="text-red-600">{solicitud.itemsRechazados} rech.</span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetails(solicitud.id)}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Gestionar Solicitud
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
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
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
