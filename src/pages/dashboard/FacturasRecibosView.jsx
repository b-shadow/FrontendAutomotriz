import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Download, Eye, FileSpreadsheet, PlusCircle, RefreshCw, X, Code2, Table2, FileCode } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const FacturasRecibosView = () => {
  const { tenantSlug } = useTenant()
  const [facturas, setFacturas] = useState([])
  const [pagosDisponibles, setPagosDisponibles] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailFactura, setDetailFactura] = useState(null)
  const [formatModalFactura, setFormatModalFactura] = useState(null)
  const [form, setForm] = useState({
    pago_taller: '',
    numero: '',
    nit_razon_social: '',
  })

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [facturasRes, pagosRes] = await Promise.all([
        inventarioService.listarFacturas(tenantSlug),
        inventarioService.listarPagosDisponiblesParaFactura(tenantSlug),
      ])
      setFacturas(facturasRes.results || facturasRes || [])
      setPagosDisponibles(pagosRes || [])
    } catch {
      setError('No se pudo cargar la información de facturación')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const rows = useMemo(
    () =>
      facturas.map((f) => ({
        numero: f.numero,
        fecha: f.fecha_emision ? new Date(f.fecha_emision).toLocaleString() : '-',
        nit_razon_social: f.nit_razon_social || '-',
        total: Number(f.total || 0),
        estado_pago: f.pago_estado || '-',
        metodo_pago: f.pago_metodo || '-',
      })),
    [facturas]
  )

  const pagoSeleccionado = useMemo(
    () => pagosDisponibles.find((p) => p.id === form.pago_taller),
    [pagosDisponibles, form.pago_taller]
  )

  const exportarHistorial = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
    XLSX.writeFile(wb, 'facturas_recibos.xlsx')
  }

  const visualizarFactura = async (factura) => {
    try {
      setError(null)
      const blob = await inventarioService.visualizarFactura(tenantSlug, factura.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo visualizar la factura en PDF')
    }
  }

  const descargarFactura = async (factura, formato = 'pdf') => {
    try {
      setError(null)
      setDownloadingId(factura.id)
      const blob = await inventarioService.descargarFactura(tenantSlug, factura.id, formato)
      const ext = formato === 'excel' ? 'xls' : formato
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `factura_${factura.numero}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo descargar la factura')
    } finally {
      setDownloadingId(null)
    }
  }

  const descargarDesdeModal = async (formato) => {
    if (!formatModalFactura) return
    await descargarFactura(formatModalFactura, formato)
    setFormatModalFactura(null)
  }

  const formatosDescarga = [
    { key: 'pdf', title: 'PDF', subtitle: 'Documento PDF', icon: FileText, border: 'border-red-400/50 hover:border-red-400', iconWrap: 'bg-red-500/20 text-red-300', iconColor: 'text-red-300' },
    { key: 'html', title: 'HTML', subtitle: 'Página web', icon: Code2, border: 'border-orange-400/50 hover:border-orange-400', iconWrap: 'bg-orange-500/20 text-orange-300', iconColor: 'text-orange-300' },
    { key: 'csv', title: 'CSV', subtitle: 'Valores separados', icon: Table2, border: 'border-emerald-400/50 hover:border-emerald-400', iconWrap: 'bg-emerald-500/20 text-emerald-300', iconColor: 'text-emerald-300' },
    { key: 'excel', title: 'Excel', subtitle: 'Hoja de cálculo', icon: FileSpreadsheet, border: 'border-green-400/50 hover:border-green-400', iconWrap: 'bg-green-500/20 text-green-300', iconColor: 'text-green-300' },
    { key: 'doc', title: 'Word', subtitle: 'Documento Word', icon: FileCode, border: 'border-blue-400/50 hover:border-blue-400', iconWrap: 'bg-blue-500/20 text-blue-300', iconColor: 'text-blue-300' },
  ]

  const emitirFactura = async (e) => {
    e.preventDefault()
    setSuccess(null)
    setError(null)
    try {
      if (!form.pago_taller || !form.nit_razon_social.trim()) {
        setError('Debes seleccionar un pago e ingresar NIT / Razón social')
        return
      }
      const payload = {
        pago_taller: form.pago_taller,
        numero: form.numero.trim() || undefined,
        nit_razon_social: form.nit_razon_social.trim(),
      }
      await inventarioService.crearFactura(tenantSlug, payload)
      setForm({ pago_taller: '', numero: '', nit_razon_social: '' })
      setSuccess('Factura emitida correctamente')
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo emitir la factura')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Facturas y Recibos</h1>
        <div className="flex gap-2">
          <button
            onClick={cargar}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold dark:border-white/[0.08]"
          >
            <RefreshCw size={16} className="inline mr-1" />
            Recargar
          </button>
          <button
            onClick={exportarHistorial}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold dark:border-white/[0.08]"
          >
            <FileSpreadsheet size={16} className="inline mr-1" />
            Exportar
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-emerald-700">{success}</div>}

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
            <PlusCircle size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Emitir Factura o Recibo</h2>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Selecciona un pago confirmado/recibido y emite el comprobante.</p>
          </div>
        </div>
        <form onSubmit={emitirFactura} className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.pago_taller}
            onChange={(e) => setForm((prev) => ({ ...prev, pago_taller: e.target.value }))}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
            required
          >
            <option value="">Selecciona un pago disponible</option>
            {pagosDisponibles.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-carbon-900 dark:bg-carbon-800 dark:text-neutral-100">
                {p.codigo_pago || p.id} | {p.cliente} | {p.monto_total} {p.moneda}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Número de comprobante (opcional)"
            value={form.numero}
            onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
          />
          <input
            type="text"
            placeholder="NIT / Razón social del cliente"
            value={form.nit_razon_social}
            onChange={(e) => setForm((prev) => ({ ...prev, nit_razon_social: e.target.value }))}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100 sm:col-span-2"
            required
          />
          <div className="sm:col-span-2 flex items-center justify-between">
            <div className="text-sm text-carbon-500 dark:text-neutral-400">
              {pagoSeleccionado
                ? `Pago: ${pagoSeleccionado.codigo_pago || pagoSeleccionado.id} | Total: ${pagoSeleccionado.monto_total} ${pagoSeleccionado.moneda} | Estado: ${pagoSeleccionado.estado}`
                : 'Selecciona un pago para ver su detalle'}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              disabled={loading || pagosDisponibles.length === 0}
            >
              Emitir
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-carbon-900 dark:text-white">Historial de facturación</h2>
            <p className="text-sm text-carbon-500 dark:text-neutral-400">Incluye pagos de citas y ventas presenciales.</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-3 py-2 text-left">Número</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">NIT / Razón social</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">Estado pago</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-3 py-2 font-medium">{f.numero}</td>
                  <td className="px-3 py-2">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">{f.nit_razon_social || '-'}</td>
                  <td className="px-3 py-2">$ {Number(f.total || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{f.pago_estado || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailFactura(f)}
                        className="rounded-lg border border-neutral-200 p-2 dark:border-white/[0.08]"
                        title="Ver detalle"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={() => visualizarFactura(f)}
                        className="rounded-lg border border-neutral-200 p-2 dark:border-white/[0.08]"
                        title="Visualizar PDF"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setFormatModalFactura(f)}
                        className="rounded-lg border border-neutral-200 p-2 dark:border-white/[0.08]"
                        title="Descargar"
                        disabled={downloadingId === f.id}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-carbon-500 dark:text-neutral-400">
                    No hay comprobantes emitidos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 dark:bg-carbon-900">
            <h3 className="mb-3 text-lg font-bold text-carbon-900 dark:text-white">Detalle de comprobante</h3>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><strong>Número:</strong> {detailFactura.numero}</div>
              <div><strong>Fecha:</strong> {detailFactura.fecha_emision ? new Date(detailFactura.fecha_emision).toLocaleString() : '-'}</div>
              <div><strong>NIT / Razón social:</strong> {detailFactura.nit_razon_social || '-'}</div>
              <div><strong>Total:</strong> {detailFactura.total}</div>
              <div><strong>Pago asociado:</strong> {detailFactura.pago_taller}</div>
              <div><strong>Estado pago:</strong> {detailFactura.pago_estado || '-'}</div>
              <div><strong>Método:</strong> {detailFactura.pago_metodo || '-'}</div>
              <div><strong>Moneda:</strong> {detailFactura.pago_moneda || '-'}</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => visualizarFactura(detailFactura)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-white/[0.10]"
              >
                Visualizar PDF
              </button>
              <button
                onClick={() => setDetailFactura(null)}
                className="rounded-lg bg-carbon-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-carbon-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {formatModalFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-6xl rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-blue-50 p-6 text-carbon-900 shadow-2xl dark:border-white/15 dark:bg-gradient-to-br dark:from-carbon-900 dark:via-carbon-900 dark:to-blue-950 dark:text-white">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-violet-500/15 p-4 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                  <Download size={30} />
                </div>
                <div>
                  <h3 className="text-4xl font-extrabold tracking-tight">Descargar comprobante</h3>
                  <p className="mt-1 text-xl text-neutral-600 dark:text-neutral-300">
                    Elige el formato para <span className="font-semibold text-violet-700 dark:text-violet-300">{formatModalFactura.numero}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormatModalFactura(null)}
                className="rounded-full border border-neutral-300 bg-white/70 p-3 text-carbon-700 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20"
                title="Cerrar"
              >
                <X size={26} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {formatosDescarga.map((fmt) => {
                const IconComp = fmt.icon
                return (
                  <button
                    key={fmt.key}
                    onClick={() => descargarDesdeModal(fmt.key)}
                    className={`group rounded-2xl border bg-white/80 p-6 text-left transition-all hover:-translate-y-1 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 ${fmt.border}`}
                  >
                    <div className={`mb-4 inline-flex rounded-2xl p-4 ${fmt.iconWrap}`}>
                      <IconComp size={38} />
                    </div>
                    <p className="text-4xl font-black leading-none">{fmt.title}</p>
                    <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-300">{fmt.subtitle}</p>
                    <div className="mt-6">
                      <Download size={28} className={fmt.iconColor} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 border-t border-neutral-300 pt-5 dark:border-white/15">
              <button
                onClick={() => setFormatModalFactura(null)}
                className="ml-auto flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-lg font-semibold text-carbon-900 hover:bg-neutral-50 dark:border-neutral-300 dark:bg-white/90 dark:hover:bg-white"
              >
                <X size={20} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacturasRecibosView
