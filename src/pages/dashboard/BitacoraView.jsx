import { useState, useEffect } from 'react'
import auditoriaService from '../../services/auditoriaService'
import * as XLSX from 'xlsx'

/**
 * Formatea fecha a formato legible
 * @param {string} fecha - Fecha ISO
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return 'N/A'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea nombre de usuario desde el evento
 * @param {object} evento - Evento de auditoría
 * @returns {string} Nombre formateado
 */
function formatearUsuario(evento) {
  if (!evento.usuario) return 'Sistema'
  if (evento.usuario_nombres && evento.usuario_apellidos) {
    return `${evento.usuario_nombres} ${evento.usuario_apellidos}`
  }
  if (evento.usuario_nombres) return evento.usuario_nombres
  if (evento.usuario_email) return evento.usuario_email
  return 'Desconocido'
}

/**
 * Trunca texto a longitud máxima
 * @param {string} texto - Texto a truncar
 * @param {number} maxLen - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, maxLen = 50) {
  if (!texto) return 'N/A'
  if (texto.length > maxLen) return texto.substring(0, maxLen) + '...'
  return texto
}

/**
 * Decodifica nombre de acción a label legible
 * @param {string} accion - Código de acción
 * @returns {string} Label legible
 */
function labelAccion(accion) {
  const labels = {
    'usuario_registrado_tenant': 'Usuario Registrado (Tenant)',
    'usuario_login_tenant': 'Login Tenant',
    'usuario_creado': 'Usuario Creado',
    'usuario_rol_cambiado': 'Rol Cambiado',
    'usuario_desactivado': 'Usuario Desactivado',
    'usuario_activado': 'Usuario Activado',
    'perfil_actualizado': 'Perfil Actualizado',
    'password_cambiado': 'Contraseña Cambiada',
    'usuario_eliminado': 'Usuario Eliminado',
    'suscripcion_cambio_programado': 'Cambio Plan Programado',
    'suscripcion_cambio_cancelado': 'Cambio Plan Cancelado',
    'suscripcion_renovada': 'Suscripción Renovada',
    'suscripcion_pago_confirmado_cambio': 'Pago Confirmado (Cambio)',
    'suscripcion_plan_pendiente_aplicado': 'Plan Pendiente Aplicado',
    'registro_empresa_confirmado': 'Registro Empresa Confirmado',
    'empresa_registrada': 'Empresa Registrada',
    'suscripcion_inicial_activada': 'Suscripción inicial Activada',
  }
  return labels[accion] || accion
}

/**
 * Vista principal de bitácora
 */
