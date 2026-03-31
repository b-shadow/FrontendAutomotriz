import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import authService from '../services/authService'
import { Button, Input } from '../components/ui'
import ThemeToggle from '../components/ThemeToggle'

export const RegistroTenant = () => {
  const { tenantSlug } = useParams()
  const { tenant, setUser } = useTenant()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombres: '',
    apellidos: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.nombres.trim()) return 'Los nombres son requeridos'
    if (!formData.apellidos.trim()) return 'Los apellidos son requeridos'
    if (!formData.email.trim()) return 'El email es requerido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido'
    if (formData.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const result = await authService.registerTenant(
      tenantSlug,
      formData.email,
      formData.password,
      formData.nombres,
      formData.apellidos
    )

    if (result.success) {
      setUser(result.usuario)
      navigate(`/${tenantSlug}/app`)
    } else {
      setError(result.error || 'Error al registrar')
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
      {/* FONDO GLOBAL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* UTILIDAD SUPERIOR */}
        <div className="mb-8 flex items-center">
          <ThemeToggle />
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_560px]">
          {/* PANEL IZQUIERDO */}
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <h2 className="max-w-3xl text-5xl font-black leading-tight">
                Crea tu acceso en{' '}
                <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  {tenant?.nombre || 'tu empresa'}
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Registra tu cuenta para comenzar a gestionar operaciones, vehículos,
                órdenes de trabajo, citas, pagos y reportes desde una experiencia
                moderna y segura.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-5 sm:max-w-lg">
                {[
                  { label: 'Empresa', value: tenant?.nombre || tenantSlug || 'Tenant' },
                  { label: 'Acceso', value: 'Nuevo' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-h-[145px] rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 flex flex-col items-center justify-center text-center"
                  >
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {item.value}
                    </div>
                    <div className="mt-2 text-base text-slate-500 dark:text-slate-400">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FORM REGISTRO */}
          <section className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)]">
              {/* HEADER CARD */}
              <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-8 py-8 text-white dark:border-white/10">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
                    📝
                  </div>

                  <h3 className="text-3xl font-black">
                    {tenant?.nombre || 'Registro'}
                  </h3>

                  <p className="mt-2 text-white/85">
                    Crea tu cuenta para ingresar al sistema
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    /{tenantSlug}
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-8">
                {error && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label="Nombres"
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      placeholder="Juan"
                      required
                      disabled={loading}
                    />

                    <Input
                      label="Apellidos"
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      placeholder="Pérez"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />

                  <Input
                    label="Contraseña"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    disabled={loading}
                  />

                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                  >
                    {loading ? 'Registrando...' : 'Registrarse'}
                  </Button>
                </form>

                <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-center text-sm dark:border-white/10">
                  <p className="text-slate-600 dark:text-slate-300">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                      to={`/${tenantSlug}/login`}
                      className="font-semibold text-violet-700 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default RegistroTenant