import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const CajaMovimientosView = ({ aiPrefill }) => {
  const { tenantSlug, user } = useTenant()
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, ajustes: 0, saldo: 0 })
  const [movimientos, setMovimientos] = useState([])
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const calcularResumenDesdeMovimientos = (rows) => {
    const base = { ingresos: 0, egresos: 0, ajustes: 0, saldo: 0 }
    const totals = (rows || []).reduce((acc, m) => {
      const monto = Number(m?.monto || 0)
      if (m?.tipo === 'INGRESO') acc.ingresos += monto
      else if (m?.tipo === 'EGRESO') acc.egresos += monto
      else if (m?.tipo === 'AJUSTE') acc.ajustes += monto
      return acc
    }, base)
    totals.saldo = totals.ingresos - totals.egresos + totals.ajustes
    return totals
  }

  const cargar = useCallback(async () => {
    setError(null)
    setInfo(null)
    try {
      const cajas = await inventarioService.listarCajas(tenantSlug)
      const cajasRows = cajas.results || cajas || []
      const miCajaActiva = cajasRows.find((c) => c.activa && String(c.administrativo) === String(user?.id))
      if (!miCajaActiva) {
        setInfo('No tienes una caja activa asignada. Mostrando movimientos generales.')
        const data = await inventarioService.listarMovimientosCaja(tenantSlug)
        const rows = data.results || data || []
        setMovimientos(rows)
        setResumen(calcularResumenDesdeMovimientos(rows))
        return
      }

      const miCaja = await inventarioService.miCaja(tenantSlug)
      setResumen(miCaja.resumen || { ingresos: 0, egresos: 0, ajustes: 0, saldo: 0 })
      setMovimientos(miCaja.movimientos || [])
    } catch (err) {
      try {
        if (err?.response?.status === 404) {
          setInfo('No tienes una caja activa asignada. Mostrando movimientos generales.')
        }
        const data = await inventarioService.listarMovimientosCaja(tenantSlug)
        const rows = data.results || data || []
        setMovimientos(rows)
        setResumen(calcularResumenDesdeMovimientos(rows))
      } catch {
        setError('No se pudo cargar caja y movimientos')
      }
    }
  }, [tenantSlug, user?.id])

  useEffect(() => { cargar() }, [cargar])

  const totals = useMemo(() => ({
    ingresos: Number(resumen.ingresos || 0),
    egresos: Number(resumen.egresos || 0),
    ajustes: Number(resumen.ajustes || 0),
    saldo: Number(resumen.saldo || 0),
  }), [resumen])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Caja y Movimientos</h1>
      {info && <div className="rounded-lg bg-amber-50 px-4 py-2 text-amber-700">{info}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Ingresos" value={totals.ingresos} color="text-green-600" />
        <Stat label="Egresos" value={totals.egresos} color="text-red-600" />
        <Stat label="Ajustes" value={totals.ajustes} color="text-amber-600" />
        <Stat label="Saldo" value={totals.saldo} color="text-primary-600" />
      </div>
      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"><BarChart3 size={18} /></div>
          <div><h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Movimientos de caja</h2><p className="text-sm text-carbon-500 dark:text-neutral-400">Ingresos por citas/ventas y egresos operativos.</p></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800"><tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Tipo</th><th className="px-3 py-2 text-left">Concepto</th><th className="px-3 py-2 text-left">Monto</th></tr></thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-3 py-2">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{m.tipo}</td>
                  <td className="px-3 py-2">{m.concepto || '-'}</td>
                  <td className="px-3 py-2 font-semibold">$ {Number(m.monto || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const Stat = ({ label, value, color }) => (
  <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
    <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-neutral-400">{label}</p>
    <p className={`mt-1 text-xl font-bold ${color}`}>$ {Number(value || 0).toLocaleString()}</p>
  </div>
)

export default CajaMovimientosView
