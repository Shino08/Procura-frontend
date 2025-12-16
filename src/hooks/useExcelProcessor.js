// src/hooks/useExcelProcessor.js
import { useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Extrae TODOS los datos de cada fila sin filtrar columnas
 */
export const useExcelProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [archivoId, setArchivoId] = useState(null);

  /**
   * Busca fila de headers (soporta múltiples formatos)
   */
  const findHeaderRow = (rawData) => {
    const keywords = [
      'Item', 'Código', 'NO DE ITEM', 'DESCRIPCION', 'Descripción', 
      'UNIDAD', 'Cant', 'REQUISICIÓN', 'Observaciones', 'PRIORIDAD'
    ];
    
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      const matchCount = keywords.filter(kw => 
        row.some(cell => 
          cell && cell.toString().trim().toUpperCase().includes(kw.toUpperCase())
        )
      ).length;
      
      if (matchCount >= 2) return i;
    }
    
    return 0;
  };

  /**
   * Limpia nombre de columna para usarlo como key
   */
  const cleanColumnName = (name) => {
    if (!name) return '';
    return name
      .toString()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '_')
      .toLowerCase();
  };

  /**
   * Detecta si una fila es válida (tiene al menos un campo con contenido)
   */
  const isValidRow = (row) => {
    return row.some(cell => {
      const value = (cell || '').toString().trim();
      
      // Excluir headers repetidos, totales, líneas vacías
      if (!value) return false;
      if (value.length === 0) return false;
      if (/^-+$/.test(value)) return false;
      
      const excludePatterns = [
        /^(ITEM|CODIGO|DESCRIPCI[OÓ]N|UNIDAD|CANT|OBSERV)/i,
        /^(TOTAL|RESUMEN|SUMMARY|PROYECTO|REQUISICIÓN|PRIORIDAD)/i,
        /^(Unnamed:|FO-PROC)/i
      ];
      
      if (excludePatterns.some(p => p.test(value))) return false;
      
      return true;
    });
  };

  /**
   * Procesa el archivo Excel extrayendo TODAS las columnas
   */
  const processFile = async (file) => {
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

        // Crear mapeo de columnas limpio
        const columnKeys = headers.map((h, idx) => {
          const cleanName = cleanColumnName(h);
          return cleanName || `columna_${idx}`;
        });

        const formattedData = [];
        let rowId = 1;

        dataRows.forEach((row) => {
          if (!isValidRow(row)) return;

          // Crear objeto con TODAS las columnas
          const item = { id: rowId++ };
          
          columnKeys.forEach((key, idx) => {
            const value = (row[idx] || '').toString().trim();
            item[key] = value;
          });

          // Solo agregar si tiene al menos un campo relevante con datos
          const hasContent = Object.values(item).some(v => 
            v && v !== '' && v !== rowId - 1
          );
          
          if (hasContent) {
            formattedData.push(item);
          }
        });

        if (formattedData.length > 0) {
          extractedData[sheetName] = {
            name: sheetName,
            headers: headers.filter(h => h && h.toString().trim()), // headers originales
            columnKeys, // keys para mapeo
            total_records: formattedData.length,
            data: formattedData
          };
        }
      });

      setExcelData(extractedData);

      const firstSheet = Object.keys(extractedData)[0] || null;
      setActiveSheet(firstSheet);

      return {
        success: true,
        message: `${Object.keys(extractedData).length} hojas procesadas`,
        data: extractedData
      };
    } catch (err) {
      console.error('Error procesando Excel:', err);
      return {
        success: false,
        message: err.message || 'Error al procesar archivo'
      };
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Editar celda de una hoja específica
   */
  const updateCell = (sheetName, id, field, value) => {
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

  /**
   * Resetear todo
   */
  const reset = () => {
    setExcelData(null);
    setActiveSheet(null);
    setProcessing(false);
    setArchivoId(null);
  };

  return {
    processing,
    excelData,
    activeSheet,
    archivoId,
    setActiveSheet,
    setArchivoId,
    processFile,
    updateCell,
    reset
  };
};
