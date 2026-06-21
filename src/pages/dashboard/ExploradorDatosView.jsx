import React, { useState, useEffect } from 'react';
import { Database, Download, CheckSquare, Square, Loader2, Plus, X, Filter, BarChart2, Table as TableIcon } from 'lucide-react';
import apiClient from '../../services/apiClient';
import * as XLSX from 'xlsx';
import Plot from 'react-plotly.js';
import { jsPDF } from 'jspdf';

const VISTAS = {
  vehiculos_citas: {
    label: "🚗 Vehículos con sus Citas",
    columns: ["vehiculo__placa", "vehiculo__marca", "vehiculo__modelo", "estado", "fecha_hora_inicio_programada", "motivo_visita"]
  },
  clientes_ventas: {
    label: "🛒 Ventas Rápidas (Mostrador)",
    columns: ["id", "vendedor__nombres", "estado", "total", "metodo_pago", "created_at"]
  },
  vehiculos: {
    label: "🚗 Solo Vehículos",
    columns: ["id", "placa", "marca", "modelo", "anio", "color", "kilometraje_actual"]
  },
  citas: {
    label: "📅 Solo Citas",
    columns: ["id", "estado", "fecha_hora_inicio_programada", "motivo_visita", "canal_origen"]
  },
  usuarios: {
    label: "👥 Usuarios",
    columns: ["id", "email", "nombres", "apellidos", "is_active", "rol__nombre"]
  },
  compras: {
    label: "🏢 Compras",
    columns: ["id", "estado", "total_compra", "fecha_esperada_recepcion", "created_at"]
  }
};

