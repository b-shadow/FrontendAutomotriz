/**
 * HorarioGrid.jsx - Visualización semanal de horarios en grid
 * Muestra los horarios activos de un espacio en una tabla semanal
 *
 * Props:
 * - horarios: array de horarios
 * - startHour: hora de inicio (default: auto-detectada o 6)
 *   - Si es null, se calcula automáticamente basado en los horarios
 *   - Si no hay horarios, usa 6 como fallback
 * - endHour: hora de fin (default: auto-detectada o 22)
 *   - Si es null, se calcula automáticamente basado en los horarios
 *   - Si no hay horarios, usa 22 como fallback
 * - slotMinutes: minutos por slot (default 60)
 *
 * Comportamiento:
 * 1. Si hay horarios activos: muestra solo las horas usadas (min-max)
 * 2. Si no hay horarios: muestra 6:00 - 22:00
 * 3. Puede forzarse un rango pasando startHour y endHour explícitamente
 */
import React from 'react'

const DAYS = [
  { value: 0, label: 'Lun' },
  { value: 1, label: 'Mar' },
  { value: 2, label: 'Mié' },
  { value: 3, label: 'Jue' },
  { value: 4, label: 'Vie' },
  { value: 5, label: 'Sáb' },
  { value: 6, label: 'Dom' },
]

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const formatMinutesToHour = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const HorarioGrid = ({
  horarios = [],
  startHour = null,
  endHour = null,
  slotMinutes = 60,
}) => {
  // Calcular rango de horas automáticamente basado en los horarios
  let finalStartHour = startHour
  let finalEndHour = endHour

  if (horarios.length > 0 && (startHour === null || endHour === null)) {
    const horariosActivos = horarios.filter((h) => h.activo)
    
    if (horariosActivos.length > 0) {
      const horas = horariosActivos.flatMap((h) => {
        const inicio = parseTimeToMinutes(h.hora_inicio)
        const fin = parseTimeToMinutes(h.hora_fin)
        return [inicio, fin]
      })

      const minMinutes = Math.min(...horas)
      const maxMinutes = Math.max(...horas)
      
      // Redondear hacia abajo para el inicio, hacia arriba para el fin
      finalStartHour = Math.floor(minMinutes / 60)
      finalEndHour = Math.ceil(maxMinutes / 60)
    }
  }

  // Fallback a 6:00 - 22:00 si no hay horarios o no se pudo calcular
  if (finalStartHour === null || finalStartHour === undefined) finalStartHour = 6
  if (finalEndHour === null || finalEndHour === undefined) finalEndHour = 22

  const startMinutes = finalStartHour * 60
  const endMinutes = finalEndHour * 60

  const timeSlots = []
  for (let m = startMinutes; m < endMinutes; m += slotMinutes) {
    timeSlots.push(m)
  }

  const getBlockForDayAndTime = (day, time) => {
    return horarios.find((h) => {
      if (Number(h.dia_semana) !== day) return false
      if (!h.activo) return false

      const inicio = parseTimeToMinutes(h.hora_inicio)
      const fin = parseTimeToMinutes(h.hora_fin)

      return time >= inicio && time < fin
    })
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 w-full">
      {/* Contenedor responsive */}
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
          <div className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 lg:p-4 text-xs sm:text-xs lg:text-xs font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
            Hora
          </div>
          {DAYS.map((day) => (
            <div
              key={day.value}
              className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 lg:p-4 text-center text-xs sm:text-xs lg:text-xs font-bold text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-slate-700"
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div>
          {timeSlots.map((time) => (
            <div
              key={time}
              className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 text-xs sm:text-xs lg:text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                {formatMinutesToHour(time)}
              </div>

              {DAYS.map((day) => {
                const block = getBlockForDayAndTime(day.value, time)

                return (
                  <div
                    key={`${day.value}-${time}`}
                    className={`relative min-h-[40px] sm:min-h-[60px] lg:min-h-[80px] border-l border-slate-100 dark:border-slate-800 p-1 sm:p-2 lg:p-3 flex items-center justify-center ${
                      block
                        ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {block && (
                      <div className="w-full rounded-xl border-3 border-emerald-400 dark:border-emerald-600 bg-emerald-500 dark:bg-emerald-600 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-center text-white shadow-lg">
                        <div className="font-bold text-xs sm:text-xs lg:text-xs">
                          {block.hora_inicio?.slice(0, 5)} - {block.hora_fin?.slice(0, 5)}
                        </div>
                        <div className="mt-1 text-xs opacity-95 font-medium">
                          {block.dia_semana_display || 'Activo'}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HorarioGrid
