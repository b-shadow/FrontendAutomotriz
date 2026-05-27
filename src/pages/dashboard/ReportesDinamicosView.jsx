import React, { useState } from 'react';
import { Card } from '../../components/ui';
import { 
  Bot, 
  Send, 
  Loader2, 
  Download,
  Database,
  BarChart2,
  Table as TableIcon,
  Sparkles,
  TrendingUp,
  Wallet,
  CalendarCheck,
  Users,
  Mic,
  MicOff,
  Filter,
  Calendar,
  LayoutGrid,
  X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Plot from 'react-plotly.js';
import * as XLSX from 'xlsx';
import ExploradorDatosView from './ExploradorDatosView';

export const ReportesDinamicosView = ({ tenantSlug }) => {
  const [mainMode, setMainMode] = useState('clasico'); // 'clasico' or 'ia'
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'data'
  
  // Visual Builder State
  const [vbEntity, setVbEntity] = useState('vehículos');
  const [vbDateRange, setVbDateRange] = useState('este mes');
  const [vbGroupBy, setVbGroupBy] = useState('ninguno');
  const [vbFormat, setVbFormat] = useState('tabla');

  const quickReports = [
    {
      id: 'ingresos_mes',
      title: 'Ingresos del Mes',
      description: 'Total facturado por día',
      icon: <Wallet className="text-emerald-500" size={24} />,
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5',
      borderColor: 'border-emerald-200 dark:border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
      prompt: '¿Cuáles son los ingresos totales agrupados por día de este mes en un gráfico de barras?'
    },
    {
      id: 'servicios_rentables',
      title: 'Servicios Rentables',
      description: 'Top 5 que más generan',
      icon: <TrendingUp className="text-blue-500" size={24} />,
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5',
      borderColor: 'border-blue-200 dark:border-blue-500/20',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500/50',
      prompt: '¿Cuáles son los servicios más rentables este mes?'
    },
    {
      id: 'citas_estado',
      title: 'Estado de Citas',
      description: 'Completadas vs Canceladas',
      icon: <CalendarCheck className="text-purple-500" size={24} />,
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5',
      borderColor: 'border-purple-200 dark:border-purple-500/20',
      hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-500/50',
      prompt: 'Muéstrame la cantidad de citas agrupadas por estado en un gráfico circular'
    },
    {
      id: 'top_clientes',
      title: 'Mejores Clientes',
      description: 'Clientes con más visitas',
      icon: <Users className="text-amber-500" size={24} />,
      bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5',
      borderColor: 'border-amber-200 dark:border-amber-500/20',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/50',
      prompt: 'Lista los 5 clientes con más citas finalizadas en el sistema'
    }
  ];

  const triggerAsk = async (textToAsk) => {
    if (!textToAsk.trim()) return;

    setPrompt(textToAsk);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/reportes-ia/ask/`, {
        prompt: textToAsk
      });
      
      setResult(res.data);
      // Auto-switch to data view if no chart was generated
      if (!res.data.plotly_fig && res.data.data && res.data.data.length > 0) {
        setViewMode('data');
      } else {
        setViewMode('chart');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud con la IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    triggerAsk(prompt);
  };

  const handleExport = () => {
    if (!result || !result.data || result.data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReporteIA");
    XLSX.writeFile(wb, `Reporte_IA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const hasData = result && result.data && result.data.length > 0;
  const hasChart = result && result.plotly_fig;

  const handleVisualGenerate = () => {
    let p = `Muéstrame los ${vbEntity}`;
    if (vbEntity === 'ingresos') p = `Muéstrame los ingresos`;
    
    if (vbDateRange === 'este mes') p += ' de este mes';
    else if (vbDateRange === 'mes pasado') p += ' del mes pasado';
    else if (vbDateRange === 'este año') p += ' de este año';
    
    if (vbGroupBy !== 'ninguno') {
      p += ` agrupados por ${vbGroupBy}`;
    } else {
      p += ` con todos los detalles`;
    }
    
    if (vbFormat === 'barras') p += ' en un gráfico de barras';
    else if (vbFormat === 'circular') p += ' en un gráfico circular';
    
    triggerAsk(p);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Mode Toggle */}
      <div className="flex bg-neutral-100 dark:bg-carbon-800 p-1.5 rounded-2xl w-fit mx-auto mb-8">
        <button 
          onClick={() => setMainMode('clasico')} 
          className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${mainMode === 'clasico' ? 'bg-white shadow-md dark:bg-carbon-900 text-emerald-500 scale-105' : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'}`}
        >
          <BarChart2 size={20} />
          Reportes Personalizados
        </button>
        <button 
          onClick={() => setMainMode('ia')} 
          className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${mainMode === 'ia' ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/30 scale-105' : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'}`}
        >
          <Bot size={20} />
          Reportes con IA
        </button>
      </div>

      {mainMode === 'clasico' ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <ExploradorDatosView tenantSlug={tenantSlug} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight flex items-center gap-2">
                <Sparkles className="text-primary-500" size={32} /> Reportes con IA
              </h1>
              <p className="text-carbon-500 dark:text-neutral-400 text-lg">
                Habla con tu base de datos de manera natural usando inteligencia artificial.
              </p>
            </div>
          </div>

      {/* Input Area (Omnibox) */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <form onSubmit={handleAsk} className="relative flex items-center bg-white dark:bg-carbon-900 rounded-3xl p-2 shadow-xl border border-neutral-100 dark:border-white/[0.05]">
          <div className="pl-4">
            <Bot className="text-primary-500" size={28} />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="O escribe tu propia pregunta... Ej: Muestra los ingresos por mes"
            className="w-full py-4 px-4 bg-transparent text-carbon-900 dark:text-white placeholder:text-carbon-400 dark:placeholder:text-neutral-600 outline-none text-lg"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="mr-2 p-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-carbon-200 dark:disabled:bg-carbon-800 text-white rounded-2xl transition-all shadow-md flex items-center justify-center min-w-[56px]"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl animate-in fade-in flex items-center gap-3 shadow-sm">
          <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full">
            <Database size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Results Area */}
      {result ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Controles de vista y exportación */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-white dark:bg-carbon-900 p-1 rounded-2xl border border-neutral-200 dark:border-white/[0.06] shadow-sm">
              <button
                onClick={() => setViewMode('chart')}
                disabled={!hasChart}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  viewMode === 'chart' 
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300 shadow-sm' 
                    : 'text-carbon-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                } ${!hasChart && 'opacity-50 cursor-not-allowed'}`}
              >
                <BarChart2 size={18} /> Gráfico AI
              </button>
              <button
                onClick={() => setViewMode('data')}
                disabled={!hasData}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  viewMode === 'data' 
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300 shadow-sm' 
                    : 'text-carbon-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                } ${!hasData && 'opacity-50 cursor-not-allowed'}`}
              >
                <TableIcon size={18} /> Datos
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={!hasData}
              className="flex items-center gap-2 px-6 py-2.5 bg-carbon-900 hover:bg-carbon-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-carbon-900 rounded-xl transition-all font-semibold shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Download size={18} /> Exportar Excel
            </button>
          </div>

          <Card className="p-2 sm:p-6 bg-white dark:bg-carbon-900 shadow-xl border-neutral-200 dark:border-white/[0.05] rounded-[2rem] overflow-hidden">
            {viewMode === 'chart' && hasChart && (
              <div className="w-full overflow-x-auto flex justify-center py-4">
                <Plot
                  data={result.plotly_fig.data}
                  layout={{
                    ...result.plotly_fig.layout,
                    autosize: true,
                    margin: { t: 40, r: 20, l: 50, b: 50 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { family: 'Inter, sans-serif', color: '#888' },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-[450px]"
                />
              </div>
            )}

            {viewMode === 'data' && hasData && (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/[0.06]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50 dark:bg-carbon-950/50 sticky top-0">
                    <tr>
                      {Object.keys(result.data[0]).map((key) => (
                        <th key={key} className="p-4 text-xs font-bold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-white/[0.06]">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-100 dark:border-white/[0.02] hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="p-4 text-sm font-medium text-carbon-700 dark:text-neutral-300">
                            {val !== null && val !== undefined ? val.toString() : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!hasChart && !hasData && (
              <div className="flex flex-col items-center justify-center py-16 text-carbon-400 dark:text-neutral-500">
                <Database size={56} className="mb-4 opacity-30 text-carbon-300 dark:text-carbon-700" />
                <p className="text-lg font-medium">No se encontraron datos para esta consulta.</p>
              </div>
            )}
          </Card>

          {/* Mostrar SQL en modo debug */}
          <div className="bg-neutral-50 dark:bg-carbon-950/50 rounded-2xl border border-neutral-200 dark:border-white/[0.05] p-4">
            <details className="group">
              <summary className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 cursor-pointer list-none flex items-center gap-2">
                <span className="bg-neutral-200 dark:bg-carbon-800 p-1 rounded-md group-open:rotate-90 transition-transform">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
                Ver Consulta SQL Generada (Debug)
              </summary>
              <pre className="mt-4 p-4 bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.05] rounded-xl text-xs text-primary-600 dark:text-primary-400 overflow-x-auto font-mono shadow-inner">
                {result.sql}
              </pre>
            </details>
          </div>

        </div>
      ) : (
        /* Empty State */
        !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full"></div>
              <div className="relative bg-white dark:bg-carbon-900 p-6 rounded-[2rem] shadow-xl border border-neutral-100 dark:border-white/[0.05]">
                <BarChart2 size={64} className="text-primary-500" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-carbon-900 dark:text-white mb-2">¿Qué quieres analizar hoy?</h2>
            <p className="text-carbon-500 dark:text-neutral-400 text-center max-w-md">
              Selecciona uno de los reportes rápidos de arriba o escribe tu propia consulta para explorar los datos de tu empresa con el poder de la IA.
            </p>
          </div>
        )
      )}
      </div>
      )}
    </div>
  );
};
