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
  const [vehiculoMarca, setVehiculoMarca] = useState('');
  const [vehiculoModelo, setVehiculoModelo] = useState('');
  const [estadoCita, setEstadoCita] = useState('');
  const [canalOrigen, setCanalOrigen] = useState('');
  
  const [usuarioRol, setUsuarioRol] = useState('');
  const [usuarioEstado, setUsuarioEstado] = useState('');
  const [ventaEstado, setVentaEstado] = useState('');
  const [compraEstado, setCompraEstado] = useState('');
  const [compraProveedorId, setCompraProveedorId] = useState('');

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
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/global_stats/`;
          break;
        case 'VEHICULO':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/vehiculo/`;
          if (vehiculoPlaca) params += `&placa=${vehiculoPlaca}`;
          if (vehiculoMarca) params += `&marca=${vehiculoMarca}`;
          if (vehiculoModelo) params += `&modelo=${vehiculoModelo}`;
          if (estadoCita) params += `&estado_cita=${estadoCita}`;
          if (canalOrigen) params += `&canal_origen=${canalOrigen}`;
          break;
        case 'PRESUPUESTO':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/presupuesto/`;
          if (vehiculoPlaca) params += `&placa=${vehiculoPlaca}`;
          break;
        case 'INVENTARIO':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/inventario/`;
          break;
        case 'USUARIOS':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/usuarios/`;
          if (usuarioRol) params += `&rol=${usuarioRol}`;
          if (usuarioEstado) params += `&estado=${usuarioEstado}`;
          break;
        case 'VENTAS':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/ventas_mostrador/`;
          if (ventaEstado) params += `&estado_venta=${ventaEstado}`;
          break;
        case 'COMPRAS':
          endpoint = `/api/${tenantSlug}/comunicacion-control/reportes/compras/`;
          if (compraEstado) params += `&estado_compra=${compraEstado}`;
          if (compraProveedorId) params += `&proveedor_id=${compraProveedorId}`;
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
      if (aiPrefill.marca && targetTab === 'VEHICULO') {
        setVehiculoMarca(aiPrefill.marca);
        changedFilters = true;
      }
      if (aiPrefill.modelo && targetTab === 'VEHICULO') {
        setVehiculoModelo(aiPrefill.modelo);
        changedFilters = true;
      }
      if (aiPrefill.estado_cita && targetTab === 'VEHICULO') {
        setEstadoCita(aiPrefill.estado_cita);
        changedFilters = true;
      }
      if (aiPrefill.canal_origen && targetTab === 'VEHICULO') {
        setCanalOrigen(aiPrefill.canal_origen);
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
    } else if (activeTab === 'USUARIOS') {
      exportData = data.top_clientes || [];
    } else if (activeTab === 'VENTAS') {
      exportData = [data.kpis] || [];
    } else if (activeTab === 'COMPRAS') {
      exportData = [data.kpis] || [];
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
      {/* Constructor Visual de Reportes Clásicos */}
      <div className="bg-white dark:bg-carbon-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-white/[0.05] mb-6 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-500/10 p-2 rounded-xl">
            <Filter className="text-primary-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Filtros y Constructor de Reporte</h2>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Selecciona el tipo de reporte y aplica los filtros que necesites</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Entity / Tab Selector */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-semibold text-carbon-600 dark:text-neutral-300 flex items-center gap-2">
              <Package size={16} className="text-primary-500" /> ¿Qué reporte deseas generar?
            </label>
            <select 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-carbon-800 border border-neutral-200 dark:border-carbon-700 rounded-xl px-4 py-3.5 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:border-primary-500/50 shadow-sm"
            >
              <option value="GLOBAL">📈 Estadísticas Globales (Finanzas y Operación)</option>
              <option value="VEHICULO">🚗 Reporte Específico por Vehículo</option>
              <option value="PRESUPUESTO">📄 Reporte de Presupuestos y Cotizaciones</option>
              <option value="INVENTARIO">📦 Reporte de Inventario y Catálogo</option>
              <option value="USUARIOS">👥 Reporte de Usuarios y Clientes</option>
              <option value="VENTAS">🛒 Reporte de Ventas Rápidas de Mostrador</option>
              <option value="COMPRAS">🏢 Reporte de Compras y Proveedores</option>
            </select>
          </div>

          {/* Date Desde */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-carbon-600 dark:text-neutral-300 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Desde
            </label>
            <input 
              type="date" 
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-carbon-800 border border-neutral-200 dark:border-carbon-700 rounded-xl px-4 py-3 text-carbon-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-500/50 shadow-sm"
            />
          </div>

          {/* Date Hasta */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-carbon-600 dark:text-neutral-300 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Hasta
            </label>
            <input 
              type="date" 
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-carbon-800 border border-neutral-200 dark:border-carbon-700 rounded-xl px-4 py-3 text-carbon-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-500/50 shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Filters depending on the active report type */}
        {activeTab === 'VEHICULO' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Placa</label>
              <input 
                type="text" 
                placeholder="ABC-1234"
                value={vehiculoPlaca}
                onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Marca</label>
              <input 
                type="text" 
                placeholder="Toyota"
                value={vehiculoMarca}
                onChange={(e) => setVehiculoMarca(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Modelo</label>
              <input 
                type="text" 
                placeholder="Corolla"
                value={vehiculoModelo}
                onChange={(e) => setVehiculoModelo(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Estado Cita</label>
              <select 
                value={estadoCita}
                onChange={(e) => setEstadoCita(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Origen</label>
              <select 
                value={canalOrigen}
                onChange={(e) => setCanalOrigen(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="APP">App Móvil</option>
                <option value="WEB">Web</option>
                <option value="TALLER">Taller</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'PRESUPUESTO' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Placa del Vehículo</label>
              <input 
                type="text" 
                placeholder="ABC-1234"
                value={vehiculoPlaca}
                onChange={(e) => setVehiculoPlaca(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'USUARIOS' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Rol de Usuario</label>
              <select 
                value={usuarioRol}
                onChange={(e) => setUsuarioRol(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="CLIENTE">Cliente</option>
                <option value="MECANICO">Mecánico</option>
                <option value="ASESOR">Asesor de Servicio</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Estado</label>
              <select 
                value={usuarioEstado}
                onChange={(e) => setUsuarioEstado(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'VENTAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Estado de Venta</label>
              <select 
                value={ventaEstado}
                onChange={(e) => setVentaEstado(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="PAGADA">Pagada</option>
                <option value="PENDIENTE_PAGO">Pendiente de Pago</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'COMPRAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">Estado de Compra</label>
              <select 
                value={compraEstado}
                onChange={(e) => setCompraEstado(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              >
                <option value="">Cualquiera</option>
                <option value="RECIBIDA">Recibida</option>
                <option value="EN_TRANSITO">En Tránsito</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider">ID Proveedor</label>
              <input 
                type="text" 
                placeholder="ID Opcional"
                value={compraProveedorId}
                onChange={(e) => setCompraProveedorId(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl text-carbon-900 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            id="btn-aplicar-filtros-reporte"
            onClick={() => fetchReportData(activeTab)}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-carbon-200 dark:disabled:bg-carbon-800 text-white rounded-xl transition-all font-bold shadow-lg shadow-primary-500/25"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />} 
            Generar Reporte
          </button>
        </div>
      </div>

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
                <KpiCard title="Ingresos Totales" value={`$${data.kpis.ingresos_totales?.toFixed(2)}`} />
                <KpiCard title="Citas Totales" value={data.kpis.citas_totales} />
                <KpiCard title="Completadas vs Canceladas" value={`${data.kpis.citas_completadas} / ${data.kpis.citas_canceladas}`} />
                <KpiCard title="Ticket Promedio" value={`$${data.kpis.ticket_promedio?.toFixed(2)}`} />
                <KpiCard title="Vehiculos en Taller" value={data.kpis.vehiculos_en_taller} />
                <KpiCard title="Vehiculos Sistema" value={data.kpis.vehiculos_total_sistema} />
                <KpiCard title="% En Taller" value={`${data.kpis.ratio_vehiculos_en_taller_pct}%`} />
              </div>
              {data.ranking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 mb-1">Vehiculo con mas citas</h4>
                    <p className="text-lg font-bold text-carbon-900 dark:text-white">
                      {data.ranking.vehiculo_mas_citas ? `${data.ranking.vehiculo_mas_citas.vehiculo} (${data.ranking.vehiculo_mas_citas.placa})` : 'N/A'}
                    </p>
                    <p className="text-sm text-carbon-500 dark:text-neutral-400">
                      {data.ranking.vehiculo_mas_citas ? `${data.ranking.vehiculo_mas_citas.total} citas` : ''}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 mb-1">Vehiculo con mas detalles resueltos</h4>
                    <p className="text-lg font-bold text-carbon-900 dark:text-white">
                      {data.ranking.vehiculo_mas_detalles_resueltos ? `${data.ranking.vehiculo_mas_detalles_resueltos.vehiculo} (${data.ranking.vehiculo_mas_detalles_resueltos.placa})` : 'N/A'}
                    </p>
                    <p className="text-sm text-carbon-500 dark:text-neutral-400">
                      {data.ranking.vehiculo_mas_detalles_resueltos ? `${data.ranking.vehiculo_mas_detalles_resueltos.total} detalles` : ''}
                    </p>
                  </Card>
                </div>
              )}
              
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
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <KpiCard title="Placa" value={data.vehiculo.placa} />
                    <KpiCard title="Modelo" value={`${data.vehiculo.marca} ${data.vehiculo.modelo}`} />
                    <KpiCard title="Total Visitas" value={data.kpis.total_visitas} />
                    <KpiCard title="Tasa Completado" value={`${data.kpis.tasa_completado_pct}%`} />
                    <KpiCard title="Finalizadas" value={data.kpis.citas_finalizadas} />
                    <KpiCard title="Canceladas" value={data.kpis.citas_canceladas} />
                    <KpiCard title="No Show" value={data.kpis.citas_no_show} />
                    <KpiCard title="Promedio Atencion (h)" value={data.kpis.tiempo_promedio_atencion_horas ?? 'N/A'} />
                    <KpiCard title="Tiempo Total en Taller (h)" value={data.kpis.tiempo_total_taller_horas ?? 0} />
                    <KpiCard title="Detalles Resueltos" value={`${data.kpis.detalles_resueltos} / ${data.kpis.detalles_totales}`} />
                    <KpiCard title="Tasa Detalles Resueltos" value={`${data.kpis.tasa_detalles_resueltos_pct}%`} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Visitas por Mes</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={data.citas_por_mes || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px' }} />
                            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Servicios Mas Frecuentes</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={data.servicios_top || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="servicio" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={160} />
                            <Tooltip contentStyle={{ borderRadius: '12px' }} />
                            <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
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
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4">Detalle de Citas a lo largo del tiempo</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-white/[0.06]">
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Fecha</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Servicio</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Estado</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Tiempo (min)</th>
                            <th className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">Precio Ref.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.detalles_historial || []).map((d, i) => (
                            <tr key={`${d.cita_id}-${i}`} className="border-b border-neutral-100 dark:border-white/[0.02] hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">{d.fecha_cita || 'N/A'}</td>
                              <td className="p-3 text-sm font-medium text-carbon-900 dark:text-white">{d.servicio}</td>
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">{d.estado_detalle}</td>
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">{d.tiempo_estandar_min}</td>
                              <td className="p-3 text-sm text-carbon-600 dark:text-neutral-300">${Number(d.precio_referencial || 0).toFixed(2)}</td>
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
                <KpiCard title="Presupuestos Totales" value={data.kpis.presupuestos_total} />
                <KpiCard title="Pres. Emitidos" value={data.kpis.presupuestos_emitidos} />
                <KpiCard title="Aprobados" value={data.kpis.presupuestos_aprobados} />
                <KpiCard title="Rechazados" value={data.kpis.presupuestos_rechazados} />
                <KpiCard title="Cerrados" value={data.kpis.presupuestos_cerrados} />
                <KpiCard title="Monto Total" value={`$${data.kpis.monto_total_presupuestado?.toFixed(2)}`} />
                <KpiCard title="Tasa de Aprobacion" value={`${data.kpis.tasa_aprobacion}%`} />
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
              {data.por_estado && data.por_estado.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Distribucion por Estado</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.por_estado} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                          {data.por_estado.map((entry, index) => (
                            <Cell key={`pres-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              {data.top_vehiculos_detalles_resueltos && data.top_vehiculos_detalles_resueltos.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Top Vehiculos con mas Detalles Resueltos</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={data.top_vehiculos_detalles_resueltos} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="vehiculo" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={160} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar dataKey="detalles_resueltos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
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

      {/* TAB USUARIOS */}
      {activeTab === 'USUARIOS' && data && data.kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Usuarios" value={data.kpis.total_usuarios} />
            <KpiCard title="Usuarios Activos" value={data.kpis.usuarios_activos} />
            <KpiCard title="Usuarios Inactivos" value={data.kpis.usuarios_inactivos} />
          </div>
          {data.top_clientes && data.top_clientes.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-6">Top Clientes por Citas Generadas</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={data.top_clientes} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="nombre" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="citas" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB VENTAS */}
      {activeTab === 'VENTAS' && data && data.kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Ingresos Ventas Mostrador" value={`$${data.kpis.ingresos_ventas_mostrador?.toFixed(2)}`} />
            <KpiCard title="Total Ventas Registradas" value={data.kpis.total_ventas} />
            <KpiCard title="Ventas Pagadas" value={data.kpis.ventas_pagadas} />
            <KpiCard title="Ventas Pendientes" value={data.kpis.ventas_pendientes} />
          </div>
        </div>
      )}

      {/* TAB COMPRAS */}
      {activeTab === 'COMPRAS' && data && data.kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Gastos Totales en Compras" value={`$${data.kpis.gastos_compras?.toFixed(2)}`} />
            <KpiCard title="Total Órdenes" value={data.kpis.total_compras} />
            <KpiCard title="Compras Recibidas" value={data.kpis.compras_recibidas} />
            <KpiCard title="Órdenes en Tránsito" value={data.kpis.compras_pendientes} />
          </div>
        </div>
      )}

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