export const BitacoraView = ({ tenantSlug }) => {
  // Estados principales
  const [resumen, setResumen] = useState(null)
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [cargandoListado, setCargandoListado] = useState(false)
  const [error, setError] = useState(null)

  // Estados del detalle (PROBLEMA 2)
  const [detalleEvento, setDetalleEvento] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 20

  // Filtros (ahora incluye ordering - PROBLEMA 4)
  const [filtros, setFiltros] = useState({
    search: '',
    accion: '',
    created_at__gte: '',
    created_at__lte: '',
    ordering: '-created_at',
  })

  // Opciones para selects (derivadas de datos)
  const [accionesDisponibles, setAccionesDisponibles] = useState([])

  // Estado para exportación
  const [exportandoTodo, setExportandoTodo] = useState(false)

  /**
   * PROBLEMA 1: Extrae lógica de acumulación a función helper
   * Para reutilizar en cargarDatos, aplicarFiltros e irAPagina
   */
  function acumularOpcionesDesdeEventos(listaEventos) {
    if (!listaEventos?.length) return

    setAccionesDisponibles((prev) => {
      const nuevas = listaEventos.map((e) => e.accion).filter(Boolean)
      return [...new Set([...prev, ...nuevas])].sort()
    })
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug])
  async function cargarDatos(orderingOverride = null) {
    setLoading(true)
    setError(null)
    try {
      const ordering = orderingOverride !== null ? orderingOverride : filtros.ordering
      // Cargar en paralelo
      const [resumenData, eventosData] = await Promise.all([
        auditoriaService.obtenerResumen(tenantSlug),
        auditoriaService.listarEventos(tenantSlug, { page: 1, page_size: pageSize, ordering }),
      ])
      setResumen(resumenData)
      setEventos(eventosData.results || [])
      setTotalItems(eventosData.count || 0)
      acumularOpcionesDesdeEventos(eventosData.results || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al cargar datos')
      console.error('Error en cargarDatos:', err)
    } finally {
      setLoading(false)
    }
  }
  async function aplicarFiltros() {
    setCargandoListado(true)
    setError(null)
    setPaginaActual(1)
    try {
      const respuesta = await auditoriaService.listarEventos(tenantSlug, {
        page: 1,
        page_size: pageSize,
        ...filtros,
      })
      setEventos(respuesta.results || [])
      setTotalItems(respuesta.count || 0)
      acumularOpcionesDesdeEventos(respuesta.results || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al filtrar eventos')
    } finally {
      setCargandoListado(false)
    }
  }
  async function irAPagina(numPagina) {
    setCargandoListado(true)
    setError(null)

    try {
      const respuesta = await auditoriaService.listarEventos(tenantSlug, {
        page: numPagina,
        page_size: pageSize,
        ...filtros,
      })

      setEventos(respuesta.results || [])
      setPaginaActual(numPagina)
      acumularOpcionesDesdeEventos(respuesta.results || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al paginar')
    } finally {
      setCargandoListado(false)
    }
  }
  async function handleVerDetalle(eventoId) {
    setLoadingDetalle(true)
    setErrorDetalle(null)
    setModalAbierto(true)

    try {
      const detalleData = await auditoriaService.obtenerDetalle(tenantSlug, eventoId)
      setDetalleEvento(detalleData)
    } catch (err) {
      setErrorDetalle(err.response?.data?.error || err.message || 'Error al cargar detalle')
      console.error('Error en handleVerDetalle:', err)
    } finally {
      setLoadingDetalle(false)
    }
  }
  function cerrarModal() {
    setModalAbierto(false)
    setDetalleEvento(null)
    setErrorDetalle(null)
  }

  /**
   * Prepara datos formateados para exportar
   * @param {array} datosExportar - Lista de eventos a exportar
   * @returns {array} Datos formateados
   */
  function prepararDatosExportacion(datosExportar) {
    return datosExportar.map((evento) => ({
      'Fecha': formatearFecha(evento.created_at),
      'Acción': labelAccion(evento.accion),
      'Usuario': formatearUsuario(evento),
      'Email Usuario': evento.usuario_email || 'N/A',
      'Tipo Entidad': evento.entidad_tipo || 'N/A',
      'ID Entidad': evento.entidad_id || 'N/A',
      'Descripción': evento.descripcion || 'N/A',
      'IP': evento.ip || 'N/A',
    }))
  }

  /**
   * Descargar archivo
   * @param {string} contenido - Contenido del archivo
   * @param {string} nombreArchivo - Nombre del archivo
   * @param {string} tipo - Tipo MIME
   */
  function descargarArchivo(contenido, nombreArchivo, tipo) {
    const blob = new Blob([contenido], { type: tipo })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Exportar a CSV
   */
  function exportarCSV(datosExportar, nombreArchivo = 'bitacora.csv') {
    const datosFormato = prepararDatosExportacion(datosExportar)
    if (datosFormato.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const headers = Object.keys(datosFormato[0])
    const csvContent = [
      headers.join(','),
      ...datosFormato.map((row) =>
        headers
          .map((header) => {
            const valor = row[header] || ''
            // Escapar comillas y agregar comillas si contiene comas
            const valorEscapado = String(valor).replace(/"/g, '""')
            return `"${valorEscapado}"`
          })
          .join(',')
      ),
    ].join('\n')

    descargarArchivo(csvContent, nombreArchivo, 'text/csv;charset=utf-8;')
  }

  /**
   * Exportar a HTML
   */
  function exportarHTML(datosExportar, nombreArchivo = 'bitacora.html') {
    const datosFormato = prepararDatosExportacion(datosExportar)
    if (datosFormato.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const headers = Object.keys(datosFormato[0])
    const filas = datosFormato
      .map(
        (row) => `
      <tr>
        ${headers.map((header) => `<td>${row[header] || 'N/A'}</td>`).join('')}
      </tr>
    `
      )
      .join('')

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bitácora de Auditoría</title>
      <style>
        * { font-family: Arial, sans-serif; }
        body { padding: 20px; background-color: #f5f5f5; }
        h1 { color: #333; text-align: center; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th { 
          background-color: #5b21b6; 
          color: white; 
          padding: 12px; 
          text-align: left;
          font-weight: bold;
        }
        td { 
          padding: 10px 12px; 
          border-bottom: 1px solid #ddd; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f0f0f0; }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          color: #666; 
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>📋 Bitácora de Auditoría</h1>
      <p style="text-align: center; color: #666;">
        Generado el ${new Date().toLocaleString('es-ES')}
      </p>
      <table>
        <thead>
          <tr>
            ${headers.map((header) => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
      <div class="footer">
        <p>Total de eventos: ${datosFormato.length}</p>
      </div>
    </body>
    </html>
    `

    descargarArchivo(htmlContent, nombreArchivo, 'text/html;charset=utf-8;')
  }

  /**
   * Exportar a Excel
   */
  function exportarExcel(datosExportar, nombreArchivo = 'bitacora.xlsx') {
    const datosFormato = prepararDatosExportacion(datosExportar)
    if (datosFormato.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Crear un nuevo workbook
    const ws = XLSX.utils.json_to_sheet(datosFormato)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bitácora')

    // Ajustar ancho de columnas
    const colWidths = [20, 20, 25, 25, 20, 40, 30, 15]
    ws['!cols'] = colWidths.map((width) => ({ wch: width }))

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo)
  }

  /**
   * Manejar exportación  
   */
  async function handleExportarListado(formato) {
    if (eventos.length === 0) {
      alert('No hay eventos para exportar')
      return
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const nombreBase = `bitacora_${timestamp}`

    switch (formato) {
      case 'csv':
        exportarCSV(eventos, `${nombreBase}.csv`)
        break
      case 'html':
        exportarHTML(eventos, `${nombreBase}.html`)
        break
      case 'excel':
        exportarExcel(eventos, `${nombreBase}.xlsx`)
        break
      default:
        break
    }
  }

  /**
   * Manejar exportación de todos los datos (descarga completa con filtros aplicados)
   */
  async function handleExportarTodo(formato) {
    setExportandoTodo(true)
    try {
      // Obtener todos los datos con los filtros aplicados sin paginación
      const respuesta = await auditoriaService.listarEventos(tenantSlug, {
        page: 1,
        page_size: 999999, // Número muy grande para obtener todos los registros
        ...filtros,
      })

      const datosCompletos = respuesta.results || []
      if (datosCompletos.length === 0) {
        alert('No hay eventos para exportar con los filtros aplicados')
        return
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const nombreBase = `bitacora_completa_${timestamp}`

      switch (formato) {
        case 'csv':
          exportarCSV(datosCompletos, `${nombreBase}.csv`)
          break
        case 'html':
          exportarHTML(datosCompletos, `${nombreBase}.html`)
          break
        case 'excel':
          exportarExcel(datosCompletos, `${nombreBase}.xlsx`)
          break
        default:
          break
      }
    } catch (err) {
      alert('Error al exportar: ' + (err.response?.data?.error || err.message || 'Error desconocido'))
      console.error('Error en handleExportarTodo:', err)
    } finally {
      setExportandoTodo(false)
    }
  }

  function limpiarFiltros() {
    setFiltros({
      search: '',
      accion: '',
      created_at__gte: '',
      created_at__lte: '',
      ordering: '-created_at',
    })
    setPaginaActual(1)
    cerrarModal()
    cargarDatos('-created_at')
  }

  /**
   * Vista de carga
   */
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando bitácora...</p>
        </div>
      </div>
    )
  }
  const totalPaginas = Math.ceil(totalItems / pageSize)
  const desde = (paginaActual - 1) * pageSize + 1
  const hasta = Math.min(paginaActual * pageSize, totalItems)

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          📋 Visualizar Bitácora
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Consulta los eventos de auditoría de tu empresa
        </p>
      </div>

      {/* CARDS RESUMEN */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Eventos */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Eventos
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {resumen.total_eventos || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          {/* Eventos Hoy */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Eventos Hoy
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {resumen.eventos_hoy || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          {/* Última Semana */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Última Semana
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {resumen.eventos_ultima_semana || 0}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          {/* Usuarios Activos */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Usuarios Activos
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {resumen.usuarios_activos || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>
      )}

      {/* ACCIONES FRECUENTES 
      {resumen?.acciones_frecuentes && resumen.acciones_frecuentes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Acciones Más Frecuentes
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumen.acciones_frecuentes.map((item, idx) => (
              <div
                key={idx}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {labelAccion(item.accion)}
                <span className="ml-2 font-semibold text-primary-600 dark:text-primary-400">
                  ({item.cantidad})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      */}
      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          🔍 Filtros
        </h2>

        <div className="space-y-4">
          {/* Fila 1: Búsqueda y Acción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Búsqueda Libre
              </label>
              <input
                type="text"
                placeholder="Buscar por descripción, acción, usuario..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Acción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Acción
              </label>
              <select
                value={filtros.accion}
                onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Todas las acciones</option>
                {accionesDisponibles.map((accion) => (
                  <option key={accion} value={accion}>
                    {labelAccion(accion)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Fechas y Orden */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Desde */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={filtros.created_at__gte}
                onChange={(e) => setFiltros({ ...filtros, created_at__gte: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.created_at__lte}
                onChange={(e) => setFiltros({ ...filtros, created_at__lte: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ordenar por Fecha
              </label>
              <select
                value={filtros.ordering}
                onChange={(e) => setFiltros({ ...filtros, ordering: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="-created_at">Más Recientes Primero</option>
                <option value="created_at">Más Antiguos Primero</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={aplicarFiltros}
              disabled={cargandoListado}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {cargandoListado ? 'Filtrando...' : 'Aplicar Filtros'}
            </button>
            <button
              onClick={limpiarFiltros}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
            >
              Limpiar
            </button>

            {/* Separador visual */}
            <div className="hidden md:block flex-grow"></div>

            {/* Botones de exportación */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
                  📥 Exportar:
                </span>
              </div>

              {/* Exportar página actual */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportarListado('csv')}
                  className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors font-medium text-sm"
                  title="Exportar página actual a CSV"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportarListado('excel')}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
                  title="Exportar página actual a Excel"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExportarListado('html')}
                  className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-sm"
                  title="Exportar página actual a HTML"
                >
                  HTML
                </button>
              </div>

              {/* Exportar todo con filtros */}
              <div className="flex gap-2 ml-2 pl-2 border-l border-slate-300 dark:border-slate-600">
                <button
                  onClick={() => handleExportarTodo('csv')}
                  disabled={exportandoTodo}
                  className="px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-medium text-xs disabled:opacity-50"
                  title="Exportar todo (con filtros) a CSV"
                >
                  {exportandoTodo ? '⏳' : '📊'} CSV
                </button>
                <button
                  onClick={() => handleExportarTodo('excel')}
                  disabled={exportandoTodo}
                  className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium text-xs disabled:opacity-50"
                  title="Exportar todo (con filtros) a Excel"
                >
                  {exportandoTodo ? '⏳' : '📊'} Excel
                </button>
                <button
                  onClick={() => handleExportarTodo('html')}
                  disabled={exportandoTodo}
                  className="px-3 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors font-medium text-xs disabled:opacity-50"
                  title="Exportar todo (con filtros) a HTML"
                >
                  {exportandoTodo ? '⏳' : '📊'} HTML
                </button>
              </div>
            </div>
          </div>

          {/* Nota de información sobre exportación */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            💡 Botones claros: exportan página actual ({eventos.length} eventos) | Botones oscuros: exportan todos los datos con filtros aplicados
          </p>
        </div>
      </div>

      {/* MENSAJES DE ERROR */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-300 text-sm font-medium">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* TABLA DE EVENTOS */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-colors overflow-hidden">
        {cargandoListado ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full mx-auto mb-3"></div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Cargando eventos...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-base mb-2">
              📭 No hay eventos para mostrar
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Intenta cambiar los filtros o revisaremos más tarde
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Entidad
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {eventos.map((evento) => (
                  <tr
                    key={evento.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200 whitespace-nowrap">
                      {formatearFecha(evento.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
                        {labelAccion(evento.accion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      {formatearUsuario(evento)}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      {evento.entidad_tipo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {truncarTexto(evento.descripcion, 30)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {evento.ip || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleVerDetalle(evento.id)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded text-xs font-medium transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {eventos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {desde} a {hasta} de {totalItems} eventos
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => irAPagina(paginaActual - 1)}
              disabled={paginaActual === 1 || cargandoListado}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              ← Anterior
            </button>

            {/* Números de página - Dinámicos */}
            <div className="flex gap-2 items-center">
              {(() => {
                // Calcular rango de páginas a mostrar
                const maxVisible = 5
                let start = 1
                let end = Math.min(maxVisible, totalPaginas)

                if (totalPaginas > maxVisible) {
                  // Si estamos cerca del inicio
                  if (paginaActual <= Math.floor(maxVisible / 2) + 1) {
                    start = 1
                    end = maxVisible
                  }
                  // Si estamos cerca del final
                  else if (paginaActual > totalPaginas - Math.floor(maxVisible / 2)) {
                    start = totalPaginas - maxVisible + 1
                    end = totalPaginas
                  }
                  // Si estamos en el medio
                  else {
                    start = paginaActual - Math.floor(maxVisible / 2)
                    end = paginaActual + Math.floor(maxVisible / 2)
                  }
                }

                const paginas = []
                for (let i = start; i <= end; i++) {
                  paginas.push(i)
                }

                return (
                  <>
                    {/* Puntos al inicio si no empezamos en 1 */}
                    {start > 1 && (
                      <>
                        <button
                          onClick={() => irAPagina(1)}
                          className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          1
                        </button>
                        {start > 2 && <span className="text-slate-600 dark:text-slate-400">...</span>}
                      </>
                    )}

                    {/* Números visibles */}
                    {paginas.map((numPag) => (
                      <button
                        key={numPag}
                        onClick={() => irAPagina(numPag)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          paginaActual === numPag
                            ? 'bg-primary-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {numPag}
                      </button>
                    ))}

                    {/* Puntos al final si no terminamos en totalPaginas */}
                    {end < totalPaginas && (
                      <>
                        {end < totalPaginas - 1 && <span className="text-slate-600 dark:text-slate-400">...</span>}
                        <button
                          onClick={() => irAPagina(totalPaginas)}
                          className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {totalPaginas}
                        </button>
                      </>
                    )}
                  </>
                )
              })()}
            </div>

            <button
              onClick={() => irAPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas || cargandoListado}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Detalle del Evento
              </h2>
              <button
                onClick={cerrarModal}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            {loadingDetalle ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full mx-auto mb-3"></div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Cargando detalle...</p>
              </div>
            ) : errorDetalle ? (
              <div className="p-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                    ⚠️ {errorDetalle}
                  </p>
                </div>
              </div>
            ) : detalleEvento ? (
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {/* Fila: Fecha y ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Fecha
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white mt-1">
                      {formatearFecha(detalleEvento.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      ID Evento
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono truncate">
                      {detalleEvento.id}
                    </p>
                  </div>
                </div>
                {/* Acción */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Acción
                  </p>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full font-medium">
                    {labelAccion(detalleEvento.accion)}
                  </span>
                </div>
                {/* Usuario */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Usuario
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {formatearUsuario(detalleEvento)}
                    {detalleEvento.usuario_email && (
                      <span className="text-slate-600 dark:text-slate-400 text-xs ml-2">
                        ({detalleEvento.usuario_email})
                      </span>
                    )}
                  </p>
                </div>
                {/* Entidad */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Entidad
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {detalleEvento.entidad_tipo || 'N/A'}{' '}
                    {detalleEvento.entidad_id && (
                      <span className="text-slate-600 dark:text-slate-400 text-xs ml-2 font-mono">
                        {detalleEvento.entidad_id.substring(0, 8)}...
                      </span>
                    )}
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Descripción
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {detalleEvento.descripcion || 'Sin descripción'}
                  </p>
                </div>

                {/* IP y User Agent */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      IP
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white mt-1 font-mono">
                      {detalleEvento.ip || 'N/A'}
                    </p>
                  </div>
                  {/* User Agent - Oculto visualmente pero capturado
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      User Agent
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono break-all">
                      {detalleEvento.user_agent || 'N/A'}
                    </p>
                  </div>
                  */}
                </div>

                {/* Metadata */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Datos Adicionales (Metadata)
                  </p>
                  {detalleEvento.metadata && Object.keys(detalleEvento.metadata).length > 0 ? (
                    <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded mt-1 overflow-x-auto text-slate-800 dark:text-slate-200">
                      {JSON.stringify(detalleEvento.metadata, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sin metadata</p>
                  )}
                </div>
              </div>
            ) : null}
            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default BitacoraView