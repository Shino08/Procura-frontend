import { useEffect, useState } from "react";
import { API_URL } from "../services";
import { InlineSpinner } from "./LoadingSpinner";

export const EvolucionChart = ({ token }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/archivos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const result = await res.json();
          const archivos = Array.isArray(result?.archivos) ? result.archivos : [];

          // Agrupar solicitudes por mes
          const monthlyData = {};

          archivos.forEach((archivo) => {
            if (archivo.fechaCreacion) {
              const date = new Date(archivo.fechaCreacion);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { count: 0, month: monthKey };
              }
              monthlyData[monthKey].count += 1;
            }
          });

          // Convertir a array y ordenar por fecha
          const sortedData = Object.values(monthlyData)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Últimos 12 meses

          setData(sortedData);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="h-72 flex flex-col items-center justify-center gap-3">
        <InlineSpinner size="md" />
        <p className="text-sm text-gray-500">Cargando gráfico...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p className="text-gray-500 text-sm mb-2">No hay datos disponibles</p>
          <p className="text-gray-400 text-xs">Se necesitan solicitudes para mostrar el gráfico</p>
        </div>
      </div>
    );
  }

  // Calcular dimensiones para el gráfico
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const effectiveWidth = chartWidth - padding.left - padding.right;
  const effectiveHeight = chartHeight - padding.top - padding.bottom;

  // Generar puntos para la línea
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * effectiveWidth;
    const y = padding.top + effectiveHeight - (d.count / maxValue) * effectiveHeight;
    return { x, y, value: d.count, month: d.month };
  });

  // Generar path para el área
  const areaPath = points.length > 0
    ? `M ${points[0].x} ${padding.top + effectiveHeight} ` +
      points.map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x} ${padding.top + effectiveHeight} Z`
    : '';

  // Generar path para la línea
  const linePath = points.length > 0
    ? points.map(p => `L ${p.x} ${p.y}`).join(' ').replace('L', 'M')
    : '';

  // Meses abreviados
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <div className="relative h-72 w-full">
      <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(251, 146, 60)', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(254, 215, 170)', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>

        {/* Líneas de grid horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + effectiveHeight * ratio}
            x2={chartWidth - padding.right}
            y2={padding.top + effectiveHeight * ratio}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
        ))}

        {/* Etiquetas del eje Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={padding.top + effectiveHeight * ratio + 4}
            className="text-xs fill-gray-500"
            textAnchor="end"
          >
            {Math.round(maxValue * (1 - ratio))}
          </text>
        ))}

        {/* Área bajo la curva */}
        {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

        {/* Línea principal */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="rgb(251, 146, 60)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Puntos de datos */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke="rgb(251, 146, 60)"
              strokeWidth="2"
            />
            {/* Tooltip nativo con title */}
            <title>{point.month}: {point.value} solicitudes</title>
          </g>
        ))}

        {/* Etiquetas del eje X */}
        {points.map((point, i) => {
          const [year, month] = point.month.split('-');
          const label = monthNames[parseInt(month) - 1];
          return (
            <text
              key={i}
              x={point.x}
              y={chartHeight - padding.bottom + 20}
              className="text-xs fill-gray-600"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
