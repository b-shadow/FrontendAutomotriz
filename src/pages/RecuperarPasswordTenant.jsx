import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import authService from '../services/authService'
import { Button, Input } from '../components/ui'
import ThemeToggle from '../components/ThemeToggle'

export const RecuperarPasswordTenant = () => {
  const { tenantSlug } = useParams()
  const { tenant } = useTenant()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await authService.forgotPasswordTenant(tenantSlug, email)

      if (result.success) {
        setSubmittedEmail(email)
        setSuccess(true)
        setEmail('')

        setTimeout(() => {
          navigate(`/${tenantSlug}/login`)
        }, 3000)
      } else {
        setError(result.error || 'Error al procesar la solicitud')
      }
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
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

        {/* CARD CENTRADA */}
        <section className="mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)]">
            {/* HEADER */}
            <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-8 py-8 text-white dark:border-white/10">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
                  🔐
                </div>

                <h3 className="text-3xl font-black">Recuperar Contraseña</h3>

                <p className="mt-2 text-white/85">
                  {tenant?.nombre
                    ? `Solicita un enlace para restablecer el acceso a ${tenant.nombre}`
                    : 'Solicita un enlace para restablecer tu acceso'}
                </p>

                <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  /{tenantSlug}
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="p-8">
              {success ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-5xl">
                    ✅
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      ¡Revisa tu email!
                    </h4>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                      Hemos enviado instrucciones para recuperar tu contraseña a{' '}
                      <strong>{submittedEmail}</strong>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                    El enlace para restablecer tu contraseña expirará en 24 horas.
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Serás redirigido al login en unos momentos...
                  </p>

                  <Button
                    onClick={() => navigate(`/${tenantSlug}/login`)}
                    className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                  >
                    Ir al Login Ahora
                  </Button>
                </div>
              ) : (
                <>
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
                      help="Ingresa el email asociado a tu cuenta"
                    />

                    <Button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                    >
                      {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                    </Button>
                  </form>

                  <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-center text-sm dark:border-white/10">
                    <p className="text-slate-600 dark:text-slate-300">
                      ¿Recordaste tu contraseña?{' '}
                      <a
                        href={`/${tenantSlug}/login`}
                        className="font-semibold text-violet-700 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                      >
                        Inicia sesión aquí
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default RecuperarPasswordTenant