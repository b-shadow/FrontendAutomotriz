import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const emptyItem = {
  categoria: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_item: 'REPUESTO',
  unidad_medida: 'pieza',
  stock_actual: 0,
  stock_minimo: 0,
  costo_promedio: 0,
  precio_venta: 0,
  activo: true,
}

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    const firstVal = data[firstKey]
    if (Array.isArray(firstVal) && firstVal.length) return String(firstVal[0])
    if (typeof firstVal === 'string') return firstVal
  }
  return fallback
}

const TITLES = {
  inventario: 'Inventario',
  solicitudesRepuesto: 'Solicitudes de Repuesto',
  proveedores: 'Proveedores',
  comprasInsumos: 'Compras de Insumos',
  ventasMostrador: 'Ventas Presenciales',
  pagosTaller: 'Pagos de Taller',
  facturasRecibos: 'Facturas y Recibos',
  cajaMovimientos: 'Caja y Movimientos',
}

const GestionInventarioView = ({ initialSection = 'inventario' }) => {
  const { tenantSlug } = useTenant()
  const [categorias, setCategorias] = useState([])
  const [items, setItems] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [compras, setCompras] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [showCrearItemModal, setShowCrearItemModal] = useState(false)
  const [formItem, setFormItem] = useState(emptyItem)

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setError(null)
      const [cats, its, movs, provs, comps] = await Promise.all([
        inventarioService.listarCategorias(tenantSlug),
        inventarioService.listarItems(tenantSlug),
        inventarioService.listarMovimientos(tenantSlug),
        inventarioService.listarProveedores(tenantSlug),
        inventarioService.listarCompras(tenantSlug),
      ])
      setCategorias(cats.results || cats || [])
      setItems(its.results || its || [])
      setMovimientos(movs.results || movs || [])
      setProveedores(provs.results || provs || [])
      setCompras(comps.results || comps || [])
    } catch (err) {
      setError(getErrorMessage(err, 'Error cargando inventario'))
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crearCategoria = async () => {
    const nombre = window.prompt('Nombre de categoria')
    if (!nombre) return
    try {
      await inventarioService.crearCategoria(tenantSlug, { nombre, activo: true })
      setSuccess('Categoria creada')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la categoria'))
    }
  }

  const crearProveedor = async () => {
    const nombre = window.prompt('Nombre del proveedor')
    if (!nombre) return
    const telefono = window.prompt('Telefono (opcional)', '') || ''
    const email = window.prompt('Email (opcional)', '') || ''
    const contacto = window.prompt('Contacto (opcional)', '') || ''
    try {
      await inventarioService.crearProveedor(tenantSlug, { nombre, telefono, email, contacto, activo: true })
      setSuccess('Proveedor creado')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear proveedor'))
    }
  }

  const crearCompra = async () => {
    if (!items.length) {
      setError('Debes tener items creados para registrar compra.')
      return
    }
    const proveedor = proveedores[0]
    const item = items[0]
    const cantidad = Number(window.prompt(`Cantidad para ${item.nombre}`, '1') || 0)
    const costo = Number(window.prompt('Costo unitario', String(item.costo_promedio || 0)) || 0)
    if (!cantidad || cantidad <= 0 || costo < 0) {
      setError('Cantidad/costo invalidos.')
      return
    }
    try {
      await inventarioService.crearCompra(tenantSlug, {
        proveedor_id: proveedor?.id || null,
        numero_documento: `CMP-${Date.now()}`,
        estado: 'BORRADOR',
        detalles: [{ item_inventario_id: item.id, cantidad, costo_unitario: costo }],
      })
      setSuccess('Compra creada')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear compra'))
    }
  }

  const recibirCompra = async (compraId) => {
    try {
      await inventarioService.marcarCompraRecibida(tenantSlug, compraId)
      setSuccess('Compra recibida y stock actualizado')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo recibir compra'))
    }
  }

  const crearItem = async (e) => {
    e.preventDefault()
    try {
      await inventarioService.crearItem(tenantSlug, {
        ...formItem,
        stock_actual: Number(formItem.stock_actual),
        stock_minimo: Number(formItem.stock_minimo),
        costo_promedio: Number(formItem.costo_promedio),
        precio_venta: Number(formItem.precio_venta),
      })
      setFormItem(emptyItem)
      setShowCrearItemModal(false)
      setSuccess('Item creado')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear item'))
    }
  }

  const ajustarStock = async (item) => {
    const tipo = window.prompt('Tipo (ENTRADA_COMPRA, SALIDA_TALLER, SALIDA_VENTA, AJUSTE)', 'ENTRADA_COMPRA')
    if (!tipo) return
    const cantidad = Number(window.prompt('Cantidad', '1') || 0)
    const observacion = window.prompt('Observacion', '') || ''
    const payload = { tipo_movimiento: tipo, cantidad, observacion }
    if (tipo === 'AJUSTE') {
      payload.cantidad_ajuste = Number(window.prompt('Cantidad ajuste (+/-)', '1') || 0)
    }
    try {
      await inventarioService.ajustarStock(tenantSlug, item.id, payload)
      setSuccess('Stock actualizado')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo ajustar stock'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">{TITLES[initialSection] || 'Inventario'}</h1>
        <div className="flex gap-2">
          <button onClick={crearCategoria} className="px-3 py-2 bg-neutral-700 text-white rounded">Nueva categoria</button>
          <button onClick={crearProveedor} className="px-3 py-2 bg-neutral-700 text-white rounded">Nuevo proveedor</button>
          <button onClick={crearCompra} className="px-3 py-2 bg-neutral-700 text-white rounded">Nueva compra</button>
          <button onClick={() => setShowCrearItemModal(true)} className="px-3 py-2 bg-primary-600 text-white rounded">Crear item</button>
        </div>
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="p-4 font-semibold">Items de inventario</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800">
            <tr>
              <th className="px-3 py-2 text-left">Codigo</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-left">Minimo</th>
              <th className="px-3 py-2 text-left">Accion</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                <td className="px-3 py-2">{i.codigo}</td>
                <td className="px-3 py-2">{i.nombre}</td>
                <td className="px-3 py-2">{i.tipo_item}</td>
                <td className="px-3 py-2">{i.stock_actual}</td>
                <td className="px-3 py-2">{i.stock_minimo}</td>
                <td className="px-3 py-2"><button onClick={() => ajustarStock(i)} className="text-indigo-700">Ajustar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="p-4 font-semibold">Proveedores</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Telefono</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {(proveedores || []).map((p) => (
              <tr key={p.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2">{p.telefono || '-'}</td>
                <td className="px-3 py-2">{p.email || '-'}</td>
                <td className="px-3 py-2">{p.contacto || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="p-4 font-semibold">Compras</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800">
            <tr>
              <th className="px-3 py-2 text-left">Documento</th>
              <th className="px-3 py-2 text-left">Proveedor</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Accion</th>
            </tr>
          </thead>
          <tbody>
            {(compras || []).map((c) => (
              <tr key={c.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                <td className="px-3 py-2">{c.numero_documento}</td>
                <td className="px-3 py-2">{c.proveedor_nombre || '-'}</td>
                <td className="px-3 py-2">{c.estado}</td>
                <td className="px-3 py-2">{c.total}</td>
                <td className="px-3 py-2">
                  {c.estado !== 'CONFIRMADA' ? (
                    <button onClick={() => recibirCompra(c.id)} className="text-indigo-700">Marcar recibida</button>
                  ) : (
                    <span className="text-green-700">Recibida</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="p-4 font-semibold">Movimientos recientes</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800"><tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Tipo</th><th className="px-3 py-2 text-left">Cantidad</th></tr></thead>
          <tbody>
            {movimientos.slice(0, 20).map((m) => (
              <tr key={m.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                <td className="px-3 py-2">{new Date(m.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{m.item_nombre}</td>
                <td className="px-3 py-2">{m.tipo_movimiento}</td>
                <td className="px-3 py-2">{m.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCrearItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Crear item de inventario</h2>
              <button onClick={() => setShowCrearItemModal(false)} className="rounded px-2 py-1 text-carbon-700 dark:text-neutral-300">X</button>
            </div>
            <form onSubmit={crearItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={formItem.categoria} onChange={(e) => setFormItem((p) => ({ ...p, categoria: e.target.value }))} className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" required>
                <option value="">Categoria</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input value={formItem.codigo} onChange={(e) => setFormItem((p) => ({ ...p, codigo: e.target.value }))} placeholder="Codigo" required className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input value={formItem.nombre} onChange={(e) => setFormItem((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" required className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input value={formItem.descripcion} onChange={(e) => setFormItem((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripcion" className="px-3 py-2 border rounded bg-white dark:bg-carbon-800 md:col-span-3" />
              <select value={formItem.tipo_item} onChange={(e) => setFormItem((p) => ({ ...p, tipo_item: e.target.value }))} className="px-3 py-2 border rounded bg-white dark:bg-carbon-800">
                <option value="REPUESTO">REPUESTO</option>
                <option value="INSUMO">INSUMO</option>
                <option value="PRODUCTO">PRODUCTO</option>
              </select>
              <input value={formItem.unidad_medida} onChange={(e) => setFormItem((p) => ({ ...p, unidad_medida: e.target.value }))} placeholder="Unidad" required className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input type="number" value={formItem.stock_actual} onChange={(e) => setFormItem((p) => ({ ...p, stock_actual: e.target.value }))} placeholder="Stock actual" className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input type="number" value={formItem.stock_minimo} onChange={(e) => setFormItem((p) => ({ ...p, stock_minimo: e.target.value }))} placeholder="Stock minimo" className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input type="number" step="0.01" value={formItem.costo_promedio} onChange={(e) => setFormItem((p) => ({ ...p, costo_promedio: e.target.value }))} placeholder="Costo promedio" className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <input type="number" step="0.01" value={formItem.precio_venta} onChange={(e) => setFormItem((p) => ({ ...p, precio_venta: e.target.value }))} placeholder="Precio venta" className="px-3 py-2 border rounded bg-white dark:bg-carbon-800" />
              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCrearItemModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Guardar item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionInventarioView
