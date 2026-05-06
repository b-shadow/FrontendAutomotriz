import { Pencil, Plus, X, User, Wrench } from 'lucide-react';
import { useState, useEffect } from 'react'
import planVehiculoService from '../../services/planVehiculoService'
import serviciosCatalogoService from '../../services/serviciosCatalogoService'
/**
 * PlanVehiculoDetalleFormModal - Modal para crear/editar detalles de plan
 */
export const PlanVehiculoDetalleFormModal = ({
  user,
  tenantSlug,
  plan,
  detalle,
  onClose,
  onSuccess,
}) => {
  const [servicios, setServicios] = useState([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [servicioId, setServicioId] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null) // Para mostrar tiempo/precio
  const [origen, setOrigen] = useState('')
  const [prioridad, setPrioridad] = useState('MEDIA')
  const [tiempo, setTiempo] = useState('')
  const [precio, setPrecio] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar servicios del catálogo
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        setLoadingServicios(true)
        const data = await serviciosCatalogoService.listarServicios(
          tenantSlug,
          { activo: true, page_size: 1000 }
        )
        setServicios(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error('Error al cargar servicios:', err)
      } finally {
        setLoadingServicios(false)
      }
    }
    cargarServicios()
  }, [tenantSlug])

  // Inicializar valores si estamos editando. En edición: son datos previos, NO se puede cambiar servicio
  useEffect(() => {
    if (detalle) {
      setServicioId(
        typeof detalle.servicio_catalogo === 'object' ? detalle.servicio_catalogo.id : detalle.servicio_catalogo || ''
      )
      setOrigen(detalle.origen || '')
      setPrioridad(detalle.prioridad || 'MEDIA')
      setTiempo(detalle.tiempo_estandar_min.toString() || '')
      setPrecio(detalle.precio_referencial.toString() || '')
      setObservaciones(detalle.observaciones || '')
      
      // Cargar servicio seleccionado para mostrar detalles
      if (detalle.servicio_catalogo) {
        setServicioSeleccionado(detalle.servicio_catalogo)
      }
    }
  }, [detalle])

  // Detectar origen automáticamente según rol del usuario
  useEffect(() => {
    if (!detalle) {
      // Solo se detecta al crear (no al editar)
      let rolNombre = ''
      if (typeof user.rol === 'string') {
        rolNombre = user.rol
      } else if (user.rol.nombre) {
        rolNombre = user.rol.nombre
      }
      if (rolNombre === 'USUARIO') {
        setOrigen('CLIENTE')
      } else if (rolNombre === 'MECÁNICO') {
        setOrigen('MECANICO')
      } else if (rolNombre === 'ADMIN') {
        setOrigen('ADMIN')
      } else {
        // ASESOR DE SERVICIO, otros
        setOrigen('ASESOR')
      }
    }
  }, [user, detalle])

  // Cuando se selecciona un servicio, cargar automáticamente
  const handleServicioChange = (e) => {
    const servicioId = e.target.value
    setServicioId(servicioId)
    
    if (servicioId) {
      const servicio = servicios.find((s) => s.id === servicioId)
      if (servicio) {
        setServicioSeleccionado(servicio)
        setTiempo((servicio.tiempo_estandar_min || '').toString())
        setPrecio((servicio.precio_base || '').toString())
      }
    } else {
      setServicioSeleccionado(null)
      setTiempo('')
      setPrecio('')
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!servicioId) {
      setError('Debes seleccionar un servicio')
      return
    }
    if (!prioridad) {
      setError('Debes seleccionar una prioridad')
      return
    }

    try {
      setLoading(true)
      const payload = {
        servicio_catalogo_id: servicioId,
        prioridad,
        observaciones,
      }
      if (detalle) {
        await planVehiculoService.editarDetallePlanVehiculo(
          tenantSlug,
          detalle.id,
          payload
        )
      } else {
        // Crear: enviar payload mínimo, backend detecta origen y carga tiempo/precio
        payload.plan_servicio_id = plan.id
        await planVehiculoService.crearDetallePlanVehiculo(
          tenantSlug,
          plan.id,
          payload
        )
      }
      onSuccess()
    } catch (err) {
      setError(
        err.response.data.error ||
          err.response.data.mensaje ||
          'Error al guardar el detalle'
      )
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-800">
          <h2 className="text-lg font-bold text-carbon-900 dark:text-white">
            {detalle ? <><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Detalle</> : <><Plus className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Agregar Detalle</>}
          </h2>
          <button
            onClick={onClose}
            className="text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Plan Info */}
          <div className="bg-neutral-50 dark:bg-carbon-700 p-3 rounded-lg text-xs text-carbon-600 dark:text-neutral-400">
            <p>
              <strong>Plan:</strong> ID {plan.id.substring(0, 8)}...
            </p>
            <p>
              <strong>Estado del Plan:</strong> {plan.estado}
            </p>
          </div>

          {/* Servicio Catálogo - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Servicio del Catálogo *
            </label>
            <select
              value={servicioId}
              onChange={handleServicioChange}
              disabled={detalle !== null || loadingServicios}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50 transition-colors"
            >
              <option value="">-- Selecciona un servicio --</option>
              {servicios.map((serv) => (
                <option key={serv.id} value={serv.id}>
                  {serv.nombre} — {serv.tiempo_estandar_min || 0} min — Bs. {(parseFloat(serv.precio_base) || 0).toFixed(2)}
                </option>
              ))}
            </select>
            {detalle && (
              <p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1">
                !No se puede cambiar el servicio en edición
              </p>
            )}
          </div>

          {/* Origen - Auto-detectado según rol */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Origen (Auto-detectado)
            </label>
            <div className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 bg-neutral-50 dark:text-white text-carbon-900">
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {origen === 'CLIENTE'
                  ? <><User className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Necesidad del Cliente</>
                  : origen === 'MECANICO' ?
                     <><Wrench className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Recomendación Técnica</>
                    : origen === 'ADMIN' ? '👑 Administrador' : '💼 Asesor de Servicio'}
              </span>
            </div>
            <p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1">
              Tu rol determina automáticamente el origen
            </p>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          {/* Tiempo Estimado - READONLY (desde catálogo) */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Tiempo Estimado (minutos) — Auto-cargado
            </label>
            <div className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 bg-neutral-50 dark:text-white text-carbon-900">
              <span className="font-semibold">
                {tiempo || '—'}
              </span>
            </div>
            {servicioSeleccionado && (<p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1"> ? Desde : {servicioSeleccionado.nombre}
              </p>
            )}
          </div>

          {/* Precio Referencial - READONLY (desde catálogo) */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Precio Referencial (Bs.) — Auto-cargado
            </label>
            <div className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 bg-neutral-50 dark:text-white text-carbon-900">
              <span className="font-semibold">
                {precio ? `Bs. ${parseFloat(precio).toFixed(2)}` : '—'}
              </span>
            </div>
            {servicioSeleccionado && (<p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1"> ? Desde : {servicioSeleccionado.nombre}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre el detalle"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-2 p-6 border-t border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg text-carbon-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-carbon-700 font-medium transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Guardando...' : detalle ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
export default PlanVehiculoDetalleFormModal
