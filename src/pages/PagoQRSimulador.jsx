import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import pagosSimuladorService from '../services/pagosSimuladorService'

const SALDO_STORAGE_KEY = 'sim_banco_saldo_bs'
const SALDO_INICIAL = 11000

const estadoClass = {
  PENDIENTE: 'text-amber-400',
  CONFIRMADO: 'text-emerald-400',
  FALLIDO: 'text-rose-400',
  VENCIDO: 'text-neutral-400',
}

export default function PagoQRSimulador() {
  const { codigoPago, token } = useParams()
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [pago, setPago] = useState(null)
  const [clave, setClave] = useState('563921')
  const [saldoDisponible, setSaldoDisponible] = useState(SALDO_INICIAL)

  const cargar = async () => {
    try {
      setError('')
      const data = await pagosSimuladorService.obtenerEstado(codigoPago, token)
      setPago(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo cargar el pago simulado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const guardado = Number(localStorage.getItem(SALDO_STORAGE_KEY))
    if (!Number.isNaN(guardado) && guardado >= 0) {
      setSaldoDisponible(guardado)
    } else {
      localStorage.setItem(SALDO_STORAGE_KEY, String(SALDO_INICIAL))
    }
  }, [])

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoPago, token])

  const confirmar = async () => {
    try {
      setProcesando(true)
      setError('')
      const monto = Number(pago?.montoCobrado || 0)
      if (Number.isNaN(monto) || monto <= 0) {
        setError('Monto de pago invalido.')
        return
      }
      if (saldoDisponible < monto) {
        setError('Saldo insuficiente para confirmar el pago.')
        return
      }
      await pagosSimuladorService.confirmar(codigoPago, token)
      const nuevoSaldo = Math.max(0, Number((saldoDisponible - monto).toFixed(2)))
      setSaldoDisponible(nuevoSaldo)
      localStorage.setItem(SALDO_STORAGE_KEY, String(nuevoSaldo))
      await cargar()
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo confirmar el pago.')
    } finally {
      setProcesando(false)
    }
  }

  const rechazar = async () => {
    try {
      setProcesando(true)
      setError('')
      await pagosSimuladorService.rechazar(codigoPago, token)
      await cargar()
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo rechazar el pago.')
    } finally {
      setProcesando(false)
    }
  }

  const regenerarClave = () => {
    const nueva = String(Math.floor(100000 + Math.random() * 900000))
    setClave(nueva)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#1f2937]">
      <div className="mx-auto max-w-md min-h-screen bg-[#f3f4f6]">
        <div className="bg-[#166534] text-white px-5 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Detalle de pago QR</h1>
          <button type="button" onClick={rechazar} className="text-2xl font-medium">Cancelar</button>
        </div>

        <div className="p-5 space-y-4">
        {loading ? (
          <p className="text-neutral-600">Cargando...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-2 text-2xl">
                <div className="p-4 bg-[#f3f4f6] border-b border-neutral-200">Cuenta destino</div>
                <div className="p-4 bg-[#f3f4f6] border-b border-neutral-200 text-right">Moneda</div>
              </div>
              <div className="grid grid-cols-2 text-2xl">
                <div className="p-4">
                  <p className="font-medium">{pago?.codigoPago?.slice(-10) || '1311774189'}</p>
                  <p className="mt-1">CI / NIT 14053057</p>
                  <p className="mt-1 text-neutral-500 uppercase">AutoTaller Pro</p>
                  <p className="text-neutral-500 uppercase">Banco Simulado</p>
                </div>
                <div className="p-4 text-right">Bs</div>
              </div>
            </div>

            <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-2 text-2xl">
                <div className="p-4 bg-[#f3f4f6] border-b border-neutral-200">Cuenta de origen</div>
                <div className="p-4 bg-[#f3f4f6] border-b border-neutral-200 text-right">Saldo disponible</div>
              </div>
              <div className="grid grid-cols-2 text-2xl">
                <div className="p-4">
                  <p className="font-medium">1033331173</p>
                  <p className="mt-1">Caja de Ahorro</p>
                </div>
                <div className="p-4 text-right">
                  <p className="font-medium">Bs {saldoDisponible.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md border border-neutral-200 p-4">
              <p className="text-4xl font-medium mb-3">Monto</p>
              <div className="rounded-2xl bg-[#f3f4f6] px-4 py-5 text-center text-5xl text-neutral-600">
                Bs {pago?.montoCobrado}
              </div>
              <p className="mt-5 text-neutral-500 text-[28px] leading-tight">
                Recuerda que, la fecha de vencimiento del pago es
                <br />
                {pago?.fechaExpiracion ? new Date(pago.fechaExpiracion).toLocaleString() : '-'}
              </p>
              <p className="mt-5 text-neutral-500 text-[28px] leading-tight">
                Los datos que se validarán para procesar la transferencia de fondos son el número de cuenta del beneficiario
                y el nombre de la entidad destino.
              </p>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-4xl font-medium">Clave dinámica</p>
                <button
                  type="button"
                  onClick={regenerarClave}
                  className="rounded-2xl bg-[#f3f4f6] px-5 py-3 text-4xl font-semibold min-w-[180px]"
                >
                  {clave}
                </button>
              </div>
            </div>

            <p className={`text-xl font-semibold ${estadoClass[pago?.estado] || 'text-neutral-700'}`}>
              Estado actual: {pago?.estado}
            </p>

            <button
              type="button"
              onClick={confirmar}
              disabled={procesando || pago?.estado !== 'PENDIENTE'}
              className="w-full rounded-3xl bg-[#166534] text-white py-4 text-4xl font-semibold disabled:opacity-50"
            >
              {procesando ? 'Procesando pago...' : 'Confirmar'}
            </button>

          </>
        )}
      </div>
      </div>
    </div>
  )
}
