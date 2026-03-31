import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import authService from '../services/authService'
import tokenStorage from '../services/tokenStorage'
import { Button, Input } from '../components/ui'
import ThemeToggle from '../components/ThemeToggle'
import imgLogin from '../assets/Imagen para login.png'

export const LoginTenant = () => {
  const { tenantSlug } = useParams()
  const { tenant, setUser } = useTenant()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await authService.loginTenant(tenantSlug, email, password)

    if (result.success) {
      tokenStorage.setTenantToken(tenantSlug, result.tokens?.access)
      tokenStorage.setTenantRefreshToken(tenantSlug, result.tokens?.refresh)
      tokenStorage.setTenantUser(tenantSlug, result.usuario)
      setUser(result.usuario)
      navigate(`/${tenantSlug}/app`)
    } else {
      setError(result.error || 'Error al iniciar sesión')
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
        {/* UTILIDADES SUPERIORES */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_520px]">
          {/* PANEL IZQUIERDO */}
<section className="hidden lg:block">
  <div className="max-w-2xl">
    <h2 className="max-w-3xl text-5xl font-black leading-tight">
      Ingresa a{' '}
      <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
        {tenant?.nombre || 'tu empresa'}
      </span>
    </h2>

    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
      Accede al sistema para gestionar operaciones, vehículos, órdenes de
      trabajo, citas, pagos y reportes desde una experiencia moderna y segura.
    </p>

    <div className="mt-10 grid grid-cols-2 gap-5 sm:max-w-lg">
      {[
        { label: 'Empresa', value: tenant?.nombre || tenantSlug || 'Tenant' },
        { label: 'Estado', value: 'Activo' },
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

    {/* IMAGEN ABAJO A LA IZQUIERDA */}
    <div className="mt-8 max-w-[420px] overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)]">
  <img
    src={imgLogin}
    alt="Reserva y estadísticas en taller automotriz"
    className="w-full h-auto object-cover"
  />
</div>
  </div>
</section>

          {/* FORM LOGIN */}
          <section className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)]">
              {/* HEADER CARD */}
              <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-8 py-8 text-white dark:border-white/10">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
                    🔑
                  </div>

                  <h3 className="text-3xl font-black">
                    {tenant?.nombre || 'Acceso'}
                  </h3>

                  <p className="mt-2 text-white/85">
                    Inicia sesión en tu cuenta
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
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />

                  <Input
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                  >
                    {loading ? 'Iniciando sesión...' : 'Ingresar'}
                  </Button>
                </form>

                <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-center text-sm dark:border-white/10">
                  <p className="text-slate-600 dark:text-slate-300">
                    ¿No tienes cuenta?{' '}
                    <a
                      href={`/${tenantSlug}/registro`}
                      className="font-semibold text-violet-700 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                    >
                      Regístrate aquí
                    </a>
                  </p>

                  <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <a
                      href={`/${tenantSlug}/forgot-password`}
                      className="text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <a
                      href="/"
                      className="text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ← Volver al inicio
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default LoginTenant