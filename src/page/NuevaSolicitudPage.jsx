// src/page/NuevoProductoPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const NuevaSolicitudPage = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [productos, setProductos] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  
  // Estado para modales
  const [modal, setModal] = useState({
    show: false,
    type: '', // 'confirm' | 'success' | 'error'
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModal({
      show: false,
      type: '',
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  };

  const handleModalConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

const handleProcessar = async () => {
  if (!file) {
    showModal(
      'error',
      'Sin archivo',
      'Debes seleccionar un archivo antes de procesar.'
    );
    return;
  }

  try {
    setProcessing(true);

    const formData = new FormData();
    formData.append('file', file); // el campo debe llamarse como lo espera tu backend

    const response = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      body: formData,
      // NO pongas Content-Type, fetch lo arma solo con FormData
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al procesar el archivo`);
    }

    const data = await response.json();
    // data = { message, data: [...], savedFile }

    const requestsRaw = data.data || [];

    if (!Array.isArray(requestsRaw)) {
      throw new Error('La respuesta del servidor no contiene una lista de productos válida.');
    }

    // Mapear al formato que usa la tabla (incluye id y estatus)
    const requests = requestsRaw.map((item, index) => ({
      id: index + 1,
      nombre: item.nombre,
      categoria: item.categoria,
      marca: item.marca,
      modelo: item.modelo,
      material: item.material,
      precio: item.precio,
      stock: item.stock,
      confianza: item.confianza,
      estatus: 'Borrador',
    }));

    setProductos(requests);
    setProcessing(false);

    showModal(
      'success',
      'Documento procesado',
      `Se detectaron ${requests.length} productos en el archivo.`
    );
  } catch (err) {
    console.error(err);
    setProcessing(false);
    showModal(
      'error',
      'Error al procesar',
      err.message || 'Ocurrió un error al comunicarse con el servidor.'
    );
  }
};



  const handleCellEdit = (id, field, value) => {
    setProductos(productos.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleDeleteRow = (id) => {
    showModal(
      'confirm',
      '¿Eliminar Producto?',
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      () => {
        setProductos(productos.filter(p => p.id !== id));
      },
      'Eliminar',
      'Cancelar'
    );
  };

  const handleAddRow = () => {
    const newId = Math.max(...productos.map(p => p.id), 0) + 1;
    setProductos([...productos, {
      id: newId,
      nombre: '',
      categoria: '',
      marca: '',
      modelo: '',
      material: '',
      precio: '',
      stock: '',
      confianza: 0
    }]);
  };

const handleGuardarTodos = async () => {
  try {
    if (!productos || productos.length === 0) {
      showModal(
        'error',
        'Sin productos',
        'No hay productos para guardar. Procesa un archivo primero.'
      );
      return;
    }

    // Solo productos válidos (opcional)
    const productosParaGuardar = productos
      .filter(p => p.estatus !== 'Rechazado') // o p.estatus === 'Validado'
      .map(({ id, confianza, ...rest }) => rest); // limpia campos solo de UI

    const response = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: productosParaGuardar, // ajusta la clave al contrato de tu API
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Error ${response.status} al guardar productos: ${errText}`);
    }

    const result = await response.json();
    console.log('Productos guardados:', result);

    showModal(
      'success',
      '¡Productos Guardados!',
      `${productos.length} producto${productos.length !== 1 ? 's' : ''} guardado${productos.length !== 1 ? 's' : ''} exitosamente en el sistema.`,
      () => {
        navigate('/dashboard');
      },
      'Ir al Dashboard',
      null
    );

    // Opcional: limpiar estado o ir al dashboard
    // setProductos([]);
    // navigate('/dashboard');

  } catch (err) {
    console.error(err);
    showModal(
      'error',
      'Error al guardar',
      err.message || 'Ocurrió un error al guardar los productos.'
    );
  }
};

  const handleResetear = () => {
    showModal(
      'confirm',
      '¿Cargar Nuevo Archivo?',
      '¿Deseas cargar otro archivo? Se perderán todos los cambios no guardados en los productos actuales.',
      () => {
        setFile(null);
        setProductos([]);
        setProcessing(false);
      },
      'Cargar Nuevo',
      'Cancelar'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-800">Nueva solicitud</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Cargar especificaciones técnicas</p>
              </div>
            </div>

            {productos.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-gray-600">
                  {productos.length} producto{productos.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleGuardarTodos}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Guardar Todo</span>
                  <span className="sm:hidden">Guardar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Progress Steps */}
        {productos.length === 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 text-white rounded-full font-bold text-sm sm:text-base">
                  1
                </div>
                <div className="w-16 sm:w-24 h-1 bg-orange-500"></div>
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 text-gray-600 rounded-full font-bold text-sm sm:text-base">
                  2
                </div>
                <div className="w-16 sm:w-24 h-1 bg-gray-300"></div>
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 text-gray-600 rounded-full font-bold text-sm sm:text-base">
                  3
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-12 sm:gap-24 mt-3">
              <span className="text-xs sm:text-sm font-medium text-orange-600">Cargar</span>
              <span className="text-xs sm:text-sm text-gray-500">Revisar</span>
              <span className="text-xs sm:text-sm text-gray-500">Guardar</span>
            </div>
          </div>
        )}

        {/* Upload Area - Solo mostrar si no hay productos cargados */}
        {productos.length === 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Cargar Documento</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Sube el archivo con las especificaciones técnicas (puede contener múltiples productos)
              </p>
            </div>

            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 transition-all duration-300 ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-300 hover:border-orange-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                />
                
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">o haz clic para seleccionar</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
                      <span className="px-2 sm:px-3 py-1 bg-white rounded-full border border-gray-200">PDF</span>
                      <span className="px-2 sm:px-3 py-1 bg-white rounded-full border border-gray-200">Word</span>
                      <span className="px-2 sm:px-3 py-1 bg-white rounded-full border border-gray-200">Excel</span>
                      <span className="px-2 sm:px-3 py-1 bg-white rounded-full border border-gray-200">Imagen</span>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{file.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    disabled={processing}
                    className="p-2 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!processing && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleProcessar}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Procesar con IA
                    </button>
                    <button
                      onClick={() => setFile(null)}
                      className="px-4 sm:px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {processing && (
                  <div className="bg-white rounded-xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="relative">
                        <svg className="animate-spin h-7 w-7 sm:h-8 sm:w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">Procesando documento...</p>
                        <p className="text-xs sm:text-sm text-gray-600">Extrayendo especificaciones técnicas</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabla de Productos - Mostrar después de procesar */}
        {productos.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header de la tabla */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Solicitudes Detectadas</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {productos.length} solicitud{productos.length !== 1 ? 'es' : ''} encontrado{productos.length !== 1 ? 'es' : ''} - Revisa y edita antes de guardar
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRow}
                    className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Agregar Fila</span>
                    <span className="sm:hidden">Agregar</span>
                  </button>
                  <button
                    onClick={handleResetear}
                    className="flex-1 sm:flex-none border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="hidden sm:inline">Nuevo Archivo</span>
                    <span className="sm:hidden">Nuevo</span>
                  </button>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marca</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modelo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">IA %</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productos.map((producto, index) => (
                      <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={producto.nombre}
                            onChange={(e) => handleCellEdit(producto.id, 'nombre', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={producto.categoria}
                            onChange={(e) => handleCellEdit(producto.id, 'categoria', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          >
                            <option value="">Seleccionar</option>
                            <option>Válvulas</option>
                            <option>Tubería</option>
                            <option>Accesorios</option>
                            <option>Equipos</option>
                            <option>Herramientas</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={producto.marca}
                            onChange={(e) => handleCellEdit(producto.id, 'marca', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={producto.modelo}
                            onChange={(e) => handleCellEdit(producto.id, 'modelo', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={producto.material}
                            onChange={(e) => handleCellEdit(producto.id, 'material', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={producto.precio}
                            onChange={(e) => handleCellEdit(producto.id, 'precio', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={producto.stock}
                            onChange={(e) => handleCellEdit(producto.id, 'stock', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            producto.confianza >= 95 ? 'bg-green-100 text-green-700' :
                            producto.confianza >= 85 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {producto.confianza}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteRow(producto.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden space-y-4">
                {productos.map((producto, index) => (
                  <div key={producto.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          producto.confianza >= 95 ? 'bg-green-100 text-green-700' :
                          producto.confianza >= 85 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          IA: {producto.confianza}%
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteRow(producto.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={producto.nombre}
                          onChange={(e) => handleCellEdit(producto.id, 'nombre', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
                          <select
                            value={producto.categoria}
                            onChange={(e) => handleCellEdit(producto.id, 'categoria', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          >
                            <option value="">Seleccionar</option>
                            <option>Válvulas</option>
                            <option>Tubería</option>
                            <option>Accesorios</option>
                            <option>Equipos</option>
                            <option>Herramientas</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Marca</label>
                          <input
                            type="text"
                            value={producto.marca}
                            onChange={(e) => handleCellEdit(producto.id, 'marca', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Modelo</label>
                          <input
                            type="text"
                            value={producto.modelo}
                            onChange={(e) => handleCellEdit(producto.id, 'modelo', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Material</label>
                          <input
                            type="text"
                            value={producto.material}
                            onChange={(e) => handleCellEdit(producto.id, 'material', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Precio (USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={producto.precio}
                            onChange={(e) => handleCellEdit(producto.id, 'precio', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
                          <input
                            type="number"
                            value={producto.stock}
                            onChange={(e) => handleCellEdit(producto.id, 'stock', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción finales */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleGuardarTodos}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar {productos.length} Producto{productos.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                Revisa que todos los datos sean correctos antes de guardar. Los campos con baja confianza IA requieren revisión manual.
              </p>
            </div>
          </div>
        )}

        {/* Info Cards - Solo mostrar si no hay productos */}
        {productos.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Precisión IA</p>
                  <p className="text-sm font-bold text-gray-800">95%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tiempo estimado</p>
                  <p className="text-sm font-bold text-gray-800">30 seg</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Múltiples registros</p>
                  <p className="text-sm font-bold text-gray-800">Soportado</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Universal */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scale-in">
            {/* Icono según el tipo */}
            <div className="flex justify-center mb-4">
              {modal.type === 'confirm' && (
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              {modal.type === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Título */}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">
              {modal.title}
            </h3>

            {/* Mensaje */}
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              {modal.message}
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
              {modal.cancelText && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                onClick={handleModalConfirm}
                className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all shadow-lg text-sm sm:text-base ${
                  modal.type === 'confirm'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30 hover:shadow-xl'
                    : modal.type === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30 hover:shadow-xl'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30 hover:shadow-xl'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
