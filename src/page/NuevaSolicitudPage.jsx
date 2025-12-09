import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export const NuevaSolicitudPage = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Estructura: { [sheetName]: { name, total_records, data: [...] } }
  const [excelData, setExcelData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);

  // Para marcar filas guardadas / en guardado
  const [savingRowId, setSavingRowId] = useState(null);
  const [savedRows, setSavedRows] = useState({}); // { `${sheetName}-${rowId}`: true }
  const [savedSheets, setSavedSheets] = useState({}); 
// estructura: { [sheetName]: true }


  const [modal, setModal] = useState({
    show: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setModal({ show: true, type, title, message, onConfirm, confirmText, cancelText });
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
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  // ============ Drag & Drop ============
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
      } else {
        showModal('error', 'Formato Inválido', 'Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        showModal('error', 'Formato Inválido', 'Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
      }
    }
  };

  // ============ Procesar Excel ============
  const handleProcessar = async () => {
    if (!file) {
      showModal('error', 'Sin archivo', 'Debes seleccionar un archivo antes de procesar.');
      return;
    }

    try {
      setProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const extractedData = {};
      const sheetNames = workbook.SheetNames;

      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        });

        if (rawData.length > 0) {
          // Buscar header "Código"
          let headerRow = 0;
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row.some(cell => cell && cell.toString().trim() === 'Código')) {
              headerRow = i;
              break;
            }
          }

          const headers = rawData[headerRow] || [];
          const dataRows = rawData.slice(headerRow + 1);

          const cleanHeaders = headers.map((header, index) => {
            const headerStr = header ? header.toString().trim() : '';
            return headerStr || `Column_${index + 1}`;
          });

          const formattedData = dataRows
            .filter(row => row.some(cell => cell && cell.toString().trim() !== ''))
            .map(row => {
              const obj = {};
              cleanHeaders.forEach((header, i) => {
                const value = row[i];
                obj[header] = value && value.toString().trim() !== '' ? value : null;
              });
              return obj;
            });

          const materialsData = formattedData
            .filter((item) => {
              const codigo = item['Código'];
              if (!codigo) return false;
              const codigoStr = codigo.toString().trim();
              return !['Código', 'Resumen de Insumos del Proyecto u Obra'].includes(codigoStr) && codigoStr.length > 0;
            })
            .map((item, index) => ({
              id: index + 1,
              codigo: item['Código'] || '',
              descripcion: item['DESCRIPCION'] || '',
              unidad: item['UNIDAD'] || '',
              cantidad_total: item['Cantidad Total'] || ''
            }));

          extractedData[sheetName] = {
            name: sheetName,
            total_records: materialsData.length,
            data: materialsData
          };
        }
      });

      setExcelData(extractedData);
      // activar primera hoja con datos
      const firstSheet = Object.keys(extractedData).find(
        name => extractedData[name].data && extractedData[name].data.length > 0
      );
      setActiveSheet(firstSheet || null);
      setCurrentStep(2);

      showModal('success', '¡Archivo Procesado!', `Se procesaron ${sheetNames.length} hojas exitosamente.`);
    } catch (err) {
      console.error(err);
      showModal('error', 'Error al Procesar', err.message || 'Ocurrió un error al procesar el archivo.');
    } finally {
      setProcessing(false);
    }
  };

  // ============ Edición por hoja ============
const handleCellEditSheet = (sheetName, id, field, value) => {
  setExcelData(prev => ({
    ...prev,
    [sheetName]: {
      ...prev[sheetName],
      data: prev[sheetName].data.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    }
  }));
};


