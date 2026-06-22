import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import inventarioService from '../../services/inventarioService'

const emptyProveedor = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  contacto: '',
  activo: true,
}

const ProveedoresView = ({ user, aiPrefill }) => {
  const { tenantSlug } = useTenant()
  const [proveedores, setProveedores] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyProveedor)
  const [submitBtn, setSubmitBtn] = useState(null)

  useGhostAutomation({
    aiPrefill,
    isModalOpen: showModal,
    setModalOpen: setShowModal,
    setForm,
    submitBtnRef: { current: submitBtn },
    actionType: 'CREAR_PROVEEDOR',
    fieldMapping: {
      nombre: 'nombre',
      telefono: 'telefono',
      email: 'email',
      direccion: 'direccion',
      contacto: 'contacto_principal'
    }
  })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      const data = await inventarioService.listarProveedores(tenantSlug)
      setProveedores(data.results || data || [])
    } catch {
      setError('No se pudo cargar proveedores')
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crearProveedor = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }
    try {
      await inventarioService.crearProveedor(tenantSlug, {
        ...form,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
        contacto: form.contacto.trim(),
      })
      setSuccess('Proveedor creado')
      setShowModal(false)
      setForm(emptyProveedor)
      await cargar()
    } catch {
      setError('No se pudo crear proveedor')
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return proveedores
    return proveedores.filter((p) => [p.nombre, p.telefono, p.email, p.contacto].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [proveedores, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Proveedores</h1>
        <button onClick={() => setShowModal(true)} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="mr-1 inline" />Nuevo proveedor</button>
      </div>
      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-green-700">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"><Briefcase size={18} /></div>
            <div>
              <h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Proveedores</h2>
              <p className="text-sm text-carbon-500 dark:text-neutral-400">Gestiona contactos y datos comerciales.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/[0.08]">
              <Search size={16} className="text-carbon-500 dark:text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar proveedor..." className="bg-transparent text-sm text-carbon-800 outline-none dark:text-neutral-200" />
            </div>
            <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-white/[0.08]"><SlidersHorizontal size={16} className="mr-1 inline" />Filtros</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Telefono</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Direccion</th><th className="px-4 py-3 text-left">Contacto</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3">{p.telefono || '-'}</td>
                  <td className="px-4 py-3">{p.email || '-'}</td>
                  <td className="px-4 py-3">{p.direccion || '-'}</td>
                  <td className="px-4 py-3">{p.contacto || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-carbon-900 dark:text-white">Nuevo proveedor</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-carbon-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-carbon-800"><X size={18} /></button>
            </div>
            <form onSubmit={crearProveedor} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Nombre*</label>
                <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefono</label>
                <input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Direccion</label>
                <input value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Contacto</label>
                <input value={form.contacto} onChange={(e) => setForm((p) => ({ ...p, contacto: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button ref={setSubmitBtn} type="submit" className="rounded-lg bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 font-semibold text-white">Guardar proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProveedoresView
