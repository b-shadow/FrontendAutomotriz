import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { NotebookTabs, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const ComprasInsumosView = ({ user, aiPrefill }) => {
  const { tenantSlug } = useTenant()
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const lastPrefillTs = React.useRef(null)
  const [nuevaCompraOpen, setNuevaCompraOpen] = useState(false)
  const [nuevaCompra, setNuevaCompra] = useState({
    proveedor_id: '',
    item_inventario_id: '',
    cantidad: 1,
    costo_unitario: 0,
    observaciones: '',
  })

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

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNuevaCompra = () => {
    setNuevaCompraOpen(true)
    setNuevaCompra({
      proveedor_id: proveedores[0]?.id || '',
      item_inventario_id: '',
      cantidad: 1,
      costo_unitario: 0,
      observaciones: '',
    })
    setError(null)
  }

    useEffect(() => {
    if (aiPrefill && aiPrefill.type === 'AGREGAR_ITEM_COMPRA' && aiPrefill.status === 'EJECUTADA') {
      if (lastPrefillTs.current === aiPrefill._ts) return;
      lastPrefillTs.current = aiPrefill._ts;
      
      const execCompraGhost = async () => {
        if (!items.length) {
          setError('Debes crear items primero');
          return;
        }
        const cantidad = Number(aiPrefill.cantidad || 1);
        const costo = Number(aiPrefill.costo_unitario || items[0].costo_promedio || 0);
        
        try {
          await inventarioService.crearCompra(tenantSlug, {
            proveedor_id: proveedores[0]?.id || null,
            numero_documento: "CMP-${Date.now()}",
            estado: 'BORRADOR',
            detalles: [{ item_inventario_id: items[0].id, cantidad, costo_unitario: costo }],
          });
          setSuccess('Compra creada silenciosamente por IA');
          await cargar();
        } catch (err) {
          setError('No se pudo crear compra');
        }
      };
      execCompraGhost();
    }
  }, [aiPrefill, items, proveedores, tenantSlug, cargar]);

  const crearCompra = async () => {
    const cantidad = Number(nuevaCompra.cantidad || 0)
    const costo = Number(nuevaCompra.costo_unitario || 0)
    if (!nuevaCompra.proveedor_id) return setError('Selecciona un proveedor')
    if (!nuevaCompra.item_inventario_id) return setError('Selecciona un item a comprar')
    if (!cantidad || cantidad <= 0) return setError('Cantidad invalida')
    if (costo < 0) return setError('Costo unitario invalido')
    try {
      await inventarioService.crearCompra(tenantSlug, {
        proveedor_id: nuevaCompra.proveedor_id,
        numero_documento: `CMP-${Date.now()}`,
        estado: 'BORRADOR',
        observaciones: nuevaCompra.observaciones || '',
        detalles: [{ item_inventario_id: nuevaCompra.item_inventario_id, cantidad, costo_unitario: costo }],
      })
      setNuevaCompraOpen(false)
      setSuccess('Compra creada')
      setError(null)
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
    return compras.filter((c) =>
      [c.numero_documento, c.proveedor_nombre, c.estado].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }, [compras, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Compras de insumos</h1>
        <button onClick={abrirNuevaCompra} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} className="mr-1 inline" />
          Nueva compra
        </button>
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
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
              <NotebookTabs size={18} />
            </div>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Control de ordenes y recepcion.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/[0.08]">
              <Search size={16} className="text-carbon-500 dark:text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar compra..."
                className="bg-transparent text-sm text-carbon-800 outline-none dark:text-neutral-200"
              />
            </div>
            <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-white/[0.08]">
              <SlidersHorizontal size={16} className="mr-1 inline" />
              Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Pagado</th>
                <th className="px-4 py-3 text-left">Accion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3 font-medium">{c.numero_documento}</td>
                  <td className="px-4 py-3">{c.proveedor_nombre || '-'}</td>
                  <td className="px-4 py-3">{c.estado}</td>
                  <td className="px-4 py-3">$ {Number(c.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">$ {Number(c.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {c.estado !== 'CONFIRMADA' ? (
                      <button onClick={() => recibirCompra(c.id)} className="text-primary-700 dark:text-primary-400">
                        Marcar recibida
                      </button>
                    ) : (
                      <span className="text-green-600">Recibida</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {nuevaCompraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Nueva compra de insumos</h2>
              <button onClick={() => setNuevaCompraOpen(false)} className="rounded px-2 py-1 text-carbon-700 dark:text-neutral-300">
                X
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-carbon-700 dark:text-neutral-300">Proveedor</span>
                <select
                  value={nuevaCompra.proveedor_id}
                  onChange={(e) => setNuevaCompra((p) => ({ ...p, proveedor_id: e.target.value }))}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                >
                  <option value="">Selecciona proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-carbon-700 dark:text-neutral-300">Item</span>
                <select
                  value={nuevaCompra.item_inventario_id}
                  onChange={(e) => {
                    const id = e.target.value
                    const item = items.find((it) => String(it.id) === String(id))
                    setNuevaCompra((p) => ({
                      ...p,
                      item_inventario_id: id,
                      costo_unitario: Number(item?.costo_promedio || 0),
                    }))
                  }}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                >
                  <option value="">Selecciona item</option>
                  {items.filter((i) => i.activo).map((i) => (
                    <option key={i.id} value={i.id}>
                      {`${i.codigo} - ${i.nombre} (stock ${i.stock_actual})`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-carbon-700 dark:text-neutral-300">Cantidad a comprar</span>
                <input
                  type="number"
                  min="1"
                  value={nuevaCompra.cantidad}
                  onChange={(e) => setNuevaCompra((p) => ({ ...p, cantidad: e.target.value }))}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-carbon-700 dark:text-neutral-300">Costo unitario</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nuevaCompra.costo_unitario}
                  onChange={(e) => setNuevaCompra((p) => ({ ...p, costo_unitario: e.target.value }))}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-carbon-700 dark:text-neutral-300">Observaciones (opcional)</span>
                <textarea
                  value={nuevaCompra.observaciones}
                  onChange={(e) => setNuevaCompra((p) => ({ ...p, observaciones: e.target.value }))}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNuevaCompraOpen(false)} className="rounded border border-neutral-300 px-4 py-2 dark:border-white/[0.10]">
                Cancelar
              </button>
              <button onClick={crearCompra} className="rounded bg-primary-600 px-4 py-2 text-white">
                Crear compra
              </button>
            </div>
          </div>
        </div>
      )}
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
