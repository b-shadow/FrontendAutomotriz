import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Car, 
  FileText, 
  Package, 
  Download,
  Calendar,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { Card } from '../../components/ui';
import apiClient from '../../services/apiClient';
import { 
  LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#d4572f', '#10203a', '#10b981', '#f59e0b', '#6366f1'];

export const GenerarReportesView = ({ tenantSlug, aiPrefill }) => {
  const [activeTab, setActiveTab] = useState('GLOBAL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);
  const [vehiculoPlaca, setVehiculoPlaca] = useState('');

  // UI State
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Ghost user refs
  const ghostActiveRef = useRef(false);
  
  const fetchReportData = async (type = activeTab) => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = `?desde=${fechaDesde}&hasta=${fechaHasta}`;
      
      switch (type) {
        case 'GLOBAL':
          endpoint = `/api/${tenantSlug}/vehiculos-servicios/reportes/global_stats/`;
          break;
        case 'VEHICULO':
          endpoint = `/api/${tenantSlug}/vehiculos-servicios/reportes/vehiculo/`;
          if (vehiculoPlaca) params += `&placa=${vehiculoPlaca}`;
          break;
        case 'PRESUPUESTO':
          endpoint = `/api/${tenantSlug}/vehiculos-servicios/reportes/presupuesto/`;
          break;
        case 'INVENTARIO':
          endpoint = `/api/${tenantSlug}/vehiculos-servicios/reportes/inventario/`;
          break;
      }
      
      const res = await apiClient.get(endpoint + params);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  // GHOST USER EFFECT
  useEffect(() => {
    if (!aiPrefill || ghostActiveRef.current) return;
    
    const simulateAI = async () => {
      ghostActiveRef.current = true;
      
      // Mapear accion a tab
      const typeMap = {
        'VER_REPORTE_GLOBAL': 'GLOBAL',
        'VER_REPORTE_VEHICULO': 'VEHICULO',
        'VER_REPORTE_PRESUPUESTO': 'PRESUPUESTO',
        'VER_REPORTE_INVENTARIO': 'INVENTARIO',
        'EXPORTAR_REPORTE': null // Mantiene tab actual
      };

      const targetTab = typeMap[aiPrefill.type];
      
      // Delay inicial
      await new Promise(r => setTimeout(r, 600));

      if (targetTab && targetTab !== activeTab) {
        setActiveTab(targetTab);
        await new Promise(r => setTimeout(r, 800));
      }

      // Fill dates if provided
      let changedFilters = false;
      if (aiPrefill.desde) {
        setFechaDesde(aiPrefill.desde);
        changedFilters = true;
      }
      if (aiPrefill.hasta) {
        setFechaHasta(aiPrefill.hasta);
        changedFilters = true;
      }
      if (aiPrefill.placa && targetTab === 'VEHICULO') {
        // Simulando tipeo
        for (let i = 0; i <= aiPrefill.placa.length; i++) {
          setVehiculoPlaca(aiPrefill.placa.substring(0, i));
          await new Promise(r => setTimeout(r, 100));
        }
        changedFilters = true;
      }

      if (changedFilters && aiPrefill.status === 'EJECUTADA') {
        await new Promise(r => setTimeout(r, 400));
        const btn = document.getElementById('btn-aplicar-filtros-reporte');
        if (btn) btn.click();
      }

      // Exportar
      if (aiPrefill.type === 'EXPORTAR_REPORTE' && aiPrefill.status === 'EJECUTADA') {
        await new Promise(r => setTimeout(r, 1000));
        const btnExp = document.getElementById('btn-exportar-reporte');
        if (btnExp) {
          btnExp.click(); // Abre modal
          await new Promise(r => setTimeout(r, 800));
          
          let formatBtnId = '';
          const format = (aiPrefill.formato || '').toUpperCase();
          if (format.includes('CSV')) formatBtnId = 'btn-exportar-csv';
          else if (format.includes('HTML')) formatBtnId = 'btn-exportar-html';
          else formatBtnId = 'btn-exportar-excel';
          
          const confirmBtn = document.getElementById(formatBtnId);
          if (confirmBtn) confirmBtn.click();
        }
      }

      ghostActiveRef.current = false;
    };

    simulateAI();
  }, [aiPrefill, activeTab]);

  const handleExport = (format) => {
    if (!data) return;
    
    // Preparar payload de datos según la pestaña activa
    let exportData = [];
    if (activeTab === 'GLOBAL') {
      exportData = data.grafico_ingresos || [];
    } else if (activeTab === 'VEHICULO') {
      exportData = data.historial || [];
    } else if (activeTab === 'INVENTARIO') {
      exportData = data.top_servicios || [];
    } else if (activeTab === 'PRESUPUESTO') {
      exportData = data.funnel || [];
    }

    if (exportData.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    if (format === 'excel' || format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      XLSX.writeFile(wb, `Reporte_${activeTab}_${fechaDesde}_${fechaHasta}.${format === 'excel' ? 'xlsx' : 'csv'}`);
    } else if (format === 'html') {
      let tableHtml = '<table border="1"><tr>';
      const keys = Object.keys(exportData[0]);
      keys.forEach(k => tableHtml += `<th>${k}</th>`);
      tableHtml += '</tr>';
      exportData.forEach(row => {
        tableHtml += '<tr>';
        keys.forEach(k => tableHtml += `<td>${row[k]}</td>`);
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      
      const blob = new Blob([tableHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_${activeTab}.html`;
      a.click();
    }
    
    setShowExportModal(false);
  };

  const tabs = [
    { id: 'GLOBAL', label: 'Estadísticas Globales', icon: LineChartIcon },
    { id: 'VEHICULO', label: 'Por Vehículo', icon: Car },
    { id: 'PRESUPUESTO', label: 'Por Presupuesto', icon: FileText },
    { id: 'INVENTARIO', label: 'Por Catálogo (Inventario)', icon: Package }
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
            <BarChart className="inline-block mx-1 text-primary-500" size={28} strokeWidth={2.5} /> Reportes y Estadísticas
          </h1>
          <p className="text-carbon-500 dark:text-neutral-400">Analítica avanzada de tu empresa</p>
        </div>
        
        <button 
          id="btn-exportar-reporte"
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-carbon-900 dark:bg-white text-white dark:text-carbon-900 rounded-xl hover:bg-carbon-800 dark:hover:bg-neutral-200 transition-colors font-medium shadow-sm"
        >
          <Download size={18} /> Exportar Reporte
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' 
                  : 'text-carbon-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={18} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white dark:bg-carbon-900 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Desde</label>
          <input 
            type="date" 
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Hasta</label>
          <input 
            type="date" 
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
          />
        </div>
        
        {activeTab === 'VEHICULO' && (
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Placa del Vehículo</label>
            <input 
              type="text" 
              placeholder="Ej. ABC-123"
              value={vehiculoPlaca}
              onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
              className="px-3 py-2 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white uppercase"
            />
          </div>
        )}

        <button 
          id="btn-aplicar-filtros-reporte"
          onClick={() => fetchReportData(activeTab)}
          className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium ml-auto"
        >
          <Filter size={18} /> Filtrar
        </button>
      </Card>

      {/* Loading State */}
      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center border-dashed border-2 bg-transparent">
          <Loader2 size={32} className="animate-spin text-primary-500 mb-4" />
          <p className="text-carbon-500 dark:text-neutral-400">Generando reporte analítico...</p>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          
          {/* TAB GLOBAL */}
          {activeTab === 'GLOBAL' && data.kpis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Ingresos Totales (Est.)" value={`$${data.kpis.ingresos_totales?.toFixed(2)}`} />
                <KpiCard title="Citas Totales" value={data.kpis.citas_totales} />
                <KpiCard title="Completadas vs Canceladas" value={`${data.kpis.citas_completadas} / ${data.kpis.citas_canceladas}`} />
                <KpiCard title="Ticket Promedio" value={`$${data.kpis.ticket_promedio?.toFixed(2)}`} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 col-span-2">
                  <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Tendencia de Ingresos</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.grafico_ingresos}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="fecha" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} />
                        <Line type="monotone" dataKey="ingresos" stroke="#d4572f" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Estado de Citas</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.distribucion_estados}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.distribucion_estados?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* TAB VEHICULO */}
          {activeTab === 'VEHICULO' && (
            <div className="space-y-6">
              {data.top_vehiculos && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Top 10 Vehículos Frecuentes</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={data.top_vehiculos} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="vehiculo" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar dataKey="visitas" fill="#d4572f" radius={[0, 4, 4, 0]} barSize={20} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              
              {data.vehiculo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard title="Placa" value={data.vehiculo.placa} />
                    <KpiCard title="Modelo" value={`${data.vehiculo.marca} ${data.vehiculo.modelo}`} />
                    <KpiCard title="Total Visitas" value={data.kpis.total_visitas} />
                  </div>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4">Historial de Visitas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-white/[0.06]">
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">ID</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Fecha</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.historial?.map((h, i) => (
                            <tr key={i} className="border-b border-neutral-100 dark:border-white/[0.02] hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                              <td className="p-3 text-sm font-medium text-carbon-900 dark:text-white">#{h.id}</td>
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">{h.fecha}</td>
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">{h.estado}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* TAB PRESUPUESTO */}
          {activeTab === 'PRESUPUESTO' && data.kpis && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard title="Pres. Emitidos" value={data.kpis.presupuestos_emitidos} />
                <KpiCard title="Aprobados" value={data.kpis.presupuestos_aprobados} />
                <KpiCard title="Rechazados" value={data.kpis.presupuestos_rechazados} />
                <KpiCard title="Tasa de Cierre" value={`${data.kpis.tasa_aprobacion}%`} />
              </div>
              
              <Card className="p-6">
                <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Embudo de Ventas (Funnel)</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data.funnel} margin={{ top: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60}>
                        {data.funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* TAB INVENTARIO (CATALOGO) */}
          {activeTab === 'INVENTARIO' && data.top_servicios && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Top Servicios Demandados</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={data.top_servicios} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="nombre" type="category" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={150} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="demanda" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20}>
                      {data.top_servicios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

        </div>
      ) : null}

      {/* Modal Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-carbon-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-neutral-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Formato de Exportación</h2>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-2 text-carbon-400 hover:text-carbon-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-3">
              <p className="text-sm text-carbon-500 dark:text-neutral-400 mb-2">Selecciona el formato para exportar el reporte actual ({activeTab}):</p>
              
              <button 
                id="btn-exportar-csv"
                onClick={() => handleExport('csv')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all text-left group"
              >
                <div>
                  <h3 className="font-semibold text-carbon-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">Archivo CSV</h3>
                  <p className="text-xs text-carbon-500 dark:text-neutral-400">Ideal para importar a otros sistemas</p>
                </div>
                <Download size={20} className="text-carbon-400 group-hover:text-primary-500" />
              </button>
              
              <button 
                id="btn-exportar-excel"
                onClick={() => handleExport('excel')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all text-left group"
              >
                <div>
                  <h3 className="font-semibold text-carbon-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">Microsoft Excel</h3>
                  <p className="text-xs text-carbon-500 dark:text-neutral-400">Formato .xlsx para cálculos rápidos</p>
                </div>
                <Download size={20} className="text-carbon-400 group-hover:text-green-500" />
              </button>
              
              <button 
                id="btn-exportar-html"
                onClick={() => handleExport('html')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
              >
                <div>
                  <h3 className="font-semibold text-carbon-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Documento Web (HTML)</h3>
                  <p className="text-xs text-carbon-500 dark:text-neutral-400">Para ver e imprimir fácilmente a PDF</p>
                </div>
                <Download size={20} className="text-carbon-400 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value }) => (
  <Card className="p-5 bg-white dark:bg-carbon-900 border-l-4 border-l-primary-500">
    <h4 className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 mb-1">{title}</h4>
    <p className="text-2xl font-bold text-carbon-900 dark:text-white">{value}</p>
  </Card>
);

const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
