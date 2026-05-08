import { useState, useEffect } from 'react'
import HorarioBloquesEditor from './HorarioBloquesEditor'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import { canManageHorariosEspacio } from '../../utils/roleHelper'

const HorariosEspacioPanel = ({ espacio, user, tenantSlug }) => {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = canManageHorariosEspacio(user)

  useEffect(() => {
    loadHorarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio.id])

  const loadHorarios = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await espaciosTrabajoService.listarHorariosEspacio(tenantSlug, espacio.id)
      setHorarios(data.horarios || [])
    } catch (err) {
      console.error('Error al cargar horarios:', err)
      setError('No se pudieron cargar los horarios')
    } finally {
      setLoading(false)
    }
  }

  const guardarBloques = async (selectionByDay) => {
    try {
      setIsSaving(true)
      setError(null)

      for (let dia = 0; dia < 7; dia += 1) {
        await espaciosTrabajoService.reemplazarHorariosPorBloques(tenantSlug, espacio.id, {
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

  return (
    <div className="space-y-4 w-full h-full max-w-none">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-carbon-900 dark:text-white">
          Horarios - {espacio.nombre}
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-carbon-600 dark:text-neutral-400">Cargando horarios...</div>
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
  )
}

export default HorariosEspacioPanel
export { HorariosEspacioPanel }

