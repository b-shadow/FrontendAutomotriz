import { useEffect, useMemo, useState } from 'react'

const DIAS = [
  { value: 0, label: 'Lun' },
  { value: 1, label: 'Mar' },
  { value: 2, label: 'Mie' },
  { value: 3, label: 'Jue' },
  { value: 4, label: 'Vie' },
  { value: 5, label: 'Sab' },
  { value: 6, label: 'Dom' },
]

const BLOQUE_MINUTOS = 30
const MINUTOS_DIA = 24 * 60

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

const formatMinutes = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

const slots = Array.from({ length: MINUTOS_DIA / BLOQUE_MINUTOS }, (_, i) => i * BLOQUE_MINUTOS)

const expandirHorariosABloques = (horarios) => {
  const state = {}
  for (let d = 0; d < 7; d += 1) state[d] = new Set()

  ;(horarios || []).forEach((h) => {
    if (!h.activo) return
    const dia = Number(h.dia_semana)
    const ini = parseTimeToMinutes(h.hora_inicio)
    const fin = parseTimeToMinutes(h.hora_fin)
    for (let m = ini; m < fin; m += BLOQUE_MINUTOS) {
      if (m >= 0 && m < MINUTOS_DIA) state[dia].add(m)
    }
  })

  return state
}

const HorarioBloquesEditor = ({ horarios = [], canManage = false, isSaving = false, onSave }) => {
  const [selection, setSelection] = useState(() => expandirHorariosABloques(horarios))

  useEffect(() => {
    setSelection(expandirHorariosABloques(horarios))
  }, [horarios])

  const totalBloques = useMemo(
    () => Object.values(selection).reduce((acc, set) => acc + set.size, 0),
    [selection]
  )

  const toggleBloque = (dia, minuto) => {
    if (!canManage || isSaving) return
    setSelection((prev) => {
      const next = { ...prev, [dia]: new Set(prev[dia]) }
      if (next[dia].has(minuto)) next[dia].delete(minuto)
      else next[dia].add(minuto)
      return next
    })
  }

  const handleSave = () => {
    if (!canManage || !onSave) return

    const payload = {}
    for (let d = 0; d < 7; d += 1) {
      payload[d] = Array.from(selection[d] || []).sort((a, b) => a - b)
    }
    onSave(payload)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-carbon-600 dark:text-neutral-400">
          Bloques seleccionados: <strong>{totalBloques}</strong> ({BLOQUE_MINUTOS} min c/u)
        </p>
        {canManage && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        )}
      </div>

      <div className="overflow-auto rounded-xl border border-neutral-200 dark:border-white/[0.08]">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-8 border-b border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-carbon-800">
            <div className="p-2 text-xs font-semibold text-carbon-700 dark:text-neutral-200">Hora</div>
            {DIAS.map((d) => (
              <div key={d.value} className="p-2 text-xs font-semibold text-center text-carbon-700 dark:text-neutral-200 border-l border-neutral-200 dark:border-white/[0.08]">
                {d.label}
              </div>
            ))}
          </div>

          {slots.map((slot) => (
            <div key={slot} className="grid grid-cols-8 border-b border-neutral-100 dark:border-white/[0.06]">
              <div className="p-2 text-xs text-carbon-600 dark:text-neutral-400 bg-white dark:bg-carbon-900">
                {formatMinutes(slot)}
              </div>
              {DIAS.map((d) => {
                const selected = selection[d.value]?.has(slot)
                return (
                  <button
                    key={`${d.value}-${slot}`}
                    type="button"
                    onClick={() => toggleBloque(d.value, slot)}
                    disabled={!canManage || isSaving}
                    className={`h-9 border-l border-neutral-100 dark:border-white/[0.06] transition-colors ${
                      selected
                        ? 'bg-emerald-500/85 hover:bg-emerald-600/85'
                        : 'bg-white dark:bg-carbon-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
                    } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                    title={`${d.label} ${formatMinutes(slot)} - ${formatMinutes(slot + BLOQUE_MINUTOS)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HorarioBloquesEditor