const ExploradorDatosView = ({ tenantSlug }) => {
  const [vista, setVista] = useState('vehiculos_citas');
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState(VISTAS['vehiculos_citas'].columns);
  
  // Array de filtros: { columna: string, valor: string }
  const [filtros, setFiltros] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // States for chart/table options
  const [viewMode, setViewMode] = useState('tabla'); // 'tabla' or 'grafico'
  const [tipoGrafico, setTipoGrafico] = useState('bar'); // 'bar', 'line', 'pie'
  const [ejeX, setEjeX] = useState('');
  const [ejeY, setEjeY] = useState('');

  // Keep X and Y axis in sync with selected columns
  useEffect(() => {
    if (columnasSeleccionadas.length > 0) {
      if (!columnasSeleccionadas.includes(ejeX)) {
        setEjeX(columnasSeleccionadas[0]);
      }
      if (!columnasSeleccionadas.includes(ejeY)) {
        setEjeY(columnasSeleccionadas[1] || columnasSeleccionadas[0]);
      }
    }
  }, [columnasSeleccionadas, ejeX, ejeY]);

  const handleVistaChange = (e) => {
    const nuevaVista = e.target.value;
    setVista(nuevaVista);
    setColumnasSeleccionadas(VISTAS[nuevaVista].columns);
    setFiltros([]); // Reset filters on view change
    setData(null);
  };

  const toggleColumna = (col) => {
    if (columnasSeleccionadas.includes(col)) {
      setColumnasSeleccionadas(columnasSeleccionadas.filter(c => c !== col));
    } else {
      setColumnasSeleccionadas([...columnasSeleccionadas, col]);
    }
  };

  const addFiltro = () => {
    setFiltros([...filtros, { columna: VISTAS[vista].columns[0], valor: "" }]);
  };

  const updateFiltro = (index, field, value) => {
    const nuevosFiltros = [...filtros];
    nuevosFiltros[index][field] = value;
    setFiltros(nuevosFiltros);
  };

  const removeFiltro = (index) => {
    setFiltros(filtros.filter((_, i) => i !== index));
  };

  const generarReporte = async () => {
    if (columnasSeleccionadas.length === 0) {
      alert("Selecciona al menos una columna");
      return;
    }
    setLoading(true);
    
    // Procesar filtros para el backend
    const filtroParams = {};
    filtros.forEach(f => {
      if (f.valor.trim() !== '') {
        // Si hay comas, lo convertimos en array para que el backend use __in
        if (f.valor.includes(',')) {
          filtroParams[f.columna] = f.valor.split(',').map(v => v.trim()).filter(v => v);
        } else {
          filtroParams[f.columna] = f.valor.trim();
        }
      }
    });

    try {
      const colString = columnasSeleccionadas.join(',');
      const res = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/reportes/explorador_datos/`, {
        params: {
          vista: vista,
          columnas: colString,
          filtros: JSON.stringify(filtroParams)
        }
      });
      setData(res.data.resultados);
    } catch (err) {
      console.error(err);
      alert("Error al obtener los datos");
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildTableHtml = (rows) => {
    if (!rows?.length) return '<table><tr><td>Sin datos</td></tr></table>';
    const keys = Object.keys(rows[0]);
    let html = '<table border="1" cellspacing="0" cellpadding="6"><thead><tr>';
    keys.forEach((k) => { html += `<th>${String(k)}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((r) => {
      html += '<tr>';
      keys.forEach((k) => { html += `<td>${r[k] ?? '-'}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  const handleExport = (format) => {
    const rows = data || [];
    if (!rows.length) return;
    const baseName = `Reporte_${vista}_${new Date().toISOString().split('T')[0]}`;
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');
      XLSX.writeFile(wb, `${baseName}.xlsx`);
      return;
    }
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`);
      return;
    }
    const tableHtml = buildTableHtml(rows);
    if (format === 'html') {
      const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${tableHtml}</body></html>`;
      downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8;' }), `${baseName}.html`);
      return;
    }
    if (format === 'word') {
      const doc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`;
      downloadBlob(new Blob([doc], { type: 'application/msword' }), `${baseName}.doc`);
      return;
    }
    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });
      const keys = Object.keys(rows[0] || {});
      let y = 12;
      doc.setFontSize(12);
      doc.text(baseName, 14, y);
      y += 8;
      doc.setFontSize(8);
      doc.text(keys.join(' | '), 14, y);
      y += 6;
      rows.forEach((row) => {
        const line = keys.map((k) => String(row[k] ?? '-')).join(' | ');
        const wrapped = doc.splitTextToSize(line, 270);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4 + 1;
        if (y > 190) {
          doc.addPage();
          y = 12;
        }
      });
      doc.save(`${baseName}.pdf`);
    }
  };

  const exportOptions = ['pdf', 'word', 'html', 'csv', 'excel'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-carbon-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-500/10 p-2 rounded-xl">
            <Database className="text-primary-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Reportes Personalizados</h2>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Diseña tus propios reportes combinando tablas, columnas y filtros a tu medida (SQL Guiado).</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* PASO 1 */}
          <div>
            <label className="block text-sm font-semibold text-carbon-600 dark:text-neutral-300 mb-2">1. Selecciona la Vista (Tablas Relacionadas)</label>
            <select 
              value={vista} 
              onChange={handleVistaChange}
              className="w-full max-w-sm bg-neutral-50 dark:bg-carbon-800 border border-neutral-200 dark:border-carbon-700 rounded-xl px-4 py-3 text-carbon-900 dark:text-white outline-none cursor-pointer"
            >
              {Object.keys(VISTAS).map(k => (
                <option key={k} value={k}>{VISTAS[k].label}</option>
              ))}
            </select>
          </div>

          {/* PASO 2 */}
          <div>
            <label className="block text-sm font-semibold text-carbon-600 dark:text-neutral-300 mb-2">2. Selecciona las Columnas a Mostrar</label>
            <div className="flex flex-wrap gap-3">
              {VISTAS[vista].columns.map(col => {
                const isSelected = columnasSeleccionadas.includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => toggleColumna(col)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'border-neutral-200 dark:border-carbon-700 text-carbon-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-carbon-800'}`}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    <span className="truncate max-w-[150px]" title={col}>{col}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* PASO 3 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-carbon-600 dark:text-neutral-300">
                3. Filtros (WHERE)
              </label>
              <button 
                onClick={addFiltro}
                className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm font-semibold bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus size={16} /> Añadir Filtro
              </button>
            </div>
            
            {filtros.length === 0 ? (
              <div className="text-sm text-carbon-400 dark:text-neutral-500 italic p-4 bg-neutral-50 dark:bg-carbon-800 rounded-xl border border-dashed border-neutral-200 dark:border-carbon-700">
                No hay filtros aplicados. Se mostrarán todos los registros.
              </div>
            ) : (
              <div className="space-y-3">
                {filtros.map((filtro, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-neutral-50 dark:bg-carbon-800 p-3 rounded-xl border border-neutral-100 dark:border-carbon-700">
                    <div className="flex items-center gap-2 shrink-0">
                      <Filter size={18} className="text-carbon-400 hidden sm:block" />
                      <select 
                        value={filtro.columna} 
                        onChange={(e) => updateFiltro(idx, 'columna', e.target.value)}
                        className="w-full bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-600 rounded-lg px-3 py-2 text-sm text-carbon-900 dark:text-white outline-none"
                        style={{ width: '240px' }}
                      >
                        {VISTAS[vista].columns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-0">
                      <input 
                        type="text" 
                        value={filtro.valor}
                        onChange={(e) => updateFiltro(idx, 'valor', e.target.value)}
                        placeholder="Valor (Usa comas para múltiples: val1, val2)"
                        className="w-full bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-600 rounded-lg px-3 py-2 text-sm text-carbon-900 dark:text-white placeholder:text-carbon-400 dark:placeholder:text-carbon-500 outline-none"
                      />
                    </div>

                    <button 
                      onClick={() => removeFiltro(idx)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors shrink-0 self-end sm:self-auto"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end border-t border-neutral-100 dark:border-white/[0.05]">
            <button 
              onClick={generarReporte}
              disabled={loading || columnasSeleccionadas.length === 0}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              Generar Consulta
            </button>
          </div>
        </div>
      </div>

      {data && (
        <div className="bg-white dark:bg-carbon-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-white/[0.05] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex bg-neutral-100 dark:bg-carbon-800 p-1 rounded-2xl border border-neutral-200 dark:border-white/[0.06] shadow-inner">
              <button
                onClick={() => setViewMode('tabla')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  viewMode === 'tabla'
                    ? 'bg-white dark:bg-carbon-900 text-primary-500 shadow-sm'
                    : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'
                }`}
              >
                <TableIcon size={18} /> Tabla
              </button>
              <button
                onClick={() => setViewMode('grafico')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  viewMode === 'grafico'
                    ? 'bg-white dark:bg-carbon-900 text-primary-500 shadow-sm'
                    : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'
                }`}
              >
                <BarChart2 size={18} /> Gráfico
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-carbon-500 dark:text-neutral-400">{data.length} registros</span>
              <div className="flex flex-wrap items-center gap-2">
                {exportOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleExport(opt)}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Download size={16} /> {opt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === 'grafico' ? (
            <div className="space-y-6">
              {/* Controles del Gráfico en la parte superior izquierda / superior general */}
              <div className="flex flex-wrap items-center gap-4 bg-neutral-50 dark:bg-carbon-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-carbon-700">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-carbon-500 dark:text-neutral-400">Tipo de Gráfico</label>
                  <select 
                    value={tipoGrafico} 
                    onChange={(e) => setTipoGrafico(e.target.value)}
                    className="bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-700 rounded-xl px-3 py-1.5 text-sm text-carbon-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="bar">📊 Gráfico de Barras</option>
                    <option value="line">📈 Gráfico de Líneas</option>
                    <option value="pie">🍕 Gráfico Circular</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-carbon-500 dark:text-neutral-400">Eje X (Categoría)</label>
                  <select 
                    value={ejeX} 
                    onChange={(e) => setEjeX(e.target.value)}
                    className="bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-700 rounded-xl px-3 py-1.5 text-sm text-carbon-900 dark:text-white outline-none cursor-pointer"
                  >
                    {columnasSeleccionadas.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-carbon-500 dark:text-neutral-400">Eje Y (Valores/Métrica)</label>
                  <select 
                    value={ejeY} 
                    onChange={(e) => setEjeY(e.target.value)}
                    className="bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-700 rounded-xl px-3 py-1.5 text-sm text-carbon-900 dark:text-white outline-none cursor-pointer"
                  >
                    {columnasSeleccionadas.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Render del Gráfico */}
              <div className="w-full overflow-x-auto flex justify-center py-4 bg-white dark:bg-carbon-900 rounded-2xl border border-neutral-100 dark:border-carbon-800">
                {data.length > 0 ? (
                  <Plot
                    data={(() => {
                      const yValues = data.map(row => {
                        const val = row[ejeY];
                        const parsed = parseFloat(val);
                        return isNaN(parsed) ? (val !== null && val !== undefined ? 1 : 0) : parsed;
                      });
                      const xValues = data.map(row => String(row[ejeX] ?? '-'));

                      if (tipoGrafico === 'pie') {
                        return [{
                          labels: xValues,
                          values: yValues,
                          type: 'pie',
                          hole: 0.4,
                          marker: {
                            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']
                          }
                        }];
                      }
                      if (tipoGrafico === 'line') {
                        return [{
                          x: xValues,
                          y: yValues,
                          type: 'scatter',
                          mode: 'lines+markers',
                          line: { color: '#3b82f6', width: 3 },
                          marker: { size: 8, color: '#2563eb' }
                        }];
                      }
                      // Default Bar
                      return [{
                        x: xValues,
                        y: yValues,
                        type: 'bar',
                        marker: { color: '#3b82f6' }
                      }];
                    })()}
                    layout={{
                      autosize: true,
                      margin: { t: 40, r: 20, l: 50, b: 50 },
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      font: { family: 'Inter, sans-serif', color: '#888' },
                      xaxis: { gridcolor: 'rgba(128,128,128,0.1)' },
                      yaxis: { gridcolor: 'rgba(128,128,128,0.1)' }
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    className="w-full h-[450px]"
                  />
                ) : (
                  <div className="text-center py-12 text-carbon-400">No hay datos para graficar.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-carbon-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-carbon-950 border-b border-neutral-200 dark:border-carbon-800">
                    {columnasSeleccionadas.map(col => (
                      <th key={col} className="p-3 text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 dark:border-carbon-800/50 hover:bg-neutral-50/50 dark:hover:bg-carbon-800/50">
                      {columnasSeleccionadas.map(col => (
                        <td key={col} className="p-3 text-sm text-carbon-700 dark:text-neutral-300 whitespace-nowrap">
                          {row[col] !== null ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={columnasSeleccionadas.length} className="p-8 text-center text-carbon-500 dark:text-neutral-400">
                        No se encontraron resultados para esta consulta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploradorDatosView;
