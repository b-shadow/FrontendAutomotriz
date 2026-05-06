import { Key } from 'lucide-react';
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
      tokenStorage.setTenantToken(tenantSlug, result.tokens.access)
      tokenStorage.setTenantRefreshToken(tenantSlug, result.tokens.refresh)
      tokenStorage.setTenantUser(tenantSlug, result.usuario)
      setUser(result.usuario)
      navigate(`/${tenantSlug}/app`)
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-100 text-carbon-900 transition-colors duration-300 dark:bg-carbon-950 dark:text-white">
      {/* FONDO GLOBAL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-burgundy-400/8 blur-3xl dark:bg-burgundy-500/8" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-400/5 blur-3xl dark:bg-primary-500/5" />
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
    <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight">
      Ingresa a{' '}
      <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-burgundy-500 bg-clip-text text-transparent">
        {tenant.nombre || 'tu empresa'}
      </span>
    </h2>

    <p className="mt-6 max-w-2xl text-lg leading-8 text-carbon-600 dark:text-neutral-300">
      Accede al sistema para gestionar operaciones, vehículos, órdenes de
      trabajo, citas, pagos y reportes desde una experiencia moderna y segura.
    </p>

    <div className="mt-10 grid grid-cols-2 gap-5 sm:max-w-lg">
      {[
        { label: 'Empresa', value: tenant.nombre || tenantSlug || 'Tenant' },
        { label: 'Estado', value: 'Activo' },
      ].map((item) => (
        <div
          key={item.label}
          className="min-h-[145px] rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.03] flex flex-col items-center justify-center text-center"
        >
          <div className="text-xl font-bold text-carbon-900 dark:text-white">
            {item.value}
          </div>
          <div className="mt-2 text-base text-carbon-500 dark:text-neutral-400">
            {item.label}
          </div>
        </div>
      ))}
    </div>

    {/* IMAGEN ABAJO A LA IZQUIERDA */}
    <div className="mt-8 max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/80 shadow-lg backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_30px_80px_rgba(220,38,38,0.06)]">
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
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/85 shadow-xl backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_30px_80px_rgba(220,38,38,0.06)]">
              {/* HEADER CARD */}
              <div className="relative overflow-hidden border-b border-neutral-200/70 bg-gradient-to-r from-primary-600 via-burgundy-600 to-carbon-800 px-8 py-8 text-white dark:border-white/[0.06]">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl shadow-lg backdrop-blur-sm">
                    <Key className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
                  </div>

                  <h3 className="text-3xl font-black tracking-tight">
                    {tenant.nombre || 'Acceso'}
                  </h3>

                  <p className="mt-2 text-white/85">
                    Inicia sesión en tu cuenta
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                    /{tenantSlug}
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/90 p-4 text-primary-700 shadow-sm dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200">
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
                    className="w-full rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-burgundy-600 px-5 py-3 font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 hover:shadow-xl"
                  >
                    {loading ? 'Iniciando sesión...' : 'Ingresar'}
                  </Button>
                </form>

                <div className="mt-8 space-y-4 border-t border-neutral-200 pt-6 text-center text-sm dark:border-white/[0.06]">
                  <p className="text-carbon-600 dark:text-neutral-300">
                    ¿No tienes cuenta{' '}
                    <a
                      href={`/${tenantSlug}/registro`}
                      className="font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Regístrate aquí
                    </a>
                  </p>

                  <div className="border-t border-neutral-200 pt-4 dark:border-white/[0.06]">
                    <a
                      href={`/${tenantSlug}/forgot-password`}
                      className="text-carbon-600 transition hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-400"
                    >
                      ¿Olvidaste tu contraseña
                    </a>
                  </div>

                  <div className="border-t border-neutral-200 pt-4 dark:border-white/[0.06]">
                    <a
                      href="/"
                      className="text-carbon-600 transition hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-400"
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