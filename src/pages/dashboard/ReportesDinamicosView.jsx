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
  X,
  LayoutGrid,
  Mic,
  MicOff
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { 
  BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-carbon-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
        <p className="font-bold text-carbon-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DynamicBeautifulChart = ({ data, prompt = "" }) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  if (columns.length < 2) return null;

  const xCol = columns[0];
  const yCols = columns.slice(1).filter(c => typeof data[0][c] === 'number' || !isNaN(parseFloat(data[0][c])));
  
  if (yCols.length === 0) return <p className="text-center text-carbon-500 py-10">Datos no numéricos, intenta verlos en formato tabla.</p>;

  const promptLower = prompt.toLowerCase();
  
  let isPie = false;
  if (promptLower.includes('circular') || promptLower.includes('pastel') || promptLower.includes('torta') || promptLower.includes('tarta')) {
    isPie = true;
  } else if (promptLower.includes('barra') || promptLower.includes('linea') || promptLower.includes('línea')) {
    isPie = false;
  } else {
    isPie = data.length <= 8 && yCols.length === 1 && typeof data[0][xCol] === 'string';
  }

  const isLine = promptLower.includes('linea') || promptLower.includes('línea') || promptLower.includes('tendencia');

  if (isPie && yCols.length > 0) {
    return (
      <ResponsiveContainer width="100%" height={450}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={150}
            paddingAngle={5}
            dataKey={yCols[0]}
            nameKey={xCol}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (isLine) {
    return (
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <defs>
            {yCols.map((col, index) => (
              <linearGradient key={`colorLine-${col}`} id={`colorLine-${col}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
          <XAxis 
            dataKey={xCol} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888', fontSize: 12 }} 
            angle={-45} 
            textAnchor="end"
            height={80}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
          <RechartsTooltip cursor={{ fill: 'rgba(150,150,150,0.05)' }} content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {yCols.map((col, index) => (
            <Line key={col} type="monotone" dataKey={col} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={450}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <defs>
          {yCols.map((col, index) => (
            <linearGradient key={`color-${col}`} id={`color-${col}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.9}/>
              <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.2}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
        <XAxis 
          dataKey={xCol} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#888', fontSize: 12 }} 
          angle={-45} 
          textAnchor="end"
          height={80}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
        <RechartsTooltip cursor={{ fill: 'rgba(150,150,150,0.05)' }} content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {yCols.map((col, index) => (
          <Bar key={col} dataKey={col} fill={`url(#color-${col})`} radius={[8, 8, 0, 0]} maxBarSize={60} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export const ReportesDinamicosView = ({ tenantSlug }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboardItems, setDashboardItems] = useState([]);
  const [globalError, setGlobalError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          
          stream.getTracks().forEach(track => track.stop());

          try {
            const response = await apiClient.post(
              `/api/${tenantSlug}/comunicacion-control/reportes-ia/transcribe_audio/`,
              formData,
              { headers: { 'Content-Type': undefined } }
            );
            if (response.data && response.data.text) {
              setPrompt(response.data.text);
            } else {
              setPrompt("");
            }
          } catch (error) {
            console.error("Error transcribing audio:", error);
            setPrompt("⚠️ Error al transcribir el audio.");
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error al acceder al micrófono:", err);
        setPrompt("⚠️ No se pudo acceder al micrófono.");
      }
    }
  };

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
    setGlobalError('');

    try {
      const res = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/reportes-ia/ask/`, {
        prompt: textToAsk
      });
      
      const hasData = res.data.data && res.data.data.length > 0;
      const defaultViewMode = (!res.data.plotly_fig && hasData) ? 'data' : 'chart';

      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        prompt: textToAsk,
        result: res.data,
        viewMode: defaultViewMode
      };

      setDashboardItems(prev => [newItem, ...prev]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      setGlobalError(err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud con la IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    triggerAsk(prompt);
  };

  const toggleViewMode = (id) => {
    setDashboardItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, viewMode: item.viewMode === 'chart' ? 'data' : 'chart' };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setDashboardItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setDashboardItems([]);
  };

  const handleExportItem = (item) => {
    if (!item.result || !item.result.data || item.result.data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(item.result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_IA_${item.prompt.substring(0, 20)}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportAll = () => {
    if (dashboardItems.length === 0) return;
    const wb = XLSX.utils.book_new();
    let hasData = false;
    
    dashboardItems.forEach((item, index) => {
      if (item.result && item.result.data && item.result.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(item.result.data);
        // Sanitizar el nombre de la hoja (max 31 chars)
        let sheetName = item.prompt.replace(/[\\/*?:[\]]/g, '').substring(0, 25);
        if (!sheetName) sheetName = `Reporte_${index + 1}`;
        
        // Manejar posibles nombres duplicados
        try {
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        } catch (e) {
          XLSX.utils.book_append_sheet(wb, ws, `${sheetName}_${index}`);
        }
        hasData = true;
      }
    });

    if (hasData) {
      XLSX.writeFile(wb, `Dashboard_IA_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleExportHTML = () => {
    if (dashboardItems.length === 0) return;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard de IA</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 2rem; color: #333; background-color: #f9fafb; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 3rem; }
          .card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
          .title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.75rem; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background-color: #f9fafb; color: #4b5563; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 2px solid #e5e7eb; }
          td { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 0.875rem; }
          tr:hover { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Inteligencia Artificial</h1>
            <p>Generado el ${new Date().toLocaleDateString()}</p>
          </div>
    `;

    dashboardItems.forEach(item => {
      if (item.result && item.result.data && item.result.data.length > 0) {
        htmlContent += `<div class="card"><div class="title">${item.prompt}</div><table><thead><tr>`;
        Object.keys(item.result.data[0]).forEach(key => {
          htmlContent += `<th>${key.replace(/_/g, ' ')}</th>`;
        });
        htmlContent += `</tr></thead><tbody>`;
        item.result.data.forEach(row => {
          htmlContent += `<tr>`;
          Object.values(row).forEach(val => {
             htmlContent += `<td>${val !== null && val !== undefined ? val : '-'}</td>`;
          });
          htmlContent += `</tr>`;
        });
        htmlContent += `</tbody></table></div>`;
      }
    });

    htmlContent += `</div></body></html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_IA_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Tarjetas de Reportes Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {quickReports.map((qr) => (
          <button
            key={qr.id}
            onClick={() => triggerAsk(qr.prompt)}
            disabled={loading}
            className={`text-left flex flex-col p-5 rounded-2xl border transition-all duration-300 ${qr.bgGradient} ${qr.borderColor} ${qr.hoverBorder} hover:shadow-lg hover:-translate-y-1 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
          >
            <div className="bg-white dark:bg-carbon-900 p-2.5 rounded-xl shadow-sm mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
              {qr.icon}
            </div>
            <h3 className="font-semibold text-carbon-900 dark:text-white mb-1">{qr.title}</h3>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">{qr.description}</p>
          </button>
        ))}
      </div>

      {/* Input Area (Omnibox) */}
      <div className="relative group print:hidden">
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
            type="button"
            onClick={toggleListening}
            className={`mr-2 p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center min-w-[56px] ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-neutral-100 dark:bg-carbon-800 hover:bg-neutral-200 dark:hover:bg-carbon-700 text-carbon-700 dark:text-neutral-300'
            }`}
            title={isListening ? "Detener grabación" : "Dictar por voz"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
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
      {globalError && (
        <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl animate-in fade-in flex items-center gap-3 shadow-sm">
          <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full">
            <Database size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="font-medium">{globalError}</p>
        </div>
      )}

      {/* Dashboard Tiles Canvas */}
      <div className={`relative bg-neutral-50/50 dark:bg-carbon-950/20 border border-neutral-200/60 dark:border-white/[0.04] rounded-[2.5rem] p-6 sm:p-8 min-h-[600px] transition-all duration-500 shadow-inner print:bg-white print:border-none print:shadow-none print:p-0 print:m-0 ${dashboardItems.length > 0 ? 'animate-in fade-in zoom-in-95' : ''}`}>
        
        {/* Canvas Header / Clear Button */}
        {dashboardItems.length > 0 && (
          <div className="absolute top-4 right-4 z-20 flex gap-3 print:hidden">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 dark:hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl transition-all shadow-sm font-semibold text-sm group"
                title="Descargar todo el dashboard"
              >
                <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Exportar Canvas
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.05] rounded-xl shadow-xl z-50 overflow-hidden">
                  <button onClick={() => { handleExportAll(); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-carbon-800 text-carbon-700 dark:text-neutral-300 transition-colors font-medium">Excel (.xlsx)</button>
                  <button onClick={handleExportHTML} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-carbon-800 text-carbon-700 dark:text-neutral-300 transition-colors border-t border-neutral-100 dark:border-white/[0.05] font-medium">Sitio Web (.html)</button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-carbon-800 text-carbon-700 dark:text-neutral-300 transition-colors border-t border-neutral-100 dark:border-white/[0.05] font-medium">Documento (.pdf)</button>
                </div>
              )}
            </div>
            
            <button 
              onClick={clearAll} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-all shadow-sm font-semibold text-sm group"
              title="Limpiar todo el lienzo"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform" /> Limpiar
            </button>
          </div>
        )}

        {dashboardItems.length > 0 ? (
          <div className={`grid gap-6 w-full h-full ${
            dashboardItems.length === 1 ? 'grid-cols-1' :
            dashboardItems.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
            dashboardItems.length === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
            dashboardItems.length === 4 ? 'grid-cols-1 lg:grid-cols-2' :
            'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {dashboardItems.map(item => {
              const hasData = item.result.data && item.result.data.length > 0;
              
              return (
                <Card key={item.id} className="flex flex-col p-0 bg-white dark:bg-carbon-900 overflow-hidden relative shadow-lg border border-neutral-200 dark:border-white/[0.06] rounded-3xl animate-in slide-in-from-bottom-4 duration-500 h-full">
                {/* Header Tile */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-white/[0.05] bg-neutral-50/50 dark:bg-carbon-950/50 print:bg-white print:border-b-2 print:border-neutral-200">
                  <h3 className="font-bold text-lg text-carbon-900 dark:text-white line-clamp-2 pr-4">{item.prompt}</h3>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-carbon-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors shrink-0 print:hidden">
                    <X size={20} />
                  </button>
                </div>

                {/* Controles del Tile */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white dark:bg-carbon-900 border-b border-neutral-50 dark:border-white/[0.02] print:hidden">
                  <div className="flex bg-neutral-100 dark:bg-carbon-800 p-1 rounded-xl">
                    <button
                      onClick={() => toggleViewMode(item.id)}
                      disabled={!hasData}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                        item.viewMode === 'chart' 
                          ? 'bg-white text-primary-600 dark:bg-carbon-700 dark:text-primary-400 shadow-sm' 
                          : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-white'
                      }`}
                    >
                      <BarChart2 size={16} /> Gráfico
                    </button>
                    <button
                      onClick={() => toggleViewMode(item.id)}
                      disabled={!hasData}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                        item.viewMode === 'data' 
                          ? 'bg-white text-primary-600 dark:bg-carbon-700 dark:text-primary-400 shadow-sm' 
                          : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-white'
                      }`}
                    >
                      <TableIcon size={16} /> Tabla
                    </button>
                  </div>
                  <button
                    onClick={() => handleExportItem(item)}
                    disabled={!hasData}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-carbon-700 dark:text-neutral-300 rounded-lg transition-all font-semibold text-xs disabled:opacity-50"
                  >
                    <Download size={16} /> Exportar
                  </button>
                </div>

                {/* Content Tile */}
                <div className="p-4 sm:p-5 flex-1 relative min-h-[350px]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
                  {item.viewMode === 'chart' ? (
                    <div className="w-full h-full flex justify-center items-center relative z-10">
                      {hasData ? (
                        <DynamicBeautifulChart data={item.result.data} prompt={item.prompt} />
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-carbon-500">No hay datos graficables o el reporte generó un error.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/[0.06] max-h-[400px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-neutral-50 dark:bg-carbon-950/50 sticky top-0 z-20">
                          <tr>
                            {hasData && Object.keys(item.result.data[0]).map((key) => (
                              <th key={key} className="p-3 text-xs font-bold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-white/[0.06] whitespace-nowrap">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hasData && item.result.data.map((row, i) => (
                            <tr key={i} className="border-b border-neutral-100 dark:border-white/[0.02] hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-colors">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="p-3 text-sm font-medium text-carbon-700 dark:text-neutral-300 whitespace-nowrap">
                                  {val !== null && val !== undefined ? val.toString() : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!hasData && (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-carbon-400 dark:text-neutral-500 absolute inset-0 z-10">
                      <Database size={48} className="mb-4 opacity-30 text-carbon-300 dark:text-carbon-700" />
                      <p className="text-sm font-medium">Sin datos para mostrar.</p>
                    </div>
                  )}
                </div>

                {/* Footer (SQL Debug) */}
                <div className="bg-neutral-50 dark:bg-carbon-950/30 border-t border-neutral-100 dark:border-white/[0.05] p-3 mt-auto print:hidden">
                  <details className="group">
                    <summary className="text-[11px] font-semibold text-carbon-400 dark:text-neutral-500 cursor-pointer list-none flex items-center gap-2 uppercase tracking-wider">
                      <span className="bg-neutral-200 dark:bg-carbon-800 p-0.5 rounded-sm group-open:rotate-90 transition-transform">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </span>
                      SQL Generado
                    </summary>
                    <pre className="mt-3 p-3 bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.05] rounded-lg text-[10px] text-primary-600 dark:text-primary-400 overflow-x-auto font-mono shadow-inner whitespace-pre-wrap break-all">
                      {item.result.sql}
                    </pre>
                  </details>
                </div>
              </Card>
            );
          })}
        </div>
      ) : !loading && !globalError ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000 h-full">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full"></div>
            <div className="relative bg-white dark:bg-carbon-900 p-6 rounded-[2rem] shadow-xl border border-neutral-100 dark:border-white/[0.05]">
              <LayoutGrid size={64} className="text-primary-500" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-carbon-900 dark:text-white mb-2">Constructor de Dashboards</h2>
          <p className="text-carbon-500 dark:text-neutral-400 text-center max-w-md">
            Haz preguntas para ir añadiendo "Tiles" a tu lienzo. Construye tu propio reporte en tiempo real.
          </p>
        </div>
      ) : null}
    </div>
    </div>
  );
};
