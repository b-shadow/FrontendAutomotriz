import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { Card, Button } from '../../components/ui'
import suscripcionService from '../../services/suscripcionService'

export const GestionSuscripcionView = () => {
  const { tenantSlug } = useTenant()

  // Función para detectar si el pago es simulado (entorno local/debug)
  const isSimulatedPayment = (intent) => {
    if (!intent) return false
    return (
      intent.id?.startsWith('pi_dev_') ||
      intent.client_secret?.startsWith('pi_dev_')
    )
  }

  // Estados generales
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Datos de suscripción
  const [planes, setPlanes] = useState([])
  const [suscripcionActual, setSuscripcionActual] = useState(null)
  const [planSeleccionado, setPlanSeleccionado] = useState(null)
  const [modoAccion, setModoAccion] = useState(null) // 'cambiar', 'renovar', 'seleccionar-cambio', null

  // Modal de confirmación para cancelación
  const [mostrarConfirmacionCancelacion, setMostrarConfirmacionCancelacion] = useState(false)
  const [cancelacionConfirmada, setCancelacionConfirmada] = useState(false)

  // Stripe
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState(null)
  const [programandoCambio, setProgramandoCambio] = useState(false)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: ''
  })

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [planesData, suscData] = await Promise.all([
        suscripcionService.obtenerPlanes(),
        suscripcionService.obtenerSuscripcionActual(tenantSlug)
      ])
      setPlanes(planesData)
      setSuscripcionActual(suscData)
    } catch (err) {
      setError('Error al cargar los datos de suscripción')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    if (tenantSlug) {
      cargarDatos()
    }
  }, [cargarDatos, tenantSlug])

  // Confirmar pago en modo simulado
  const handleConfirmarPagoSimulado = useCallback(async () => {
    // Validar datos de tarjeta
    const validateCardData = () => {
      const cardNumber = cardData.cardNumber.replace(/\s/g, '')
      if (!cardNumber || cardNumber.length !== 16) return 'Número de tarjeta inválido'
      if (!cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) return 'Fecha de expiración inválida (MM/YY)'
      if (!cardData.cvc || cardData.cvc.length < 3) return 'CVC inválido'
      if (!cardData.cardholderName.trim()) return 'Nombre del titular requerido'
      return null
    }

    const cardError = validateCardData()
    if (cardError) {
      setError(cardError)
      return
    }

    // Formulario válido, proceder con confirmación
    setProcesandoPago(true)
    setError(null)
    try {
      const confirmacion = await suscripcionService.confirmarPago(
        tenantSlug,
        {
          paymentIntentId: paymentIntent.id,
          planId: planSeleccionado.id,
          accion: modoAccion
        }
      )

      if (confirmacion.success) {
        setSuccess(
          modoAccion === 'cambiar'
            ? `¡Cambio programado! Tu plan cambiará después del período actual.`
            : `¡Renovación exitosa! Tu suscripción se extiende hasta ${new Date(confirmacion.nueva_fecha_fin).toLocaleDateString()}`
        )
        // Limpiar estado
        setModoAccion(null)
        setPlanSeleccionado(null)
        setPaymentIntent(null)
        setCardData({ cardNumber: '', expiryDate: '', cvc: '', cardholderName: '' })
        window.stripeData = null

        // Recargar datos
        await cargarDatos()
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago')
      console.error(err)
    } finally {
      setProcesandoPago(false)
    }
  }, [tenantSlug, paymentIntent, planSeleccionado, modoAccion, cardData, cargarDatos])

  // Procesar pago (crear intent si es renovación, o confirmar en modo simulado)
  const handleProcesarPago = useCallback(async () => {
    if (!planSeleccionado) {
      setError('Por favor selecciona un plan')
      return
    }

    // Si no hay paymentIntent aún, crearlo
    if (!paymentIntent) {
      setProcesandoPago(true)
      setError(null)

      try {
        const intentData = await suscripcionService.crearPaymentIntent(
          tenantSlug,
          {
            planId: planSeleccionado.id,
            accion: modoAccion
          }
        )

        setPaymentIntent(intentData)
        // El useEffect cargará automáticamente el formulario de Stripe (solo en modo real)
      } catch (err) {
        setError(err.message || 'Error al crear el pago')
        console.error(err)
      } finally {
        setProcesandoPago(false)
      }
      return
    }

    // Si ya hay paymentIntent, confirmar el pago
    const isSimulated = isSimulatedPayment(paymentIntent)
    
    if (isSimulated) {
      // MODO SIMULADO: validar formulario y delegar a función especializada
      await handleConfirmarPagoSimulado()
      return
    }

    // MODO REAL: usar Stripe.confirmCardPayment()
    if (!window.stripeData) {
      setError('Formulario de pago no cargado')
      return
    }

    setProcesandoPago(true)
    setError(null)

    try {
      const { stripe, cardElement, pago } = window.stripeData

      // Confirmar el pago con la tarjeta
      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        pago.client_secret,
        {
          payment_method: {
            card: cardElement
          }
        }
      )

      if (error) {
        setError(error.message || 'Error al procesar el pago')
        return
      }

      if (confirmedIntent.status === 'succeeded') {
        // Pago exitoso - confirmar en el backend
        const confirmacion = await suscripcionService.confirmarPago(
          tenantSlug,
          {
            paymentIntentId: confirmedIntent.id,
            planId: planSeleccionado.id,
            accion: modoAccion
          }
        )

        if (confirmacion.success) {
          setSuccess(
            modoAccion === 'cambiar'
              ? `¡Cambio programado! Tu plan cambiará a ${planSeleccionado.nombre} después del período actual`
              : `¡Renovación exitosa! Tu suscripción se extiende hasta ${new Date(confirmacion.nueva_fecha_fin).toLocaleDateString()}`
          )
          setModoAccion(null)
          setPlanSeleccionado(null)
          setPaymentIntent(null)
          setCardData({ cardNumber: '', expiryDate: '', cvc: '', cardholderName: '' })
          window.stripeData = null

          // Recargar datos
          await cargarDatos()
        }
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago')
      console.error(err)
    } finally {
      setProcesandoPago(false)
    }
  }, [planSeleccionado, paymentIntent, modoAccion, tenantSlug, cargarDatos, handleConfirmarPagoSimulado])

  // Cargar formulario de Stripe (solo para modo real)
  const loadStripePaymentForm = async (pago) => {
    try {
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

      const elements = stripe.elements()
      const cardElement = elements.create('card', {
        hidePostalCode: true,
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      })

      const cardContainer = document.getElementById('card-element')
      if (cardContainer) {
        cardElement.mount('#card-element')
        window.stripeData = { stripe, elements, cardElement, pago }
      }
    } catch (err) {
      console.error('Error al cargar Stripe:', err)
      setError('Error al cargar el formulario de pago')
    }
  }

  // Programar cambio de plan en el backend
  const handleProgramarCambio = async (planId) => {
    setProgramandoCambio(true)
    setError(null)
    try {
      await suscripcionService.cambiarPlan(tenantSlug, { planId })
      // Ahora crear el payment intent
      const planData = planes.find(p => p.id === planId)
      if (planData) {
        setPlanSeleccionado(planData)
        setModoAccion('cambiar')
      }
    } catch (err) {
      console.error('Error al programar cambio:', err)
      setError(err.message || 'Error al programar el cambio de plan')
    } finally {
      setProgramandoCambio(false)
    }
  }

  // Formatear y actualizar datos de tarjeta de tarjeta simulada (reutilizado de RegistrarEmpresa)
  const handleCardChange = (e) => {
    const { name, value } = e.target
    
    // Formatear número de tarjeta (espacios cada 4 dígitos)
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '')
      const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim()
      setCardData(prev => ({ ...prev, [name]: formatted }))
    }
    // Formatear fecha de expiración (MM/YY)
    else if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length <= 4) {
        const formatted = cleaned.length >= 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned
        setCardData(prev => ({ ...prev, [name]: formatted }))
      }
    }
    // CVC solo números
    else if (name === 'cvc') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4)
      setCardData(prev => ({ ...prev, [name]: cleaned }))
    }
    else {
      setCardData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Iniciar acción de cambio de plan (seleccionar plan para cambiar)
  const handleCambiarPlan = (plan) => {
    // Solo seleccionar el plan, no programar aún
    setPlanSeleccionado(plan)
    setModoAccion('seleccionar-cambio')
  }

  // Confirmar cambio seleccionado (desde el botón "Siguiente: Ir a Pago")
  const handleConfirmarSeleccionCambio = () => {
    if (planSeleccionado?.id) {
      // Programar el cambio en backend
      handleProgramarCambio(planSeleccionado.id)
    }
  }

  // Abrir selector de planes para cambiar
  const handleAbrirCambioPlan = () => {
    // Preseleccionar el primer plan distinto del actual
    const planDistinto = planes?.find(p => p.id !== suscripcionActual?.plan?.id)
    if (planDistinto) {
      setPlanSeleccionado(planDistinto)
    } else {
      setPlanSeleccionado(null)
    }
    setModoAccion('seleccionar-cambio')
  }

  // Mostrar modal de confirmación para cancelar cambio
  const mostrarConfirmCancelacion = () => {
    setMostrarConfirmacionCancelacion(true)
  }

  // Confirmar cancelación del cambio pendiente
  const confirmarCancelacion = async () => {
    setLoading(true)
    setError(null)
    try {
      await suscripcionService.cancelarCambioPendiente(tenantSlug)
      setSuccess('Cambio de plan cancelado. Tu suscripción actual continúa sin cambios.')
      setMostrarConfirmacionCancelacion(false)
      setCancelacionConfirmada(false)
      // Recargar datos
      await cargarDatos()
    } catch (err) {
      console.error('Error al cancelar cambio:', err)
      setError(err.message || 'Error al cancelar el cambio de plan')
    } finally {
      setLoading(false)
    }
  }

  // Cancelar la acción de cancelación
  const handleCancelarCambioPendiente = () => {
    mostrarConfirmCancelacion()
  }

  // Iniciar acción de renovación
  const handleRenovarSuscripcion = () => {
    // Validar que no haya cambio pendiente
    if (suscripcionActual?.tiene_cambio_pendiente) {
      setError('No puedes renovar mientras hay un cambio de plan programado. Cancela el cambio primero.')
      return
    }

    // Crear objeto plan basado en suscripcionActual (estructura actual con plan anidado)
    const planActual = {
      id: suscripcionActual?.plan?.id,
      nombre: suscripcionActual?.plan?.nombre,
      precio_centavos: suscripcionActual?.plan?.precio_centavos,
      descripcion: suscripcionActual?.plan?.descripcion
    }
    setPlanSeleccionado(planActual)
    setModoAccion('renovar')
  }

  const handleCancelar = () => {
    if (modoAccion === 'cambiar') {
      // Si está en pago de cambio, volver al selector de planes
      setModoAccion('seleccionar-cambio')
      setPaymentIntent(null)
      setCardData({ cardNumber: '', expiryDate: '', cvc: '', cardholderName: '' })
      window.stripeData = null
    } else {
      // Si es renovación, volver al inicio
      setModoAccion(null)
      setPlanSeleccionado(null)
      setPaymentIntent(null)
      setCardData({ cardNumber: '', expiryDate: '', cvc: '', cardholderName: '' })
      window.stripeData = null
    }
  }

  // Limpiar mensajes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Cargar formulario de Stripe cuando se abre el formulario de pago
  useEffect(() => {
    if ((modoAccion === 'cambiar' || modoAccion === 'renovar') && planSeleccionado && !paymentIntent && !procesandoPago) {
      // Crear automáticamente el payment intent cuando abre el formulario de pago
      handleProcesarPago()
    }
  }, [modoAccion, planSeleccionado, paymentIntent, procesandoPago, handleProcesarPago])

  useEffect(() => {
    if ((modoAccion === 'cambiar' || modoAccion === 'renovar') && paymentIntent && !isSimulatedPayment(paymentIntent)) {
      loadStripePaymentForm(paymentIntent)
    }
  }, [modoAccion, paymentIntent])

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        <p>Cargando información de suscripción...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💳 Gestionar Suscripción</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Administra tu plan y renovaciones</p>
      </div>

      {/* MENSAJES */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
          ✓ {success}
        </div>
      )}

      {/* SUSCRIPCIÓN ACTUAL */}
      {suscripcionActual ? (
        <Card className="border-l-4 border-l-green-600 bg-green-50 dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📋 Tu Suscripción Actual</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan Activo</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {suscripcionActual.plan?.nombre}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {suscripcionActual.estado}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencimiento</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {new Date(suscripcionActual.fin).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Cambio programado pendiente */}
          {suscripcionActual.tiene_cambio_pendiente && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-300">⏱️ Cambio Programado</p>
                  <p className="text-blue-800 dark:text-blue-300 text-sm mt-1">
                    Tu plan cambiará a <strong>{suscripcionActual.plan_pendiente?.nombre}</strong> el{' '}
                    <strong>{new Date(suscripcionActual.fecha_aplicacion_plan_pendiente).toLocaleDateString()}</strong>
                  </p>
                </div>
                <button
                  onClick={handleCancelarCambioPendiente}
                  disabled={loading}
                  className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:bg-gray-400 dark:disabled:bg-gray-600"
                >
                  {loading ? '...' : '✕ Cancelar'}
                </button>
              </div>
            </div>
          )}

          {!modoAccion && (
            <div className="flex gap-2 pt-4 border-t dark:border-slate-700">
              <Button
                onClick={handleRenovarSuscripcion}
                disabled={suscripcionActual?.tiene_cambio_pendiente}
                className={`${
                  suscripcionActual?.tiene_cambio_pendiente
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                ♻️ Renovar Suscripción
              </Button>
              <Button
                onClick={handleAbrirCambioPlan}
                variant="secondary"
              >
                🔄 Cambiar de Plan
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="bg-yellow-50 dark:bg-slate-800 border-yellow-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-white">⚠️ Sin Suscripción Activa</h2>
          <p className="text-yellow-800 dark:text-gray-300 mt-2 mb-4">
            Tu empresa no tiene una suscripción activa. Selecciona un plan para comenzar.
          </p>
        </Card>
      )}

      {/* PLANES DISPONIBLES */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📦 Planes Disponibles</h2>
        
        {!modoAccion || modoAccion === 'seleccionar-cambio' ? (
          <div className="grid md:grid-cols-4 gap-6">
            {planes && planes.length > 0 ? (
              planes.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border-2 transition-all cursor-pointer ${
                    suscripcionActual?.plan?.id === plan.id && !modoAccion
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                      : planSeleccionado?.id === plan.id && modoAccion === 'seleccionar-cambio'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-600'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                  onClick={() => modoAccion === 'seleccionar-cambio' && handleCambiarPlan(plan)}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</h3>
                    {plan.descripcion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plan.descripcion}</p>
                    )}
                  </div>

                  <div className="mb-4 pb-4 border-b dark:border-slate-700">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${(plan.precio_centavos / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">USD / mes</p>
                  </div>

                  {plan.caracteristicas && (
                    <ul className="space-y-2 mb-6 text-sm text-gray-700 dark:text-gray-300">
                      {typeof plan.caracteristicas === 'string' ? (
                        <li>✓ {plan.caracteristicas}</li>
                      ) : (
                        plan.caracteristicas.map((car, idx) => (
                          <li key={idx}>✓ {car}</li>
                        ))
                      )}
                    </ul>
                  )}

                  {modoAccion === 'seleccionar-cambio' ? (
                    <Button
                      onClick={() => setPlanSeleccionado(plan)}
                      disabled={suscripcionActual?.plan?.id === plan.id}
                      className={`w-full transition-all ${
                        suscripcionActual?.plan?.id === plan.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : planSeleccionado?.id === plan.id
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      {suscripcionActual?.plan?.id === plan.id ? '✓ Plan Actual' : planSeleccionado?.id === plan.id ? '✓ Seleccionado' : 'Seleccionar'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleCambiarPlan(plan)}
                      disabled={suscripcionActual?.plan?.id === plan.id}
                      className={
                        suscripcionActual?.plan?.id === plan.id
                          ? 'w-full bg-gray-400 text-white cursor-not-allowed'
                          : 'w-full bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    >
                      {suscripcionActual?.plan?.id === plan.id ? '✓ Plan Actual' : 'Elegir Plan'}
                    </Button>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 col-span-4">No hay planes disponibles</p>
            )}
          </div>
        ) : null}

        {modoAccion === 'seleccionar-cambio' && planSeleccionado && (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleConfirmarSeleccionCambio}
              disabled={programandoCambio}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {programandoCambio ? '⏳ Programando...' : 'Siguiente: Ir a Pago →'}
            </Button>
            <Button
              onClick={() => {
                setModoAccion(null)
                setPlanSeleccionado(null)
              }}
              variant="secondary"
              className="flex-1"
            >
              ✕ Cancelar
            </Button>
          </div>
        )}

        {(modoAccion === 'cambiar' || modoAccion === 'renovar') && (
          <Card className="border-blue-400 bg-blue-50 dark:bg-slate-800 dark:border-blue-900">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {modoAccion === 'cambiar' ? '🔄 Cambiar a Plan' : '♻️ Renovar Suscripción'}
            </h3>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plan Seleccionado:</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {planSeleccionado?.nombre}
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${(planSeleccionado?.precio_centavos / 100).toFixed(2)}/mes
                </span>
              </div>
            </div>

            {/* Información sobre renovación adelantada */}
            {modoAccion === 'renovar' && suscripcionActual && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">ℹ️ Renovación Adelantada</p>
                <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                  Si renuevas ahora, la nueva suscripción comenzará después del vencimiento de la actual.
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Fecha actual de vencimiento:</strong> {new Date(suscripcionActual.fin).toLocaleDateString()}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Tu nueva suscripción comenzará:</strong> {new Date(suscripcionActual.fin).toLocaleDateString()} + 1 día
                </p>
              </div>
            )}

            {/* Elemento de tarjeta Stripe - SOLO en modo real */}
            {paymentIntent && !isSimulatedPayment(paymentIntent) && (
              <div className="mb-6 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-3">
                  Información de la Tarjeta *
                </label>
                <div id="card-element" className="p-3 border border-gray-200 dark:border-slate-600 rounded dark:bg-slate-700"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Tus datos de tarjeta se procesan de forma segura con Stripe
                </p>
              </div>
            )}

            {/* MODO SIMULADO: Formulario visual de tarjeta simulada */}
            {paymentIntent && isSimulatedPayment(paymentIntent) && (
              <div className="mb-6 p-4 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20">               
                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-3">
                  Información de la Tarjeta
                </label>

                {/* Nombre del titular */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Nombre del Titular *</label>
                  <input
                    type="text"
                    name="cardholderName"
                    placeholder="John Doe"
                    value={cardData.cardholderName}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded mt-1 focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400"
                  />
                </div>

                {/* Número de tarjeta */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Número de Tarjeta (16 dígitos) *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    maxLength="19"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded mt-1 font-mono focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400"
                  />
                </div>

                {/* Fecha y CVC */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Expiración (MM/YY) *</label>
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      maxLength="5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded mt-1 font-mono focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">CVC (3-4 dígitos) *</label>
                    <input
                      type="text"
                      name="cvc"
                      placeholder="123"
                      value={cardData.cvc}
                      onChange={handleCardChange}
                      maxLength="4"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded mt-1 font-mono focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Información de seguridad - SOLO en modo real */}
            {paymentIntent && !isSimulatedPayment(paymentIntent) && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-300 mb-2">🔒 Pago Seguro con Stripe</p>
                <p className="text-xs text-green-800 dark:text-green-300">
                  Tu información de pago se procesa de forma segura. No almacenamos datos de tarjeta.
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={handleProcesarPago}
                disabled={procesandoPago}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {procesandoPago ? '⏳ Procesando...' : '✓ Confirmar Pago'}
              </Button>
              <Button
                onClick={handleCancelar}
                disabled={procesandoPago}
                variant="secondary"
                className="flex-1"
              >
                ✕ Cancelar
              </Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Al confirmar, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </Card>
        )}
      </div>

      {/* HISTORIAL DE SUSCRIPCIONES */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📜 Historial de Cambios</h3>
        <div className="space-y-3">
          {suscripcionActual ? (
            <div className="flex justify-between items-center pb-3 border-b dark:border-slate-700">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Plan Actual: {suscripcionActual.plan?.nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Desde {new Date(suscripcionActual.inicio).toLocaleDateString()} hasta{' '}
                  {new Date(suscripcionActual.fin).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  ${(suscripcionActual.plan?.precio_centavos / 100).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Activo</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Sin historial de suscripciones</p>
          )}
        </div>
      </Card>

      {/* INFORMACIÓN ÚTIL */}
      <Card className="bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">💡 Preguntas Frecuentes</h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">¿Qué pasa si cambio de plan?</p>
            <p>El nuevo plan se aplicará después del vencimiento de tu período actual. Mientras tanto, continuarás con tu plan actual.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">¿Puedo renovar antes de que venza?</p>
            <p>Sí, puedes renovar adelantadamente. El nuevo período comenzará después del actual.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">¿Cómo cancelo la suscripción?</p>
            <p>Contacta a soporte para cancelar. Tu acceso continuará hasta fin de período.</p>
          </div>
        </div>
      </Card>

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
      {mostrarConfirmacionCancelacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white dark:bg-slate-800 border-red-300 dark:border-red-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmar Cancelación</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Estás a punto de cancelar un cambio de plan programado.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">⚠️ Importante:</p>
                <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                  <li>• Tu plan actual continuará sin cambios</li>
                  <li>• Se perderá el cambio de plan programado</li>
                  <li>• Esta acción no se puede deshacer</li>
                  <li>• No habrá devolución de pagos</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>¿Quieres continuar?</strong> Por favor confirma que entiendes las implicaciones.
                </p>
              </div>
            </div>

            {/* Checkbox de confirmación */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <input
                type="checkbox"
                id="confirmar-cancelacion"
                checked={cancelacionConfirmada}
                onChange={(e) => setCancelacionConfirmada(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="confirmar-cancelacion" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                Confirmo que he leído y entiendo que esta acción no se puede deshacer
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setMostrarConfirmacionCancelacion(false)
                  setCancelacionConfirmada(false)
                }}
                variant="secondary"
                className="flex-1"
                disabled={loading}
              >
                ← Mantener Cambio
              </Button>
              <Button
                onClick={confirmarCancelacion}
                disabled={!cancelacionConfirmada || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 hover:enabled:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Cancelando...' : '✕ Cancelar Cambio'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Si tienes preguntas, contacta con soporte
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}