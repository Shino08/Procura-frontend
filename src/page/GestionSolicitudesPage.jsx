// src/page/GestionSolicitudesPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GestionSolicitudesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteFilter, setClienteFilter] = useState('todos'); // por ahora fijo
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Cargar uploads desde el backend
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token'); // ajusta si lo guardas distinto

        const res = await fetch('http://localhost:3000/api/uploads', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || 'Error al obtener uploads');
        }

        const data = await res.json();

        // Mapear uploads -> shape que usa la UI actual
        const mapped = data.uploads.map((u) => ({
          id: `UPL-${u.id}`,                // id de solicitud mostrado
          cliente: u.user_id ? `Usuario #${u.user_id}` : 'Desconocido', // si luego guardas nombre, cámbialo
          email: '',                        // aún no tienes email en uploads
          fecha: u.created_at,
          nombreArchivo: u.original_name,
          totalItems: u.total_items || 0,   // si luego guardas conteo, ajusta; por ahora 0
          itemsAprobados: 0,
          itemsPendientes: 0,
          itemsRechazados: 0,
          observaciones: `Estado: ${u.status}`,
          filePath: u.file_path,            // para descargar/ver el archivo
          uploadId: u.id,
        }));

        setSolicitudes(mapped);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  // 2) Filtros (por ahora solo texto)
  const filteredSolicitudes = solicitudes.filter((sol) => {
    const matchesSearch =
      sol.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.cliente.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCliente =
      clienteFilter === 'todos' || sol.cliente === clienteFilter;

    return matchesSearch && matchesCliente;
  });

  // 3) Paginación
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

  const handleViewDetails = (uploadId) => {
    // Aquí navegas a una vista de detalle por upload
    navigate(`/solicitudes/gestion/${uploadId}`);
  };

  const handleDownloadFile = (filePath) => {
    window.open(`http://localhost:3000${filePath}`, '_blank');
  };

  const getProgresoColor = (aprobados, total) => {
    const porcentaje = total > 0 ? (aprobados / total) * 100 : 0;
    if (porcentaje === 100) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  // 4) Posibles estados de carga / error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">Cargando solicitudes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg px-6 py-4 border border-red-200">
          <p className="text-red-600 text-sm font-semibold">
            Error al cargar solicitudes
          </p>
          <p className="text-xs text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // 5) UI original con datos desde API (solo cambié dónde vienen los datos y las acciones)
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
                <p className="text-xs text-gray-500 hidden sm:block">
                  Administrar solicitudes (archivos) subidos por Procura
                </p>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentSolicitudes.map((solicitud) => (
                <tr key={solicitud.uploadId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">
                        {solicitud.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {solicitud.cliente}
                      </p>
                      {solicitud.email && (
                        <p className="text-xs text-gray-500">{solicitud.email}</p>
                      )}
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
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {solicitud.observaciones}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadFile(solicitud.filePath)}
                      className="text-gray-700 hover:text-gray-900 font-medium text-xs border border-gray-300 px-3 py-1.5 rounded-lg"
                    >
                      Descargar
                    </button>
                    <button
                      onClick={() => handleViewDetails(solicitud.uploadId)}
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

        {/* Paginación (igual que antes) */}
        {filteredSolicitudes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 mt-4 gap-3">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSolicitudes.length)} de {filteredSolicitudes.length} solicitudes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {filteredSolicitudes.length === 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-600">
            No se encontraron solicitudes.
          </div>
        )}
      </main>
    </div>
  );
};
