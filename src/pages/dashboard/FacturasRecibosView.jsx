import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Download, Eye, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const FacturasRecibosView = () => {
  const { tenantSlug } = useTenant()
  const [facturas, setFacturas] = useState([])
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const data = await inventarioService.listarFacturas(tenantSlug)
      setFacturas(data.results || data || [])
    } catch {
      setError('No se pudo cargar facturas y recibos')
    }
  }, [tenantSlug])

  useEffect(() => { cargar() }, [cargar])

  const rows = useMemo(() => facturas.map((f) => ({
    numero: f.numero,
    fecha: f.fecha_emision ? new Date(f.fecha_emision).toLocaleString() : '-',
    total: Number(f.total || 0),
    nit: f.nit_razon_social || '-',
  })), [facturas])

  const exportar = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
    XLSX.writeFile(wb, 'facturas_recibos.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Facturas y Recibos</h1>
        <button onClick={exportar} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold dark:border-white/[0.08]"><FileSpreadsheet size={16} className="inline mr-1" />Exportar</button>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}
      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"><FileText size={18} /></div>
          <div><h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Historial de facturación</h2><p className="text-sm text-carbon-500 dark:text-neutral-400">Incluye pagos de citas y ventas presenciales.</p></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800"><tr><th className="px-3 py-2 text-left">Número</th><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">NIT / Razón social</th><th className="px-3 py-2 text-left">Total</th><th className="px-3 py-2 text-left">Acciones</th></tr></thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-3 py-2 font-medium">{f.numero}</td>
                  <td className="px-3 py-2">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">{f.nit_razon_social || '-'}</td>
                  <td className="px-3 py-2">$ {Number(f.total || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-neutral-200 p-2 dark:border-white/[0.08]" title="Visualizar"><Eye size={15} /></button>
                      <a href={f.archivo_pdf_url || '#'} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-200 p-2 dark:border-white/[0.08]" title="Descargar"><Download size={15} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default FacturasRecibosView
