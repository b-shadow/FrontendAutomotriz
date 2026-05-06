import { useState, useEffect } from 'react'
import { CarFront, ClipboardList, RefreshCw } from 'lucide-react'
import {
  citasPendientes,
  listarRecepciones,
  crearRecepcion,
} from '@/services/recepcionesService'
import RecepcionModalCrear from '@/components/recepciones/RecepcionModalCrear'
import RecepcionLista from '@/components/recepciones/RecepcionLista'
import CitasPendientesLista from '@/components/recepciones/CitasPendientesLista'

export default function RecepcionVehiculoView({ tenantSlug }) {
  const [activeTab, setActiveTab] = useState('pendientes')

  const [citasPend, setCitasPend] = useState([])
  const [loadingCitas, setLoadingCitas] = useState(false)
  const [errorCitas, setErrorCitas] = useState(null)

  const [recepciones, setRecepciones] = useState([])
  const [loadingRecepciones, setLoadingRecepciones] = useState(false)
  const [errorRecepciones, setErrorRecepciones] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [creando, setCreando] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [filtroNivelCombustible, setFiltroNivelCombustible] = useState('')

  useEffect(() => {
    cargarCitasPendientes()
  }, [tenantSlug])

  useEffect(() => {
    if (activeTab === 'historial') {
      cargarRecepciones()
    }
  }, [activeTab, tenantSlug, filtroNivelCombustible])

  const cargarCitasPendientes = async () => {
    setLoadingCitas(true)
    setErrorCitas(null)
    try {
      const data = await citasPendientes(tenantSlug)
      setCitasPend(data.results || data)
    } catch (error) {
      setErrorCitas(error.message || 'Error cargando citas pendientes')
    } finally {
      setLoadingCitas(false)
    }
  }

  const cargarRecepciones = async () => {
    setLoadingRecepciones(true)
    setErrorRecepciones(null)
    try {
      const data = await listarRecepciones(tenantSlug, {
        nivel_combustible: filtroNivelCombustible || undefined,
      })
      setRecepciones(data.results || data)
    } catch (error) {
      setErrorRecepciones(error.message || 'Error cargando recepciones')
    } finally {
      setLoadingRecepciones(false)
    }
  }

  const abrirModalRecepcion = (cita) => {
    setCitaSeleccionada(cita)
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setCitaSeleccionada(null)
  }

  const handleCrearRecepcion = async (datosRecepcion) => {
    setCreando(true)
    try {
      await crearRecepcion(tenantSlug, datosRecepcion)
      cerrarModal()
      await cargarCitasPendientes()
      if (activeTab === 'historial') {
        await cargarRecepciones()
      }
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 3000)
    } catch (error) {
      console.error('Error creando recepcion:', error)
      alert('Error: ' + (error.response.data.cita_id[0] || error.message))
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white flex items-center gap-2">
          <CarFront size={22} /> Recepcion de Vehiculos
        </h1>
        <p className="text-carbon-600 dark:text-neutral-400">
          Registra la llegada de vehiculos y sus observaciones iniciales
        </p>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg shadow-sm border border-neutral-200/60 dark:border-white/[0.06] p-2">
        <div className="flex gap-2 border-b border-neutral-200/70 dark:border-white/[0.08] px-2">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'pendientes' ?
                 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-carbon-600 dark:text-neutral-400 hover:text-carbon-900 dark:hover:text-neutral-300'
            }`}
          >
            Citas Pendientes ({citasPend.length})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'historial' ?
                 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-carbon-600 dark:text-neutral-400 hover:text-carbon-900 dark:hover:text-neutral-300'
            }`}
          >
            <span className="inline-flex items-center gap-2"><ClipboardList size={16} /> Historial</span>
          </button>
        </div>
      </div>

      {activeTab === 'pendientes' && (
        <div className="bg-white dark:bg-carbon-900 rounded-lg shadow border border-neutral-200/60 dark:border-white/[0.06] p-4">
          {loadingCitas ? (
            <div className="flex justify-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-neutral-300 dark:border-white/[0.08] border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : errorCitas ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-red-700 dark:text-red-300">
              {errorCitas}
            </div>
          ) : citasPend.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30 rounded-lg p-6 text-center">
              <p className="text-green-700 dark:text-green-300 font-medium">
                No hay citas pendientes de recibir
              </p>
            </div>
              ) : (
            <CitasPendientesLista citas={citasPend} onRegistrarRecepcion={abrirModalRecepcion} />
          )}
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-carbon-900 rounded-lg shadow-sm border border-neutral-200/60 dark:border-white/[0.06] p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
                Nivel de Combustible
              </label>
              <select
                value={filtroNivelCombustible}
                onChange={(e) => setFiltroNivelCombustible(e.target.value)}
                className="input min-w-[180px]"
              >
                <option value="">Todos</option>
                <option value="1/4">1/4 de tanque</option>
                <option value="1/2">1/2 de tanque</option>
                <option value="3/4">3/4 de tanque</option>
                <option value="LLENO">Lleno</option>
              </select>
            </div>
            <button
              onClick={cargarRecepciones}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>

          <div className="bg-white dark:bg-carbon-900 rounded-lg shadow border border-neutral-200/60 dark:border-white/[0.06] p-4">
            {loadingRecepciones ? (
              <div className="flex justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-neutral-300 dark:border-white/[0.08] border-t-primary-500 rounded-full animate-spin" />
              </div>
          ) : errorRecepciones ? (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-red-700 dark:text-red-300">
                {errorRecepciones}
              </div>
          ) : recepciones.length === 0 ? (
              <div className="bg-neutral-100 dark:bg-carbon-800 rounded-lg p-8 text-center text-carbon-600 dark:text-neutral-400">
                No hay recepciones registradas
              </div>
              ) : (
              <RecepcionLista recepciones={recepciones} />
            )}
          </div>
        </div>
      )}

      {showModal && citaSeleccionada && (
        <RecepcionModalCrear
          cita={citaSeleccionada}
          onClose={cerrarModal}
          onSubmit={handleCrearRecepcion}
          isLoading={creando}
        />
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-carbon-900 rounded-lg shadow-2xl p-8 max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-carbon-900 dark:text-white mb-2">
              Recepcion Registrada
            </h3>
            <p className="text-center text-sm text-carbon-600 dark:text-neutral-400 mb-6">
              La recepcion del vehiculo se registro exitosamente y la cita fue actualizada.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
