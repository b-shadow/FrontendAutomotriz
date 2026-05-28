import { useCallback, useEffect, useMemo, useState } from 'react'
import { NotebookTabs, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const ComprasInsumosView = () => {
  const { tenantSlug } = useTenant()
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      const [comps, provs, its] = await Promise.all([
        inventarioService.listarCompras(tenantSlug),
        inventarioService.listarProveedores(tenantSlug),
        inventarioService.listarItems(tenantSlug),
      ])
      setCompras(comps.results || comps || [])
      setProveedores(provs.results || provs || [])
      setItems(its.results || its || [])
    } catch {
      setError('No se pudo cargar compras')
    }
  }, [tenantSlug])

  useEffect(() => { cargar() }, [cargar])

  const crearCompra = async () => {
    if (!items.length) return setError('Debes crear items primero')
    const proveedor = proveedores[0]
    const item = items[0]
    const cantidad = Number(window.prompt(`Cantidad para ${item.nombre}`, '1') || 0)
    const costo = Number(window.prompt('Costo unitario', String(item.costo_promedio || 0)) || 0)
    if (!cantidad || cantidad <= 0) return setError('Cantidad inválida')
    try {
      await inventarioService.crearCompra(tenantSlug, {
        proveedor_id: proveedor?.id || null,
        numero_documento: `CMP-${Date.now()}`,
        estado: 'BORRADOR',
        detalles: [{ item_inventario_id: item.id, cantidad, costo_unitario: costo }],
      })
      setSuccess('Compra creada')
      await cargar()
    } catch {
      setError('No se pudo crear compra')
    }
  }

  const recibirCompra = async (id) => {
    try {
      await inventarioService.marcarCompraRecibida(tenantSlug, id)
      setSuccess('Compra recibida y stock actualizado')
      await cargar()
    } catch {
      setError('No se pudo marcar recibida')
    }
  }

  const stats = useMemo(() => {
    const total = compras.length
    const recibidas = compras.filter((c) => c.estado === 'CONFIRMADA').length
    const pendientes = compras.filter((c) => c.estado !== 'CONFIRMADA').length
    const totalGastado = compras.reduce((acc, c) => acc + Number(c.total || 0), 0)
    return { total, recibidas, pendientes, totalGastado }
  }, [compras])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return compras
    return compras.filter((c) => [c.numero_documento, c.proveedor_nombre, c.estado].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [compras, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Compras de insumos</h1>
        <button onClick={crearCompra} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="inline mr-1" />Nueva compra</button>
      </div>
      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-green-700">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total compras" value={stats.total} />
          <Stat label="Compras recibidas" value={stats.recibidas} />
          <Stat label="Pendientes" value={stats.pendientes} />
          <Stat label="Total gastado" value={`$ ${stats.totalGastado.toLocaleString()}`} />
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"><NotebookTabs size={18} /></div>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Control de órdenes y recepción.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/[0.08]">
              <Search size={16} className="text-carbon-500 dark:text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar compra..." className="bg-transparent text-sm outline-none text-carbon-800 dark:text-neutral-200" />
            </div>
            <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-white/[0.08]"><SlidersHorizontal size={16} className="inline mr-1" />Filtros</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr><th className="px-4 py-3 text-left">Documento</th><th className="px-4 py-3 text-left">Proveedor</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Pagado</th><th className="px-4 py-3 text-left">Acción</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3 font-medium">{c.numero_documento}</td>
                  <td className="px-4 py-3">{c.proveedor_nombre || '-'}</td>
                  <td className="px-4 py-3">{c.estado}</td>
                  <td className="px-4 py-3">$ {Number(c.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">$ {Number(c.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{c.estado !== 'CONFIRMADA' ? <button onClick={() => recibirCompra(c.id)} className="text-primary-700 dark:text-primary-400">Marcar recibida</button> : <span className="text-green-600">Recibida</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
    <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-neutral-400">{label}</p>
    <p className="mt-1 text-xl font-bold text-carbon-900 dark:text-white">{value}</p>
  </div>
)

export default ComprasInsumosView
