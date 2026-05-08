import { useState, useEffect } from 'react'
import HorarioBloquesEditor from '../../components/espacios/HorarioBloquesEditor'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import { canManageHorariosEspacio } from '../../utils/roleHelper'

export const HorariosGeneralesView = ({ user, tenantSlug }) => {
  const [espacios, setEspacios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [error, setError] = useState(null)
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

  const loadEspacios = async () => {
    try {
      setLoadingEspacios(true)
      setError(null)
      const data = await espaciosTrabajoService.listarEspacios(tenantSlug, { search: '', ordering: 'nombre' })
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

  const guardarBloques = async (selectionByDay) => {
    if (!selectedEspacioId) return

    try {
      setIsSaving(true)
      setError(null)

      for (let dia = 0; dia < 7; dia += 1) {
        await espaciosTrabajoService.reemplazarHorariosPorBloques(tenantSlug, selectedEspacioId, {
          dia_semana: dia,
          bloques_inicio_min: selectionByDay[dia] || [],
        })
      }

      await loadHorarios()
    } catch (err) {
      console.error('Error al guardar bloques:', err)
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
          <p className="text-carbon-600 dark:text-neutral-400 mt-1">Gestiona los horarios de los espacios de trabajo por bloques de 30 minutos</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-3">
          Seleccionar Espacio de Trabajo
        </label>

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
            className="w-full px-4 py-2 border border-neutral-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre} {espacio.codigo ? `(${espacio.codigo})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedEspacioId && (
        <div className="bg-white dark:bg-carbon-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-carbon-900 dark:text-white mb-4">
            Horarios de {selectedEspacio?.nombre}
          </h2>

          {loadingHorarios ? (
            <div className="flex justify-center py-8">
              <p className="text-carbon-600 dark:text-neutral-400">Cargando horarios...</p>
            </div>
          ) : (
            <HorarioBloquesEditor
              horarios={horarios}
              canManage={canManage}
              isSaving={isSaving}
              onSave={guardarBloques}
            />
          )}
        </div>
      )}
    </div>
  )
}