const handleGuardarSolicitudHoja = async () => {
  try {
    if (!excelData || !activeSheet) {
      throw new Error('No hay hoja seleccionada.');
    }

    const sheet = excelData[activeSheet];
    if (!sheet || !sheet.data || sheet.data.length === 0) {
      throw new Error('La hoja seleccionada no tiene materiales.');
    }

    const token = localStorage.getItem('token');
    const userId = Number(localStorage.getItem('userId')) || null;

    const data = sheet.data.map(({ id, ...rest }) => rest);

    const payload = {
      userId,
      requests: {
        name: sheet.name,
        description: `Solicitud generada desde ${file?.name || 'archivo Excel'} - Hoja ${sheet.name}`,
        total_records: data.length,
        last_updated: new Date().toISOString()
      },
      data
    };

    const res = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Error ${res.status} al guardar la solicitud: ${txt}`);
    }

    const out = await res.json();

    if (!out.solicitudId) {
      throw new Error('La API no devolvió solicitudId. Revisa la respuesta del backend.');
    }

    setSavedSheets(prev => ({
      ...prev,
      [activeSheet]: {
        saved: true,
        solicitudId: out.solicitudId,
      },
    }));

    showModal(
      'success',
      'Solicitud guardada',
      `La hoja "${sheet.name}" se guardó como solicitud en el sistema.`
    );
  } catch (err) {
    console.error(err);
    showModal(
      'error',
      'Error al guardar solicitud',
      err.message || 'Ocurrió un error al guardar la solicitud.'
    );
  }
};



const handleGuardarArchivoGeneral = async () => {
  try {
    if (!file || !excelData) {
      throw new Error('No hay archivo ni datos procesados.');
    }

    const token = localStorage.getItem('token');
    const userId = Number(localStorage.getItem('userId')) || null;

    // Hojas que realmente se guardaron como solicitudes
    const savedSheetNames = Object.keys(savedSheets).filter(
      name => savedSheets[name]?.saved && savedSheets[name]?.solicitudId
    );

    const solicitudIds = savedSheetNames.map(
      name => savedSheets[name].solicitudId
    );

    if (!solicitudIds.length) {
      showModal(
        'error',
        'Sin solicitudes',
        'Debes guardar al menos una hoja como solicitud antes de registrar el archivo.'
      );
      return;
    }

    const totalSolicitudes = savedSheetNames.length;
    const totalMateriales = savedSheetNames.reduce(
      (acc, name) => acc + (excelData[name]?.data?.length || 0),
      0
    );

    const payload = {
      api_info: {
        name: 'Materiales T4 API',
        source_file: file.name,
        user_id: userId,
        total_sheets: totalSolicitudes,
        extraction_date: new Date().toISOString(),
      },
      summary: {
        total_materials: totalMateriales,
      },
      solicitudIds,
    };

    const res = await fetch('http://localhost:3000/api/uploads/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Error ${res.status} al registrar el archivo: ${txt}`);
    }

    await res.json();

    showModal(
      'success',
      'Archivo registrado',
      `Se registró el archivo "${file.name}" con ${totalSolicitudes} solicitudes.`,
      () => navigate('/dashboard'),
      'Ir al Dashboard'
    );
  } catch (err) {
    console.error(err);
    showModal(
      'error',
      'Error al registrar archivo',
      err.message || 'Ocurrió un error al registrar el archivo.'
    );
  }
};



  const handleResetear = () => {
    showModal(
      'confirm',
      'Cargar Nuevo Archivo?',
      'Deseas cargar otro archivo? Se perderán todos los cambios no guardados.',
      () => {
        setFile(null);
        setExcelData(null);
        setActiveSheet(null);
        setSavingRowId(null);
        setSavedRows({});
        setProcessing(false);
        setCurrentStep(1);
      },
      'Cargar Nuevo',
      'Cancelar'
    );
  };

  // ===================== UI =====================
  const materialesActivos =
    activeSheet && excelData && excelData[activeSheet]
      ? excelData[activeSheet].data
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header reducido */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-800">Nueva Solicitud</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Cargar y revisar materiales de mantenimiento
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* PASO 1: cargar archivo */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Cargar Documento</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Sube el archivo Excel con las hojas de materiales T4.
              </p>
            </div>

            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 transition-all ${
                  dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 bg-gray-50'
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
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-800 mb-2">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-sm text-gray-600 mb-4">o haz clic para seleccionar</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-base truncate">{file.name}</p>
                      <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    disabled={processing}
                    className="p-2 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!processing ? (
                  <button
                    onClick={handleProcessar}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/30"
                  >
                    Procesar Excel
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Procesando Excel...</p>
                      <p className="text-sm text-gray-600">Extrayendo hojas y materiales</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 2: pestañas + tabla editable tipo screenshot */}
        {currentStep === 2 && excelData && activeSheet && (
  <div className="space-y-4">
    {/* Tabs de hojas */}
    <div className="flex border-b border-gray-300 overflow-x-auto">
      {Object.keys(excelData).map(sheetName => (
        <button
          key={sheetName}
          onClick={() => setActiveSheet(sheetName)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeSheet === sheetName
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {sheetName}{savedSheets[sheetName] ? ' ✓' : ''}
        </button>
      ))}
    </div>

    {/* Título */}
    <h2 className="text-lg font-semibold text-gray-800">
      {activeSheet} ({excelData[activeSheet].data.length} registros)
    </h2>

    {/* Tabla editable como tu HTML */}
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-left">
              <th className="px-4 py-3 text-sm font-semibold">Código</th>
 
              <th className="px-4 py-3 text-sm font-semibold">Descripción</th>
              <th className="px-4 py-3 text-sm font-semibold">Unidad</th>
              <th className="px-4 py-3 text-sm font-semibold">Cantidad Total</th>
            </tr>
          </thead>
          <tbody>
            {excelData[activeSheet].data.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.codigo}
                    onChange={e => handleCellEditSheet(activeSheet, row.id, 'codigo', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.descripcion}
                    onChange={e => handleCellEditSheet(activeSheet, row.id, 'descripcion', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.unidad}
                    onChange={e => handleCellEditSheet(activeSheet, row.id, 'unidad', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={row.cantidad_total}
                    onChange={e => handleCellEditSheet(activeSheet, row.id, 'cantidad_total', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Acciones del paso 2 */}
    <div className="flex justify-between mt-4 gap-3">
      <button
        onClick={handleResetear}
        className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Cargar otro archivo
      </button>

      <div className="flex gap-3">
        <button
          onClick={handleGuardarSolicitudHoja}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Guardar solicitud de esta hoja
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-orange-700"
        >
          Continuar al último paso
        </button>
      </div>
    </div>
  </div>
)}


        {/* PASO 3: guardar archivo general */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Guardar archivo</h2>
            <p className="text-sm text-gray-600 mb-4">
              En este paso se registra el archivo completo y el resumen de solicitudes generadas.
            </p>
            <button
              onClick={handleGuardarArchivoGeneral}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-500/30"
            >
              Guardar archivo
            </button>
          </div>
        )}
      </main>

      {/* Modal universal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 text-center mb-3">
              {modal.title}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              {modal.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {modal.cancelText && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold"
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                onClick={handleModalConfirm}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-semibold"
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
