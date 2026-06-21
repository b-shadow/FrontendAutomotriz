import { Database, Plus, Search, Calendar, RefreshCw, X, Download, HardDrive, ShieldAlert, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import backupsService from '../../services/backupsService'

const GestionBackupView = ({ aiPrefill }) => {
  const { tenantSlug } = useTenant()
  const [backups, setBackups] = useState([])
  const [programacion, setProgramacion] = useState({
    activo: false,
    frecuencia: 'DIARIO',
    intervalo_dias: 1,
    hora_ejecucion: '02:00:00',
    tolera_compensacion: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [backupPreview, setBackupPreview] = useState(null)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoreText, setRestoreText] = useState('')
  const [backupToRestore, setBackupToRestore] = useState(null)
  const [submitBtn, setSubmitBtn] = useState(null)

  useGhostAutomation({
    aiPrefill,
    isModalOpen: true,
    setModalOpen: () => {},
    setForm: setProgramacion,
    submitBtnRef: { current: submitBtn },
    actionType: 'CONFIGURAR_BACKUP',
    fieldMapping: {
      activo: 'activo',
      frecuencia: 'frecuencia',
      hora_ejecucion: 'hora_ejecucion',
      compensar_pendientes: 'tolera_compensacion'
    }
  })

  const cargar = async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const [listado, prog] = await Promise.all([
        backupsService.listar(tenantSlug),
        backupsService.obtenerProgramacion(tenantSlug),
      ])
      setBackups(listado.results || listado || [])
      if (prog) {
        setProgramacion((p) => ({ ...p, ...prog }))
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error cargando backups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [tenantSlug])

  const crearManual = async () => {
    try {
      await backupsService.crearManual(tenantSlug, { alcance: 'TENANT_COMPLETO' })
      setSuccess('Backup manual creado')
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear backup manual')
    }
  }

  const guardarProgramacion = async () => {
    try {
      await backupsService.guardarProgramacion(tenantSlug, {
        ...programacion,
        intervalo_dias: Number(programacion.intervalo_dias || 1),
      })
      setSuccess('Programación de backups guardada')
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar programación')
    }
  }

  const ejecutarPendientes = async () => {
    try {
      const res = await backupsService.ejecutarPendientes(tenantSlug)
      setSuccess(`Compensación ejecutada. Backups creados: ${res.ejecutados}`)
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo ejecutar compensación')
    }
  }

  const descargarBackup = async (backup) => {
    try {
      const blob = await backupsService.descargar(tenantSlug, backup.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fallbackName = `backup_${backup.id}.json.gz`
      const filename = backup.archivo_path ? backup.archivo_path.split('/').pop() : fallbackName
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          setError(parsed?.error || 'No se pudo descargar el backup')
          return
        } catch {
          setError('No se pudo descargar el backup')
          return
        }
      }
      setError(err.response?.data?.error || 'No se pudo descargar el backup')
    }
  }

  const visualizarBackup = async (backup) => {
    try {
      const data = await backupsService.visualizar(tenantSlug, backup.id)
      setBackupPreview({
        nombre: backup.archivo_path || `backup_${backup.id}.json.gz`,
        contenido: JSON.stringify(data, null, 2),
      })
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo visualizar el backup')
    }
  }

  const restaurarBackup = async (backup) => {
    setBackupToRestore(backup)
    setRestoreText('')
    setRestoreModalOpen(true)
  }

  const confirmarRestauracion = async () => {
    if (restoreText !== 'RESTAURAR' || !backupToRestore) {
      return
    }
    try {
      const res = await backupsService.restaurar(tenantSlug, backupToRestore.id, { confirmacion: 'RESTAURAR' })
      setSuccess(`Restauracion completada. Registros restaurados: ${res?.resultado?.total_registros ?? 0}`)
      cargar()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restaurar el backup')
    } finally {
      setRestoreModalOpen(false)
      setBackupToRestore(null)
      setRestoreText('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Gestionar Backup</h1>
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] space-y-4">
        <h2 className="text-lg font-semibold">Programación automática por empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!programacion.activo}
              onChange={(e) => setProgramacion((p) => ({ ...p, activo: e.target.checked }))}
            />
            Activo
          </label>

          <select
            value={programacion.frecuencia || 'DIARIO'}
            onChange={(e) => setProgramacion((p) => ({ ...p, frecuencia: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          >
            <option value="DIARIO">Diario</option>
            <option value="CADA_N_DIAS">Cada N días</option>
          </select>

          <input
            type="number"
            min="1"
            value={programacion.intervalo_dias || 1}
            onChange={(e) => setProgramacion((p) => ({ ...p, intervalo_dias: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            placeholder="Intervalo días"
            disabled={programacion.frecuencia !== 'CADA_N_DIAS'}
          />

          <input
            type="time"
            value={(programacion.hora_ejecucion || '02:00:00').slice(0, 5)}
            onChange={(e) => setProgramacion((p) => ({ ...p, hora_ejecucion: `${e.target.value}:00` }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!programacion.tolera_compensacion}
              onChange={(e) => setProgramacion((p) => ({ ...p, tolera_compensacion: e.target.checked }))}
            />
            Compensar pendientes
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-carbon-700 dark:text-neutral-300">
          <div>
            <strong>Última ejecución:</strong>{' '}
            {programacion.ultima_ejecucion_at ? new Date(programacion.ultima_ejecucion_at).toLocaleString() : 'Sin ejecuciones'}
          </div>
          <div>
            <strong>Próxima ejecución:</strong>{' '}
            {programacion.proxima_ejecucion_at ? new Date(programacion.proxima_ejecucion_at).toLocaleString() : 'No programada'}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={guardarProgramacion} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">Guardar programación</button>
          <button onClick={ejecutarPendientes} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Ejecutar pendientes</button>
          <button onClick={crearManual} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">Crear backup manual</button>
        </div>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando backups...</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">No hay backups registrados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-4 py-3 text-left">Fecha inicio</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Tamaño</th>
                <th className="px-4 py-3 text-left">Archivo</th>
                <th className="px-4 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3">{new Date(b.iniciado_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{b.tipo}</td>
                  <td className="px-4 py-3">{b.estado}</td>
                  <td className="px-4 py-3">{b.tamano_bytes || 0}</td>
                  <td className="px-4 py-3">{b.archivo_path || '-'}</td>
                  <td className="px-4 py-3">
                    {b.archivo_path && b.estado === 'COMPLETADO' ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => visualizarBackup(b)} className="text-emerald-600 hover:text-emerald-800">
                          Visualizar
                        </button>
                        <button onClick={() => descargarBackup(b)} className="text-primary-600 hover:text-primary-800">
                          Descargar
                        </button>
                        <button onClick={() => restaurarBackup(b)} className="text-amber-600 hover:text-amber-800">
                          Restaurar
                        </button>
                      </div>
                    ) : (
                      <span className="text-carbon-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {backupPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[85vh] bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold">Vista backup: {backupPreview.nombre}</h3>
              <button onClick={() => setBackupPreview(null)} className="text-carbon-500 hover:text-carbon-800 dark:text-neutral-300 dark:hover:text-white">Cerrar</button>
            </div>
            <pre className="p-4 text-xs overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
              {backupPreview.contenido}
            </pre>
          </div>
        </div>
      )}

      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-carbon-900">
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
              Confirmar restauracion
            </h2>
            <p className="text-carbon-600 dark:text-neutral-400 mb-4 text-sm">
              Esta accion eliminara y restaurara los datos de ESTA empresa. Escribe <strong>RESTAURAR</strong> para confirmar.
            </p>
            <input
              type="text"
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              placeholder="Escribe RESTAURAR"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-carbon-900 focus:ring-2 focus:ring-primary-500 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setRestoreModalOpen(false)
                  setBackupToRestore(null)
                  setRestoreText('')
                }}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 font-semibold text-carbon-900 transition hover:bg-neutral-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRestauracion}
                disabled={restoreText !== 'RESTAURAR'}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionBackupView
