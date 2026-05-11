/**
 * HorariosGeneralesView.jsx - Vista centralizada de Horarios
 */
import { useState, useEffect } from 'react'
import { HorarioEspacioModal } from '../../components/espacios/HorarioEspacioModal'
import HorarioBloquesEditor from '../../components/espacios/HorarioBloquesEditor'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import { canManageHorariosEspacio } from '../../utils/roleHelper'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const HorariosGeneralesView = ({ user, tenantSlug, aiPrefill, onSuccess }) => {
  const [espacios, setEspacios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState(null)
  const [selectedEspacioId, setSelectedEspacioId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = canManageHorariosEspacio(user)

  useEffect(() => {
    loadEspacios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedEspacioId) loadHorarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEspacioId])

  useEffect(() => {
    if (!aiPrefill) return
    if (espacios.length === 0 || loadingEspacios) return

    const identificador = (aiPrefill.espacio_identificador || '').toLowerCase()
    const espacioEncontrado = espacios.find(
      (e) =>
        e.codigo.toLowerCase() === identificador ||
        e.nombre.toLowerCase() === identificador ||
        e.nombre.toLowerCase().includes(identificador)
    )

    if (!espacioEncontrado) return

    if (selectedEspacioId !== espacioEncontrado.id) {
      setSelectedEspacioId(espacioEncontrado.id)
    }

    if (aiPrefill.type === 'VER_HORARIOS_ESPACIO') {
      if (onSuccess && aiPrefill.status === 'EJECUTADA') onSuccess()
    } else if (aiPrefill.type === 'AGREGAR_HORARIO_ESPACIO') {
      if (!isModalOpen) handleOpenModal(null)
    } else if (aiPrefill.type === 'EDITAR_HORARIO_ESPACIO') {
      if (loadingHorarios || !aiPrefill.dia) return
      const diaStr = aiPrefill.dia.toLowerCase()
      const diaIndex = DIAS_SEMANA.findIndex((d) => d.toLowerCase() === diaStr)
      if (diaIndex !== -1) {
        const horarioEncontrado = horarios.find((h) => h.dia_semana === diaIndex)
        if (horarioEncontrado && !isModalOpen) handleOpenModal(horarioEncontrado)
      }
    }
  }, [aiPrefill, espacios, loadingEspacios, loadingHorarios, horarios, isModalOpen, selectedEspacioId, onSuccess])

  const loadEspacios = async () => {
    try {
      setLoadingEspacios(true)
      setError(null)
      const data = await espaciosTrabajoService.listarEspacios(tenantSlug, {
        search: '',
        ordering: 'nombre',
      })

      const espaciosList = data.espacios || []
      setEspacios(espaciosList)

      if (espaciosList.length > 0 && !selectedEspacioId) {
        setSelectedEspacioId(espaciosList[0].id)
      }
    } catch (err) {
      console.error('Error al cargar espacios:', err)
      setError('No se pudieron cargar los espacios de trabajo')
    } finally {
      setLoadingEspacios(false)
    }
  }

  const loadHorarios = async () => {
    if (!selectedEspacioId) return

    try {
      setLoadingHorarios(true)
      setError(null)
      const data = await espaciosTrabajoService.listarHorariosEspacio(tenantSlug, selectedEspacioId)
      setHorarios(data.horarios || [])
    } catch (err) {
      console.error('Error al cargar horarios:', err)
      setError('No se pudieron cargar los horarios')
    } finally {
      setLoadingHorarios(false)
    }
  }

  const handleOpenModal = (horario = null) => {
    setSelectedHorario(horario)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHorario(null)
  }

  const handleSaveHorario = async (payload) => {
    try {
      setIsSaving(true)
      const isEditing = selectedHorario !== null

      if (isEditing) {
        await espaciosTrabajoService.editarHorarioEspacio(tenantSlug, selectedEspacioId, selectedHorario.id, payload)
      } else {
        await espaciosTrabajoService.crearHorarioEspacio(tenantSlug, selectedEspacioId, payload)
      }

      await loadHorarios()
      handleCloseModal()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error al guardar horario:', err)
      setError('No se pudo guardar el horario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGuardarBloques = async (payloadPorDia) => {
    if (!selectedEspacioId) return

    try {
      setIsSaving(true)
      setError(null)

      const dias = [0, 1, 2, 3, 4, 5, 6]
      await Promise.all(
        dias.map((dia) =>
          espaciosTrabajoService.reemplazarHorariosPorBloques(tenantSlug, selectedEspacioId, {
            dia_semana: dia,
            bloques_inicio_min: payloadPorDia[dia] || [],
          })
        )
      )

      await loadHorarios()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error al guardar horarios por bloques:', err)
      setError('No se pudieron guardar los horarios por bloques')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedEspacio = espacios.find((e) => e.id === selectedEspacioId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Horarios</h1>
          <p className="text-carbon-600 dark:text-neutral-400 mt-1">Gestiona los horarios de los espacios de trabajo</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-3">Seleccionar Espacio de Trabajo</label>

        {loadingEspacios ? (
          <div className="text-center py-4">
            <p className="text-carbon-600 dark:text-neutral-400">Cargando espacios...</p>
          </div>
        ) : espacios.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-carbon-600 dark:text-neutral-400">No hay espacios de trabajo disponibles</p>
          </div>
        ) : (
          <select
            value={selectedEspacioId || ''}
            onChange={(e) => setSelectedEspacioId(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white"
          >
            {espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre} {espacio.codigo ? `(${espacio.codigo})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedEspacioId && selectedEspacio && (
        <div className="bg-white dark:bg-carbon-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-carbon-900 dark:text-white">Horarios de {selectedEspacio.nombre}</h2>
            {canManage && (
              <button
                onClick={() => handleOpenModal(null)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSaving || loadingHorarios}
              >
                + Agregar Horario
              </button>
            )}
          </div>

          {loadingHorarios ? (
            <div className="flex justify-center py-8">
              <p className="text-carbon-600 dark:text-neutral-400">Cargando horarios...</p>
            </div>
          ) : (
            <div className="p-6">
              <HorarioBloquesEditor
                horarios={horarios}
                canManage={canManage}
                isSaving={isSaving}
                onSave={handleGuardarBloques}
              />
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedEspacioId && (
        <HorarioEspacioModal
          isOpen={isModalOpen}
          horario={selectedHorario}
          onClose={handleCloseModal}
          onSave={handleSaveHorario}
          isLoading={isSaving}
          aiPrefill={aiPrefill && ['AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO'].includes(aiPrefill.type) ? aiPrefill : null}
        />
      )}
    </div>
  )
}
