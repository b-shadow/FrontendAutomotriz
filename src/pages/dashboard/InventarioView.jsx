import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Package, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import inventarioService from '../../services/inventarioService'

const emptyItem = {
  categoria: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_item: 'REPUESTO',
  unidad_medida: 'pieza',
  stock_actual: '',
  stock_minimo: '',
  costo_promedio: '',
  precio_venta: '',
  activo: true,
}

const emptyCategoria = {
  nombre: '',
  descripcion: '',
  activo: true,
}

const generarCodigoItem = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const r = Math.floor(1000 + Math.random() * 9000)
  return `ITM-${y}${m}${d}-${r}`
}

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  return fallback
}

const InventarioView = ({ user, aiPrefill }) => {
  const { tenantSlug } = useTenant()
  const [categorias, setCategorias] = useState([])
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCrearItemModal, setShowCrearItemModal] = useState(false)
  const [showCrearCategoriaModal, setShowCrearCategoriaModal] = useState(false)
  const [formItem, setFormItem] = useState(emptyItem)
  const [formCategoria, setFormCategoria] = useState(emptyCategoria)
  const [submitBtnItem, setSubmitBtnItem] = useState(null)
  const [submitBtnCategoria, setSubmitBtnCategoria] = useState(null)

  useGhostAutomation({
    aiPrefill,
    isModalOpen: showCrearItemModal,
    setModalOpen: setShowCrearItemModal,
    setForm: setFormItem,
    submitBtnRef: { current: submitBtnItem },
    actionType: 'CREAR_ITEM_INVENTARIO',
    fieldMapping: {
      categoria_id: 'categoria',
      codigo: 'codigo',
      nombre: 'nombre',
      descripcion: 'descripcion',
      tipo_item: 'tipo_item',
      unidad_medida: 'unidad_medida',
      stock_actual: 'stock_actual',
      stock_minimo: 'stock_minimo',
      costo_promedio: 'costo_promedio',
      precio_venta: 'precio_venta'
    }
  })

  useGhostAutomation({
    aiPrefill,
    isModalOpen: showCrearCategoriaModal,
    setModalOpen: setShowCrearCategoriaModal,
    setForm: setFormCategoria,
    submitBtnRef: { current: submitBtnCategoria },
    actionType: 'CREAR_CATEGORIA_INVENTARIO',
    fieldMapping: {
      nombre: 'nombre',
      descripcion: 'descripcion'
    }
  })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      const [cats, its] = await Promise.all([
        inventarioService.listarCategorias(tenantSlug),
        inventarioService.listarItems(tenantSlug),
      ])
      setCategorias(cats.results || cats || [])
      setItems(its.results || its || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar inventario'))
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crearCategoria = async (e) => {
    e.preventDefault()
    if (!formCategoria.nombre.trim()) {
      setError('El nombre de la categoria es obligatorio.')
      return
    }
    try {
      await inventarioService.crearCategoria(tenantSlug, {
        ...formCategoria,
        nombre: formCategoria.nombre.trim(),
        descripcion: formCategoria.descripcion.trim(),
      })
      setSuccess('Categoria creada')
      setShowCrearCategoriaModal(false)
      setFormCategoria(emptyCategoria)
      await cargar()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear categoria'))
    }
  }

  const crearItem = async (e) => {
    e.preventDefault()
    try {
      await inventarioService.crearItem(tenantSlug, {
        ...formItem,
        codigo: formItem.codigo.trim(),
        nombre: formItem.nombre.trim(),
        descripcion: formItem.descripcion.trim(),
        unidad_medida: formItem.unidad_medida.trim(),
        stock_actual: Number(formItem.stock_actual),
        stock_minimo: Number(formItem.stock_minimo),
        costo_promedio: Number(formItem.costo_promedio),
        precio_venta: Number(formItem.precio_venta),
      })
      setFormItem(emptyItem)
      setShowCrearItemModal(false)
      setSuccess('Item creado')
      await cargar()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear item'))
    }
  }

  useEffect(() => {
    if (!showCrearItemModal) return
    setFormItem((prev) => ({ ...prev, codigo: prev.codigo || generarCodigoItem() }))
  }, [showCrearItemModal])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) =>
      [i.codigo, i.nombre, i.tipo_item].some((v) => String(v || '').toLowerCase().includes(q)),
    )
  }, [items, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Inventario</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCrearCategoriaModal(true)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-carbon-700 hover:bg-neutral-50 dark:border-white/[0.08] dark:text-neutral-200 dark:hover:bg-white/[0.04]">Nueva categoria</button>
          <button onClick={() => setShowCrearItemModal(true)} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="mr-1 inline" />Crear item</button>
        </div>
      </div>

      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-green-700">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"><Package size={18} /></div>
            <div>
              <h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Items de inventario</h2>
              <p className="text-sm text-carbon-500 dark:text-neutral-400">Gestiona productos y materiales del taller.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/[0.08]">
              <Search size={16} className="text-carbon-500 dark:text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar item..." className="bg-transparent text-sm text-carbon-800 outline-none dark:text-neutral-200" />
            </div>
            <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-white/[0.08]"><SlidersHorizontal size={16} className="mr-1 inline" />Filtros</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-4 py-3 text-left">Codigo</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Minimo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3">{i.codigo}</td>
                  <td className="px-4 py-3 font-medium">{i.nombre}</td>
                  <td className="px-4 py-3">{i.tipo_item}</td>
                  <td className="px-4 py-3 text-green-600">{i.stock_actual} unidades</td>
                  <td className="px-4 py-3">{i.stock_minimo} unidades</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCrearCategoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Nueva categoria</h2>
              <button onClick={() => setShowCrearCategoriaModal(false)} className="rounded-lg p-2 text-carbon-500 hover:bg-neutral-100 dark:hover:bg-carbon-800"><X size={18} /></button>
            </div>
            <form onSubmit={crearCategoria} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre*</label>
                <input value={formCategoria.nombre} onChange={(e) => setFormCategoria((p) => ({ ...p, nombre: e.target.value }))} required className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descripcion</label>
                <textarea value={formCategoria.descripcion} onChange={(e) => setFormCategoria((p) => ({ ...p, descripcion: e.target.value }))} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCrearCategoriaModal(false)} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button ref={setSubmitBtnCategoria} type="submit" className="rounded-lg bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 font-semibold text-white">Guardar categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCrearItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Crear item de inventario</h2>
              <button onClick={() => setShowCrearItemModal(false)} className="rounded-lg p-2 text-carbon-500 hover:bg-neutral-100 dark:hover:bg-carbon-800"><X size={18} /></button>
            </div>
            <form onSubmit={crearItem} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Categoria*</label>
                <select value={formItem.categoria} onChange={(e) => setFormItem((p) => ({ ...p, categoria: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" required>
                  <option value="">Selecciona categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Codigo*</label>
                  <button type="button" onClick={() => setFormItem((p) => ({ ...p, codigo: generarCodigoItem() }))} className="text-xs font-semibold text-primary-600 hover:underline">Regenerar</button>
                </div>
                <input value={formItem.codigo} onChange={(e) => setFormItem((p) => ({ ...p, codigo: e.target.value }))} placeholder="ITM-..." required className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Nombre*</label>
                <input value={formItem.nombre} onChange={(e) => setFormItem((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Llanta basica 15" required className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Descripcion</label>
                <input value={formItem.descripcion} onChange={(e) => setFormItem((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Detalle opcional del item" className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Tipo de item*</label>
                <select value={formItem.tipo_item} onChange={(e) => setFormItem((p) => ({ ...p, tipo_item: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800">
                  <option value="REPUESTO">REPUESTO</option><option value="INSUMO">INSUMO</option><option value="PRODUCTO">PRODUCTO</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Unidad de medida*</label>
                <input value={formItem.unidad_medida} onChange={(e) => setFormItem((p) => ({ ...p, unidad_medida: e.target.value }))} placeholder="Ej: pieza, litro, caja" required className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Stock inicial</label>
                <input type="number" min={0} value={formItem.stock_actual} onChange={(e) => setFormItem((p) => ({ ...p, stock_actual: e.target.value }))} placeholder="Ej: 15" className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Stock minimo</label>
                <input type="number" min={0} value={formItem.stock_minimo} onChange={(e) => setFormItem((p) => ({ ...p, stock_minimo: e.target.value }))} placeholder="Ej: 5" className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Costo promedio (Bs)</label>
                <input type="number" min={0} step="0.01" value={formItem.costo_promedio} onChange={(e) => setFormItem((p) => ({ ...p, costo_promedio: e.target.value }))} placeholder="Ej: 25.50" className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-medium text-carbon-500 dark:text-neutral-400">Precio de venta (Bs)</label>
                <input type="number" min={0} step="0.01" value={formItem.precio_venta} onChange={(e) => setFormItem((p) => ({ ...p, precio_venta: e.target.value }))} placeholder="Ej: 35.00" className="w-full rounded-lg border bg-white px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2 md:col-span-3">
                <button type="button" onClick={() => setShowCrearItemModal(false)} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button ref={setSubmitBtnItem} type="submit" className="rounded-lg bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 font-semibold text-white">Guardar item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventarioView
