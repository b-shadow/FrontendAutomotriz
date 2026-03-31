import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import ThemeToggle from '../components/ThemeToggle'

/**
 * RegistrarEmpresa: Multi-step wizard para registrar una nueva empresa.
 */
function RegistrarEmpresa() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planes, setPlanes] = useState([])
  const [planesLoading, setPlanesLoading] = useState(true)
  // Step 1: Plan selection
  const [selectedPlan, setSelectedPlan] = useState(null)
  // Step 2: Empresa + Usuario data
  const [formData, setFormData] = useState({
    // Empresa
    nombre: '',
    slug: '',
    nit: '',
    // Usuario admin
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  // Step 3: Payment
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  })
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  // Step 4: Success
  const [successData, setSuccessData] = useState(null)
  // Load planes on mount
  useEffect(() => {
    const loadPlanes = async () => {
      try {
        const result = await authService.getPlanes()
        if (result.success) {
          setPlanes(result.planes || [])
        } else {
          setError('Error al cargar planes: ' + result.error)
        }
      } catch (err) {
        setError('Error al cargar planes: ' + err.message)
      } finally {
        setPlanesLoading(false)
      }
    }
    loadPlanes()
  }, [])
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  const validateStep2 = () => {
    if (!formData.nombre.trim()) return 'El nombre de la empresa es requerido'
    if (!formData.slug.trim()) return 'El slug es requerido'
    if (!/^[a-z0-9-]+$/.test(formData.slug)) return 'El slug solo puede contener letras minúsculas, números y guiones'
    if (!formData.nit.trim()) return 'El NIT es requerido'
    if (!formData.nombres.trim()) return 'Los nombres son requeridos'
    if (!formData.apellidos.trim()) return 'Los apellidos son requeridos'
    if (!formData.email.trim()) return 'El email es requerido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido'
    if (formData.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }
  const handleConfirmPayment = useCallback(async () => {
    // Llamar a confirmarPagoEmpresa para finalizar el registro
    setLoading(true)
    setError('')
    try {
      const result = await authService.confirmarPagoEmpresa(paymentIntentId)
      if (result.success && result.empresa && result.empresa.slug) {
        setSuccessData(result)
        // Usar el slug devuelto por el backend para redirigir al login de la empresa
        const empresaSlug = result.empresa.slug
        // Esperar 4 segundos para asegurar que la BD esté sincronizada antes de redirigir
        setTimeout(() => {
          console.log(`Redirigiendo a /${empresaSlug}/login`)
          navigate(`/${empresaSlug}/login`)
        }, 4000)
      } else {
        // Si no hay empresa o slug válido, mostrar error claro
        const errorMsg = 
          !result.success 
            ? result.error || 'Error al confirmar el pago' 
            : 'La empresa registrada no tiene un identificador válido. Por favor contacta soporte.'
        setError(errorMsg)
      }
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [paymentIntentId, navigate])
  // Cuando llegamos al step 4 con un paymentIntentId, confirmar el pago automáticamente
  useEffect(() => {
    if (step === 4 && paymentIntentId && !successData && !loading) {
      handleConfirmPayment()
    }
  }, [step, paymentIntentId, successData, loading, handleConfirmPayment])
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
  const validateCardData = () => {
    const cardNumber = cardData.cardNumber.replace(/\s/g, '')
    if (!cardNumber || cardNumber.length !== 16) return 'Número de tarjeta inválido'
    if (!cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) return 'Fecha de expiración inválida (MM/YY)'
    if (!cardData.cvc || cardData.cvc.length < 3) return 'CVC inválido'
    if (!cardData.cardholderName.trim()) return 'Nombre del titular requerido'
    return null
  }
  const handlePaymentSubmit = async () => {
    // Validar datos de tarjeta
    const cardError = validateCardData()
    if (cardError) {
      setError(cardError)
      return
    }
    // Proceder con la creación del pago
    setLoading(true)
    setError('')
    try {
      const result = await authService.crearPagoEmpresa(
        selectedPlan.id,
        {
          nombre: formData.nombre,
          slug: formData.slug,
          nit: formData.nit,
        },
        {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          password: formData.password,
        }
        // Nota: Los datos de la tarjeta se enviarían a Stripe, no al backend
        // En una implementación real, usaríamos Stripe.js para crear un token
      )

      if (result.success) {
        setPaymentIntentId(result.paymentIntentId)
        setStep(4)
      } else {
        setError(result.error || 'Error al procesar el pago')
      }
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#120a2f]/95 shadow-md dark:shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 transition hover:opacity-80"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg text-white shadow-lg shadow-violet-500/20">
            🚗
          </div>

          <div className="text-left">
            <h1 className="text-lg font-bold text-slate-900 sm:text-2xl dark:text-white">
              SaaS Taller Automotriz
            </h1>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Gestión moderna para talleres y empresas
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          <button
            onClick={() => navigate('/')}
            className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400 dark:hover:text-violet-300"
          >
            ← Volver al Inicio
          </button>
        </div>
      </div>
    </nav>
  )

  const renderBackground = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />
      <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10" />
    </div>
  )
  
  // STEP 1: Plan Selection
  if (step === 1) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
        {renderBackground()}
        {renderNavbar()}
        
        <div className="relative z-10 pt-24 sm:pt-28 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Paso 1: Selecciona un Plan
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-8">
                Elige el plan que mejor se ajusta a tu empresa
              </p>

              {planesLoading ? (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-slate-600 dark:text-slate-300">Cargando planes...</p>
                </div>
              ) : planes.length === 0 ? (
                <div className="text-center p-8 text-red-600 dark:text-red-400">
                  No hay planes disponibles. Intenta más tarde.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 mb-6">
                    {planes.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${
                          selectedPlan?.id === plan.id
                            ? 'border-violet-400 bg-violet-50/50 dark:border-violet-400 dark:bg-violet-500/10 shadow-lg'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{plan.nombre}</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{plan.descripcion || 'Sin descripción'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">${plan.precio_usd.toFixed(2)}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">/mes</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-400 text-red-700 dark:text-red-200 mb-6 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/')}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white/80 px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400 dark:hover:text-violet-300"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={!selectedPlan}
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-6 py-3 text-base font-bold text-white shadow-2xl shadow-violet-500/20 transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente Paso →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 2: Empresa + Usuario data
  if (step === 2) {
    const validationError = validateStep2()

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
        {renderBackground()}
        {renderNavbar()}

        <div className="relative z-10 pt-24 sm:pt-28 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Paso 2: Datos de Empresa y Usuario
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                Plan seleccionado: <span className="font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{selectedPlan.nombre}</span>
              </p>
              <form className="space-y-6">
                {/* Empresa Section */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Datos de la Empresa</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Nombre de la Empresa</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleFormChange}
                        placeholder="Clínica San Juan"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Slug (URL identificador)</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleFormChange}
                        placeholder="clinica-san-juan"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Solo letras minúsculas, números y guiones</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">NIT</label>
                      <input
                        type="text"
                        name="nit"
                        value={formData.nit}
                        onChange={handleFormChange}
                        placeholder="123456789-0"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Usuario Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Usuario Administrador</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Nombres</label>
                        <input
                          type="text"
                          name="nombres"
                          value={formData.nombres}
                          onChange={handleFormChange}
                          placeholder="Juan"
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Apellidos</label>
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleFormChange}
                          placeholder="Pérez"
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="admin@empresa.com"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Contraseña</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Confirmar Contraseña</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleFormChange}
                        placeholder="Confirma tu contraseña"
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-400 text-red-700 dark:text-red-200 rounded">
                    {error}
                  </div>
                )}

                {validationError && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 rounded">
                    {validationError}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-slate-300 bg-white/80 px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400 dark:hover:text-violet-300"
                  >
                    ← Atrás
                  </button>
                  <button
                    disabled={!!validationError || loading}
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-6 py-3 text-base font-bold text-white shadow-2xl shadow-violet-500/20 transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Procesando...' : 'Siguiente Paso →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 3: Payment (Card Entry)
  if (step === 3) {
    const cardError = validateCardData()
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
        {renderBackground()}
        {renderNavbar()}

        <div className="relative z-10 pt-24 sm:pt-28 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Paso 3: Información de Pago
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-8">
                Ingresa los datos de tu tarjeta para proceder con el pago
              </p>
              
              {/* Resumen del pedido */}
              <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-6 mb-6 space-y-3 border border-slate-200 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Empresa:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formData.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Plan:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPlan.nombre}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-900 dark:text-white font-semibold">Total:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">${selectedPlan.precio_usd.toFixed(2)}</span>
                </div>
              </div>

              {/* Formulario de tarjeta */}
              <div className="bg-white dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Nombre del titular</label>
                  <input
                    type="text"
                    name="cardholderName"
                    placeholder="Juan Pérez García"
                    value={cardData.cardholderName}
                    onChange={handleCardChange}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Número de tarjeta</label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    maxLength="19"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Vencimiento</label>
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      maxLength="5"
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      placeholder="000"
                      value={cardData.cvc}
                      onChange={handleCardChange}
                      maxLength="4"
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono placeholder-slate-500 dark:placeholder-slate-400 transition focus:outline-none focus:border-violet-400 dark:focus:border-violet-400"
                    />
                  </div>
                </div>
              </div>

              {/* Datos de prueba de Stripe */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">💳 Datos de Prueba de Stripe:</p>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 font-mono">
                  <li>• Tarjeta exitosa: <strong>4242 4242 4242 4242</strong></li>
                  <li>• Tarjeta fallida: <strong>4000 0000 0000 0002</strong></li>
                  <li>• Expiración: cualquier fecha futura (ej: 04/25)</li>
                  <li>• CVC: cualquier 3 dígitos (ej: 424)</li>
                </ul>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-400 text-red-700 dark:text-red-200 mb-6 rounded">
                  {error}
                </div>
              )}
              {cardError && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 mb-6 rounded">
                  {cardError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white/80 px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400 dark:hover:text-violet-300 disabled:opacity-50"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={!!cardError || loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-6 py-3 text-base font-bold text-white shadow-2xl shadow-violet-500/20 transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pago →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 4: Confirmation
  if (step === 4) {
    if (successData && successData.empresa) {
      const { empresa, usuario } = successData
      return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
          {renderBackground()}
          {renderNavbar()}

          <div className="relative z-10 pt-24 sm:pt-28 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-2xl mx-auto px-4">
              <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 p-8 sm:p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  ¡Empresa Registrada Exitosamente!
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Tu empresa "{empresa.nombre}" está lista para usar. Serás redirigido al login en unos momentos...
                </p>

                <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-6 space-y-3 text-left">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Empresa:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {empresa.nombre} ({empresa.slug})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Usuario Administrativo:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {usuario?.email || formData.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Plan:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedPlan.nombre}</p>
                  </div>
                </div>
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Confirmando pago...
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
        {renderBackground()}
        {renderNavbar()}

        <div className="relative z-10 pt-24 sm:pt-28 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 p-8 sm:p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Confirmando tu Pago...
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Por favor espera mientras procesamos tu registro.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default RegistrarEmpresa
