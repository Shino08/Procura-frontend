import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { API_URL } from '../services';

export const NuevaSolicitudPage = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [excelData, setExcelData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [savedSheets, setSavedSheets] = useState({});
  const [archivoId, setArchivoId] = useState(null);

  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '', onConfirm: null });

  const showModal = (type, title, message, onConfirm = null) => {
    setModal({ show: true, type, title, message, onConfirm });
  };

  const closeModal = () => setModal({ show: false, type: '', title: '', message: '', onConfirm: null });

  // ============ EXTRACTOR UNIVERSAL ============
  const findHeaderRow = (rawData) => {
    const keywords = ['Item', 'Código', 'NO DE ITEM', 'DESCRIPCION', 'Descripción', 'UNIDAD', 'Cant', 'REQUISICIÓN', 'Observaciones', 'PRIORIDAD'];
    
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      const matchCount = keywords.filter(kw => 
        row.some(cell => cell && cell.toString().trim().toUpperCase().includes(kw.toUpperCase()))
      ).length;
      
      if (matchCount >= 2) return i;
    }
    return 0;
  };

  const cleanColumnName = (name) => {
    if (!name) return '';
    return name
      .toString()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '_')
      .toLowerCase();
  };

  const isValidRow = (row) => {
    return row.some(cell => {
      const value = (cell || '').toString().trim();
      if (!value || value.length === 0 || /^-+$/.test(value)) return false;
      
      const excludePatterns = [
        /^(ITEM|CODIGO|DESCRIPCI[OÓ]N|UNIDAD|CANT|OBSERV)/i,
        /^(TOTAL|RESUMEN|SUMMARY|PROYECTO|REQUISICIÓN|PRIORIDAD)/i,
        /^(Unnamed:|FO-PROC|ASOCIACION)/i
      ];
      
      return !excludePatterns.some(p => p.test(value));
    });
  };

  const handleProcessar = async () => {
    if (!file) {
      showModal('error', 'Sin archivo', 'Selecciona un archivo primero.');
      return;
    }

    try {
      setProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const extractedData = {};

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false
        });

        if (rawData.length === 0) return;

        const headerRow = findHeaderRow(rawData);
        const headers = rawData[headerRow] || [];
        const dataRows = rawData.slice(headerRow + 1);

        const columnKeys = headers.map((h, idx) => cleanColumnName(h) || `columna_${idx}`);

        const formattedData = [];
        let rowId = 1;

        dataRows.forEach((row) => {
          if (!isValidRow(row)) return;

          const item = { id: rowId++ };
          columnKeys.forEach((key, idx) => {
            item[key] = (row[idx] || '').toString().trim();
          });

          const hasContent = Object.values(item).some(v => v && v !== '' && v !== String(rowId - 1));
          if (hasContent) formattedData.push(item);
        });

        if (formattedData.length > 0) {
          extractedData[sheetName] = {
            nombre: sheetName,
            headers: headers.filter(h => h && h.toString().trim()),
            columnKeys,
            data: formattedData
          };
        }
      });

      setExcelData(extractedData);
      const firstSheet = Object.keys(extractedData)[0] || null;
      setActiveSheet(firstSheet);
      setCurrentStep(2);

      showModal('success', '¡Procesado!', `${Object.keys(extractedData).length} hojas procesadas`);
    } catch (err) {
      console.error(err);
      showModal('error', 'Error', err.message || 'Error al procesar archivo');
    } finally {
      setProcessing(false);
    }
  };

  // ============ ELIMINAR FILA ============
  const handleEliminarFila = (sheetName, id) => {
    showModal('confirm', 'Eliminar fila', '¿Seguro que deseas eliminar esta fila?', () => {
      setExcelData((prev) => ({
        ...prev,
        [sheetName]: {
          ...prev[sheetName],
          data: prev[sheetName].data.filter((row) => row.id !== id),
        },
      }));
    });
  };

  // ============ GUARDAR SOLICITUD POR HOJA ============
  const handleGuardarSolicitudHoja = async () => {
    if (!excelData || !activeSheet) return;

    const sheet = excelData[activeSheet];
    if (!sheet?.data?.length) {
      return showModal('error', 'Sin datos', 'La hoja no tiene materiales.');
    }

    try {
      const token = localStorage.getItem('token');
      const userIdRaw = localStorage.getItem('userId') ?? localStorage.getItem('id');
      const userId = Number(userIdRaw);

      if (!userId || Number.isNaN(userId)) {
        throw new Error('No hay userId válido en localStorage (userId/id).');
      }

      const data = sheet.data.map(({ id, ...rest }) => rest);

      const payload = {
        userId,
        solicitud: {
          nombre: sheet.nombre ?? 'Sin nombre',
          descripcion: `Solicitud generada desde ${file?.name ?? 'archivo'} - Hoja ${sheet.nombre ?? activeSheet}`,
        },
        data,
        archivoId: archivoId ?? null,
        totalHojas: Object.keys(excelData).length,
      };

      let res;

      if (!archivoId) {
        if (!file) throw new Error('No hay archivo seleccionado para la primera hoja.');

        const fd = new FormData();
        fd.append('archivo', file);
        fd.append('payload', JSON.stringify(payload));

        res = await fetch(`${API_URL}/solicitudes`, {
          method: 'POST',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
          body: fd,
        });
      } else {
        res = await fetch(`${API_URL}/solicitudes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status} al guardar solicitud`);
      }

      const out = await res.json();

      if (!archivoId && out.archivoId) {
        setArchivoId(out.archivoId);
      }

      setSavedSheets((prev) => ({
        ...prev,
        [activeSheet]: { saved: true, solicitudId: out.solicitudId },
      }));

      showModal('success', 'Guardado', `Hoja "${sheet.nombre ?? activeSheet}" guardada.`);
    } catch (e) {
      showModal('error', 'Error', e.message);
    }
  };

  const handleCellEditSheet = (sheetName, id, field, value) => {
    setExcelData((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        data: prev[sheetName].data.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        ),
      },
    }));
  };

  const handleResetear = () => {
    showModal('confirm', 'Cargar nuevo archivo?', 'Se perderán cambios no guardados.', () => {
      setFile(null);
      setExcelData(null);
      setActiveSheet(null);
      setSavedSheets({});
      setArchivoId(null);
      setCurrentStep(1);
    });
  };

  const handleFinalizar = () => {
    const savedCount = Object.keys(savedSheets).filter(name => savedSheets[name]?.saved).length;
    if (savedCount === 0) {
      return showModal('error', 'Sin solicitudes', 'Guarda al menos una hoja.');
    }
    showModal('success', 'Completado', `Se guardaron ${savedCount} solicitudes.`, () => navigate('/dashboard'));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
      } else {
        showModal('error', 'Formato Inválido', 'Selecciona un archivo Excel válido.');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        showModal('error', 'Formato Inválido', 'Selecciona un archivo Excel válido.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Nueva Solicitud</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Cargar Documento</h2>
              <p className="text-sm sm:text-base text-gray-600">Sube el archivo Excel con las hojas de materiales.</p>
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
                <input type="file" id="file-upload" onChange={handleChange} accept=".xlsx,.xls" className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-800 mb-2">Arrastra y suelta tu archivo aquí</p>
                    <p className="text-sm text-gray-600 mb-4">o haz clic para seleccionar</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-base truncate">{file.name}</p>
                      <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} disabled={processing} className="p-2 hover:bg-orange-200 rounded-lg disabled:opacity-50">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!processing ? (
                  <button onClick={handleProcessar} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl shadow-lg">
                    Procesar Excel
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Procesando...</p>
                      <p className="text-sm text-gray-600">Extrayendo datos</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && excelData && activeSheet && (
          <div className="space-y-4">
            <div className="flex border-b border-gray-300 overflow-x-auto">
              {Object.keys(excelData).map((sheetName) => (
                <button
                  key={sheetName}
                  onClick={() => setActiveSheet(sheetName)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeSheet === sheetName ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {sheetName}{savedSheets[sheetName]?.saved ? ' ✓' : ''}
                </button>
              ))}
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              {activeSheet} ({excelData[activeSheet].data.length} registros)
            </h2>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-left sticky top-0">
                      <th className="px-4 py-3 text-sm font-semibold whitespace-nowrap">Acciones</th>
                      {excelData[activeSheet].headers.map((header, idx) => (
                        <th key={idx} className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData[activeSheet].data.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleEliminarFila(activeSheet, row.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar fila"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                        {excelData[activeSheet].columnKeys.map((key, idx) => (
                          <td key={idx} className="px-4 py-2">
                            <input
                              type="text"
                              value={row[key] || ''}
                              onChange={(e) => handleCellEditSheet(activeSheet, row.id, key, e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button onClick={handleResetear} className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cargar otro archivo
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleGuardarSolicitudHoja}
                  disabled={savedSheets[activeSheet]?.saved}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savedSheets[activeSheet]?.saved ? 'Hoja guardada ✓' : 'Guardar solicitud de esta hoja'}
                </button>
                <button onClick={handleFinalizar} className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700">
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 text-center mb-3">{modal.title}</h3>
            <p className="text-sm text-gray-600 text-center mb-6">{modal.message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {modal.type === 'confirm' && (
                <button onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold">
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-semibold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
