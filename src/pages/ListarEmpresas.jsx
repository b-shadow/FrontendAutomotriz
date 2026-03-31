import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import { Button } from '../components/ui'
import ThemeToggle from '../components/ThemeToggle'

function ListarEmpresas() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [empresas, setEmpresas] = useState([])
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const result = await authService.getEmpresas()
        if (result.success) {
          setEmpresas(result.empresas || [])
        } else {
          setError(result.error || 'Error al cargar empresas')
        }
      } catch (err) {
        setError('Error: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    cargarEmpresas()
  }, [])

  const empresasFiltradas = empresas.filter((empresa) =>
    empresa.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    empresa.slug.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0b0720] dark:text-white">
      {/* FONDO GLOBAL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10" />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#120a2f]/95 shadow-md dark:shadow-lg">
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

            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400 dark:hover:text-violet-300"
            >
              ← Volver al Inicio
            </Button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {/* HERO / HEADER */}
        <section className="mb-10 rounded-[32px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200">
                <span className="text-base">🏢</span>
                Empresas registradas en la plataforma
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Accede al ecosistema de{' '}
                <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  talleres automotrices
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Busca una empresa registrada, revisa su información básica y entra
                directamente al login correspondiente de su sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Empresas', value: empresas.length || '0' },
                { label: 'Búsqueda', value: 'Rápida' },
                { label: 'Acceso', value: 'Directo' },
                { label: 'Plataforma', value: 'SaaS' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
                >
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar empresa por nombre o slug..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-4 pl-14 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-200/50 dark:border-white/10 dark:bg-[#140d31]/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
            />
          </div>
        </section>

        {/* ERROR */}
        {error && !loading && (
          <div className="mb-8 rounded-[24px] border border-red-200 bg-red-50/90 p-5 text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Cargando empresas...
              </p>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && empresasFiltradas.length === 0 && (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 text-5xl">🏢</div>
            <p className="mb-6 text-xl text-slate-600 dark:text-slate-300">
              {filtro
                ? 'No se encontraron empresas que coincidan con tu búsqueda'
                : 'No hay empresas disponibles en este momento'}
            </p>

            {filtro && (
              <Button variant="secondary" onClick={() => setFiltro('')}>
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}

        {/* GRID EMPRESAS */}
        {!loading && empresasFiltradas.length > 0 && (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {empresasFiltradas.map((empresa) => (
              <div
                key={empresa.id}
                className="group overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(91,33,182,0.14)] dark:border-white/10 dark:bg-white/5"
              >
                {/* TOP */}
                <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-6 py-8 text-white">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
                      🏢
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      Empresa
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-slate-900 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                      {empresa.nombre}
                    </h3>

                    <code className="mt-3 inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-violet-300">
                      {empresa.slug}
                    </code>
                  </div>

                  <div className="space-y-3 text-sm">
                    {empresa.email && (
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        <span>📧</span>
                        <span className="truncate">{empresa.email}</span>
                      </div>
                    )}

                    {empresa.telefono && (
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        <span>📞</span>
                        <span>{empresa.telefono}</span>
                      </div>
                    )}

                    {empresa.website && (
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-white/5">
                        <span>🌐</span>
                        <a
                          href={empresa.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                        >
                          Visitar sitio
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
                    <Button
                      onClick={() => navigate(`/${empresa.slug}/login`)}
                      className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                    >
                      Acceder al Login →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* CTA FINAL */}
        {!loading && empresas.length > 0 && (
          <section className="mt-16 rounded-[32px] border border-slate-200/70 bg-white/80 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(76,29,149,0.18)]">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              ¿No ves tu empresa?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Registra tu empresa en la plataforma y comienza a gestionar tus operaciones
              con una experiencia moderna y profesional.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/empresas/nueva')}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
              >
                Registrar Nueva Empresa →
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mt-20 border-t border-slate-200/70 bg-white/70 py-8 text-center text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-[#120a2f]/70 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p>&copy; 2026 SaaS Taller Automotriz. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default ListarEmpresas