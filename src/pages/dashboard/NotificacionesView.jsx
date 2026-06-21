import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Mailbox, RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui'
import notificacionesService from '../../services/notificacionesService'

const formatDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export const NotificacionesView = ({ tenantSlug }) => {
  const [items, setItems] = useState([])
  const [resumen, setResumen] = useState({ total: 0, no_leidas: 0 })
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState(null)
  const [error, setError] = useState('')

  const cargar = async () => {
    if (!tenantSlug) return
    setLoading(true)
    setError('')
    try {
      const [notificaciones, resumenData] = await Promise.all([
        notificacionesService.listar(tenantSlug),
        notificacionesService.resumen(tenantSlug),
      ])
      setItems(notificaciones)
      setResumen(resumenData)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudieron cargar las notificaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [tenantSlug])

  useEffect(() => {
    const handler = () => cargar()
    window.addEventListener('firebase-foreground-message', handler)
    return () => window.removeEventListener('firebase-foreground-message', handler)
  }, [tenantSlug])

  const marcarLeida = async (id) => {
    setWorkingId(id)
    try {
      const actualizada = await notificacionesService.marcarLeida(tenantSlug, id)
      setItems((prev) => prev.map((item) => (item.id === id ? actualizada : item)))
      setResumen((prev) => ({
        ...prev,
        no_leidas: Math.max(0, prev.no_leidas - 1),
      }))
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudo marcar la notificación como leída.')
    } finally {
      setWorkingId(null)
    }
  }

  const marcarTodas = async () => {
    setWorkingId('ALL')
    try {
      await notificacionesService.marcarTodasLeidas(tenantSlug)
      setItems((prev) => prev.map((item) => ({ ...item, leida: true, leida_at: item.leida_at || new Date().toISOString() })))
      setResumen((prev) => ({ ...prev, no_leidas: 0 }))
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudieron marcar todas como leídas.')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-carbon-900"><Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Centro de Notificaciones</h1>
          <p className="text-carbon-600 mt-1">Historial operativo y alertas de tu empresa.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cargar}
            className="px-4 py-2 rounded-lg border border-carbon-200 bg-white hover:bg-carbon-50"
          >
            <RefreshCw className="inline-block mx-1 text-current" size={18} strokeWidth={2} /> Actualizar
          </button>
          <button
            type="button"
            onClick={marcarTodas}
            disabled={workingId === 'ALL' || resumen.no_leidas === 0}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            <CheckCheck className="inline-block mx-1 text-current" size={18} strokeWidth={2} /> Marcar todas leídas
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm text-carbon-600">Total</div>
          <div className="text-3xl font-bold text-carbon-900">{resumen.total}</div>
        </Card>
        <Card>
          <div className="text-sm text-carbon-600">No leídas</div>
          <div className="text-3xl font-bold text-carbon-900">{resumen.no_leidas}</div>
        </Card>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>
      ) : null}

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-carbon-900"><Mailbox className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Historial</h2>
          {loading ? <span className="text-sm text-carbon-500">Cargando...</span> : null}
        </div>

        {!loading && items.length === 0 ? (
          <div className="text-carbon-600">No hay notificaciones registradas todavía.</div>
        ) : null}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 ${item.leida ? 'border-carbon-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-carbon-900">{item.titulo}</h3>
                    {!item.leida ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">Nueva</span> : null}
                  </div>
                  <p className="text-carbon-700">{item.mensaje}</p>
                  <div className="text-xs text-carbon-500">
                    <span>{item.tipo}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(item.created_at)}</span>
                    {item.leida_at ? (
                      <>
                        <span className="mx-2">•</span>
                        <span>Leída: {formatDate(item.leida_at)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                {!item.leida ? (
                  <button
                    type="button"
                    onClick={() => marcarLeida(item.id)}
                    disabled={workingId === item.id}
                    className="px-3 py-2 rounded-lg bg-carbon-900 text-white disabled:opacity-50"
                  >
                    Marcar leída
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
