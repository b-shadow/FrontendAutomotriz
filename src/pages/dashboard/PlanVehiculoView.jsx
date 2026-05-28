import { ClipboardList, Eye, Pencil, RefreshCw, Plus } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react'
import planVehiculoService from '../../services/planVehiculoService'
import vehiculosService from '../../services/vehiculosService'
import {
  canEditPlanVehiculo,
  canChangePlanVehiculoStatus,
  canAddPlanVehiculoDetalle,
} from '../../utils/roleHelper'
import PlanVehiculoModal from '../../components/planVehiculo/PlanVehiculoModal'
import PlanVehiculoDetalleModal from '../../components/planVehiculo/PlanVehiculoDetalleModal'
import CambiarEstadoPlanModal from '../../components/planVehiculo/CambiarEstadoPlanModal'
import CambiarEstadoDetalleModal from '../../components/planVehiculo/CambiarEstadoDetalleModal'
import PlanVehiculoDetalleFormModal from '../../components/planVehiculo/PlanVehiculoDetalleFormModal'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import GhostIndicator from '../../components/GhostIndicator'

/**
 * PlanVehiculoView - Vista principal del CU22: Gestionar Plan de Vehículo
 * 
 * Presenta:
 * - Listado de planes de vehículos con filtros
 * - Opción para crear, editar, cambiar estado de planes
 * - Vista de detalles de un plan
 * - Gestión de detalles dentro del plan (crear, editar, cambiar estado)
 */
export const PlanVehiculoView = ({ user, tenantSlug, aiPrefill = null, onSuccess }) => {
  // Estados de datos
  const [planes, setPlanes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [loadingPlanes, setLoadingPlanes] = useState(false)
  const [errorPlanes, setErrorPlanes] = useState(null)
  const { isSimulating, setIsSimulating, simulateTyping, simulateClick, simulateDelay } = useGhostAutomation()
  const lastProcessedActionRef = useRef(null)

  // Estados de filtro
  const [filtros, setFiltros] = useState({
    search: '',
    estadoFiltro: '',
    vehiculoFiltro: '',
    ordering: '-created_at',
  })

  // Estados de modal cargar
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [showEstadoDetalleModal, setShowEstadoDetalleModal] = useState(false)
  const [showFormDetalleModal, setShowFormDetalleModal] = useState(false)

  // Estados de selección
  const [planSeleccionado, setPlanSeleccionado] = useState(null)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null)
  const [planEditando, setPlanEditando] = useState(null)
  const [detalleEditando, setDetalleEditando] = useState(null)

  // Cargar vehículos disponibles
  useEffect(() => {
    const cargarVehiculos = async () => {
      try {
        const data = await vehiculosService.listarVehiculos(tenantSlug, {
          ordering: 'placa',
        })
        setVehiculos(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error('Error al cargar vehículos:', err)
      }
    }
    cargarVehiculos()
  }, [tenantSlug])

  // Cargar planes de vehículos
  const cargarPlanes = async (filtrosActuales = filtros) => {
    try {
      setLoadingPlanes(true)
      setErrorPlanes(null)
      const queryParams = {
        ordering: filtrosActuales.ordering,
      }
      if (filtrosActuales.search) queryParams.search = filtrosActuales.search
      if (filtrosActuales.estadoFiltro) queryParams.estado = filtrosActuales.estadoFiltro
      if (filtrosActuales.vehiculoFiltro) queryParams.vehiculo_id = filtrosActuales.vehiculoFiltro

      const data = await planVehiculoService.listarPlanesVehiculo(
        tenantSlug,
        queryParams
      )
      const list = Array.isArray(data) ? data : data.results || []
      setPlanes(list)
      return list
    } catch (err) {
      setErrorPlanes('No se pudieron cargar los planes de vehículos.')
      console.error('Error al cargar planes:', err)
      return []
    } finally {
      setLoadingPlanes(false)
    }
  }

  useEffect(() => {
    cargarPlanes(filtros)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug])

  const handleFilterChange = async (e) => {
    const { name, value } = e.target
    const nuevosFiltros = {
      ...filtros,
      [name]: value,
    }
    setFiltros(nuevosFiltros)
    await cargarPlanes(nuevosFiltros)
  }

  // Lógica de Ghost User
  useEffect(() => {
    if (!aiPrefill) return;

    // Si esta acción ya fue procesada, no hacer nada
    const actionKey = `${aiPrefill.type}_${aiPrefill._ts}`;
    if (lastProcessedActionRef.current === actionKey) return;
    lastProcessedActionRef.current = actionKey;

    const processPrefill = async () => {
      setIsSimulating(true);

      if (aiPrefill.type === 'BUSCAR_PLAN_VEHICULO') {
        const searchTerm = aiPrefill.busqueda || aiPrefill.search || aiPrefill.placa || '';
        const nuevosFiltros = { ...filtros };
        if (searchTerm) {
          nuevosFiltros.search = searchTerm;
          await simulateTyping(setFiltros, 'search', searchTerm, 50);
        }
        if (aiPrefill.estado) {
          const estadoVal = aiPrefill.estado === 'Todos' ? '' : aiPrefill.estado;
          nuevosFiltros.estadoFiltro = estadoVal;
          setFiltros(prev => ({ ...prev, estadoFiltro: estadoVal }));
          await simulateDelay(600);
        }
        await simulateDelay(800);
        await cargarPlanes(nuevosFiltros);
        setIsSimulating(false);
        return;
      }

      // Para otras acciones, necesitamos la lista de planes actual o cargarla
      let listaPlanes = planes;
      if (listaPlanes.length === 0) {
        listaPlanes = await cargarPlanes(filtros);
      }

      // Buscar plan por placa
      const placaBuscada = (aiPrefill.placa || '').toLowerCase();
      let planEncontrado = null;
      
      if (placaBuscada) {
        planEncontrado = listaPlanes.find(p => {
          const info = obtenerInfoVehiculo(p);
          if (typeof info === 'string') return false;
          return info.placa && String(info.placa).toLowerCase().includes(placaBuscada);
        });
      } else {
        // Si la IA no envió placa en este paso, intentamos mantener el plan que ya está abierto en la vista
        planEncontrado = planSeleccionado;
      }

      if (!planEncontrado) {
        console.warn('Ghost User: No se encontró plan para continuar la acción');
        setIsSimulating(false);
        return;
      }

      await simulateDelay(800);

      if (aiPrefill.type === 'VER_PLAN_VEHICULO') {
        handleVerDetalle(planEncontrado);
      } else if (aiPrefill.type === 'EDITAR_PLAN_VEHICULO') {
        handleEditarPlan(planEncontrado);
      } else if (aiPrefill.type === 'CAMBIAR_ESTADO_PLAN_VEHICULO') {
        handleCambiarEstado(planEncontrado);
      } else if (aiPrefill.type === 'AGREGAR_DETALLE_PLAN_VEHICULO') {
        handleAgregarDetalle(planEncontrado);
      }

      setIsSimulating(false);
    };

    processPrefill();
  }, [aiPrefill?._ts]);

  const handleEditarPlan = (plan) => {
    setPlanEditando(plan)
    setShowPlanModal(true)
  }

  const handleVerDetalle = async (plan) => {
    try {
      const detallePlan = await planVehiculoService.obtenerPlanVehiculo(
        tenantSlug,
        plan.id
      )
      setPlanSeleccionado(detallePlan)
      setShowDetalleModal(true)
    } catch (err) {
      console.error('Error al cargar detalle del plan:', err)
    }
  }

  const handleCambiarEstado = (plan) => {
    setPlanSeleccionado(plan)
    setShowEstadoModal(true)
  }

  const handleAgregarDetalle = (plan) => {
    setPlanSeleccionado(plan)
    setDetalleEditando(null)
    setShowFormDetalleModal(true)
  }

  const handleEditarDetalle = (plan, detalle) => {
    setPlanSeleccionado(plan)
    setDetalleEditando(detalle)
    setShowFormDetalleModal(true)
  }

  const handleCambiarEstadoDetalle = (detalle) => {
    setDetalleSeleccionado(detalle)
    setShowEstadoDetalleModal(true)
  }

  const handlePlanCreatedOrUpdated = async () => {
    setShowPlanModal(false)
    await cargarPlanes()
    if (onSuccess) onSuccess()
  }

  const handleDetalleCreatedOrUpdated = async () => {
    setShowFormDetalleModal(false)
    setPlanSeleccionado(null)
    await cargarPlanes()
    if (onSuccess) onSuccess()
  }

  const handleEstadoChanged = async () => {
    setShowEstadoModal(false)
    setPlanSeleccionado(null)
    await cargarPlanes()
    if (onSuccess) onSuccess()
  }

  const handleEstadoDetalleChanged = async () => {
    setShowEstadoDetalleModal(false)
    setDetalleSeleccionado(null)
    setPlanSeleccionado(null)
    await cargarPlanes()
    if (onSuccess) onSuccess()
  }

  const handleEliminarDetalle = async (detalle) => {
    try {
      await planVehiculoService.eliminarDetallePlanVehiculo(tenantSlug, detalle.id)
      
      // Mostrar notificación de éxito
      alert(` Detalle eliminado exitosamente`)
      
      // Refrescar datos
      setPlanSeleccionado(null)
      await cargarPlanes()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error al eliminar detalle:', err)
      const errorMsg = err.response.data.error || 'No se pudo eliminar el detalle'
      alert(` Error: ${errorMsg}`)
    }
  }

  // Obtener información del vehículo en formato legible
  const obtenerInfoVehiculo = (plan) => {
    if (!plan.vehiculo) return 'N/A'
    const vehiculo = plan.vehiculo
    if (typeof vehiculo === 'object') {
      const placa = vehiculo.placa || ''
      const marca = vehiculo.marca || ''
      const modelo = vehiculo.modelo || ''
      const propietario = vehiculo.propietario.nombres || 'N/A'
      return {
        placa: `${placa} - ${marca} ${modelo}`, propietario : `Propietario: ${propietario}`
      }
    }
    return { placa: vehiculo, propietario: '' }
  }

  // Estados disponibles (según backend)
  const estadosDisponibles = [
    'LIBRE',
    'EN_EJECUCION',
  ]

  return (
    <div className="space-y-6">
      {/* INDICADOR DE SIMULACIÓN IA */}
      <GhostIndicator isSimulating={isSimulating} message="IA trabajando..." />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">
            <ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Plan de Vehículo
          </h1>
          <p className="text-sm text-carbon-600 dark:text-neutral-400 mt-1">
            Gestiona las necesidades y servicios pendientes de cada vehículo
          </p>
        </div>

        {/* CU22: Los planes se crean automáticamente al registrar vehículo - No es posible crear manualmente */}
      </div>

      {/* FILTROS */}
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-sm p-4 space-y-4 border border-neutral-200 dark:border-white/[0.08] transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Buscar (placa, marca, modelo)
            </label>
            <input
              type="text"
              name="search"
              value={filtros.search}
              onChange={handleFilterChange}
              placeholder="Buscar..."
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Estado
            </label>
            <select
              name="estadoFiltro"
              value={filtros.estadoFiltro}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            >
              <option value="">Todos</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenar */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Ordenar por
            </label>
            <select
              name="ordering"
              value={filtros.ordering}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            >
              <option value="-created_at">Más recientes</option>
              <option value="created_at">Más antiguos</option>
              <option value="-updated_at">Actualización reciente</option>
              <option value="updated_at">Actualización antigua</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTADO */}
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-sm border border-neutral-200 dark:border-white/[0.08] overflow-hidden transition-colors">
        {loadingPlanes ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
          ) : errorPlanes ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-center">{errorPlanes}</div>
          ) : planes.length === 0 ? (
          <div className="p-8 text-center text-carbon-600 dark:text-neutral-400">
            <p className="text-lg">No hay planes de vehículos registrados</p>
            <p className="text-sm mt-2">Los planes se crean automáticamente al registrar un vehículo en "Gestionar Vehículos"</p>
          </div>
              ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-carbon-700 border-b border-neutral-200 dark:border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-carbon-900 dark:text-white">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-carbon-900 dark:text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-carbon-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-carbon-900 dark:text-white">
                      <div>
                        <div className="font-semibold">{obtenerInfoVehiculo(plan).placa}</div>
                        <div className="text-xs text-carbon-500 dark:text-neutral-400">{obtenerInfoVehiculo(plan).propietario}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleVerDetalle(plan)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Ver detalle completo del plan"
                        >
                          <Eye className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Ver
                        </button>
                        {canEditPlanVehiculo(user) && (
                          <button
                            onClick={() => handleEditarPlan(plan)}
                            className="px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Editar plan"
                          >
                            <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar
                          </button>
                        )}
                        {canChangePlanVehiculoStatus(user) && (
                          <button
                            onClick={() => handleCambiarEstado(plan)}
                            className="px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                            title="Cambiar estado del plan"
                          >
                            <RefreshCw className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Estado
                          </button>
                        )}
                        {canAddPlanVehiculoDetalle(user) && (
                          <button
                            onClick={() => handleAgregarDetalle(plan)}
                            className="px-3 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                            title="Agregar detalle"
                          >
                            <Plus className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Detalle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALES */}
      {showPlanModal && (
        <PlanVehiculoModal
          tenantSlug={tenantSlug}
          plan={planEditando}
          vehiculos={vehiculos}
          onClose={() => setShowPlanModal(false)}
          onSuccess={handlePlanCreatedOrUpdated}
          aiPrefill={aiPrefill?.type === 'EDITAR_PLAN_VEHICULO' ? aiPrefill : null}
        />
      )}

      {showDetalleModal && planSeleccionado && (
        <PlanVehiculoDetalleModal
          plan={planSeleccionado}
          user={user}
          onClose={() => setShowDetalleModal(false)}
          onEditarDetalle={handleEditarDetalle}
          onCambiarEstadoDetalle={handleCambiarEstadoDetalle}
          onEliminarDetalle={handleEliminarDetalle}
        />
      )}

      {showEstadoModal && planSeleccionado && (
        <CambiarEstadoPlanModal
          tenantSlug={tenantSlug}
          plan={planSeleccionado}
          onClose={() => setShowEstadoModal(false)}
          onSuccess={handleEstadoChanged}
          aiPrefill={aiPrefill?.type === 'CAMBIAR_ESTADO_PLAN_VEHICULO' ? aiPrefill : null}
        />
      )}

      {showEstadoDetalleModal && detalleSeleccionado && (
        <CambiarEstadoDetalleModal
          tenantSlug={tenantSlug}
          detalle={detalleSeleccionado}
          onClose={() => setShowEstadoDetalleModal(false)}
          onSuccess={handleEstadoDetalleChanged}
        />
      )}

      {showFormDetalleModal && planSeleccionado && (
        <PlanVehiculoDetalleFormModal
          user={user}
          tenantSlug={tenantSlug}
          plan={planSeleccionado}
          detalle={detalleEditando}
          onClose={() => setShowFormDetalleModal(false)}
          onSuccess={handleDetalleCreatedOrUpdated}
          aiPrefill={aiPrefill?.type === 'AGREGAR_DETALLE_PLAN_VEHICULO' ? aiPrefill : null}
        />
      )}
    </div>
  )
}

export default PlanVehiculoView
