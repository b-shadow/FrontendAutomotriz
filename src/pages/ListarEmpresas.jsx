import { Wrench, Building2, Search, Mail, Phone, Globe } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-100 text-carbon-900 transition-colors duration-300 dark:bg-carbon-950 dark:text-white">
      {/* FONDO GLOBAL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-burgundy-400/8 blur-3xl dark:bg-burgundy-500/8" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-400/5 blur-3xl dark:bg-primary-500/5" />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/95 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.06] dark:bg-carbon-950/95 shadow-md dark:shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-burgundy-700 text-lg text-white shadow-lg shadow-primary-900/20">
              <Wrench className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold text-carbon-900 sm:text-2xl dark:text-white tracking-tight">
                AutoTaller <span className="text-primary-500">Pro</span>
              </h1>
              <p className="hidden text-xs text-carbon-500 dark:text-neutral-400 sm:block tracking-wide">
                Sistema profesional para talleres automotrices
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="rounded-xl border-2 border-primary-500/40 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-carbon-800 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500 hover:text-primary-600 dark:border-primary-400/30 dark:bg-white/[0.04] dark:text-white dark:hover:border-primary-400 dark:hover:text-primary-400"
            >
              ← Volver al Inicio
            </Button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {/* HERO / HEADER */}
        <section className="mb-10 rounded-2xl border border-neutral-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_30px_80px_rgba(220,38,38,0.06)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm dark:border-primary-400/20 dark:bg-primary-900/15 dark:text-primary-200">
                <span className="text-base"><Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
                Empresas registradas en la plataforma
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl tracking-tight">
                Accede al ecosistema de{' '}
                <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-burgundy-500 bg-clip-text text-transparent">
                  talleres automotrices
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-carbon-600 dark:text-neutral-300">
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
                  className="rounded-xl border border-neutral-200 bg-white/80 p-4 text-center shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="text-lg font-bold text-carbon-900 dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-sm text-carbon-500 dark:text-neutral-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/85 p-3 shadow-md backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.03]">
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-carbon-400 dark:text-neutral-500">
              <Search className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Buscar empresa por nombre o slug..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-4 pl-14 pr-4 text-carbon-900 outline-none transition placeholder:text-carbon-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-200/50 dark:border-white/[0.06] dark:bg-carbon-900/70 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-primary-400 dark:focus:ring-primary-500/20"
            />
          </div>
        </section>

        {/* ERROR */}
        {error && !loading && (
          <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50/90 p-5 text-primary-700 shadow-sm dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
              <p className="font-medium text-carbon-600 dark:text-neutral-300 tracking-wide">
                Cargando empresas...
              </p>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && empresasFiltradas.length === 0 && (
          <div className="rounded-2xl border border-neutral-200/70 bg-white/80 p-10 text-center shadow-lg backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="mb-4 text-5xl"><Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></div>
            <p className="mb-6 text-xl text-carbon-600 dark:text-neutral-300">
              {filtro ? 'No se encontraron empresas que coincidan con tu búsqueda' : 'No hay empresas disponibles en este momento'}
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
                className="group overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/85 shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                {/* TOP */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-burgundy-600 to-carbon-800 px-6 py-8 text-white">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl shadow-lg backdrop-blur-sm">
                      <Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                      Empresa
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-carbon-900 transition group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 tracking-tight">
                      {empresa.nombre}
                    </h3>

                    <code className="mt-3 inline-block rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-sm font-medium text-primary-600 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-primary-400">
                      {empresa.slug}
                    </code>
                  </div>

                  <div className="space-y-3 text-sm">
                    {empresa.email && (
                      <div className="flex items-center gap-3 rounded-xl bg-neutral-100/80 px-4 py-3 text-carbon-600 dark:bg-white/[0.03] dark:text-neutral-300">
                        <span><Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
                        <span className="truncate">{empresa.email}</span>
                      </div>
                    )}

                    {empresa.telefono && (
                      <div className="flex items-center gap-3 rounded-xl bg-neutral-100/80 px-4 py-3 text-carbon-600 dark:bg-white/[0.03] dark:text-neutral-300">
                        <span><Phone className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
                        <span>{empresa.telefono}</span>
                      </div>
                    )}

                    {empresa.website && (
                      <div className="flex items-center gap-3 rounded-xl bg-neutral-100/80 px-4 py-3 dark:bg-white/[0.03]">
                        <span><Globe className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
                        <a
                          href={empresa.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Visitar sitio
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-white/[0.06]">
                    <Button
                      onClick={() => navigate(`/${empresa.slug}/login`)}
                      className="w-full rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-burgundy-600 px-5 py-3 font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 hover:shadow-xl"
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
          <section className="mt-16 rounded-2xl border border-neutral-200/70 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_30px_80px_rgba(220,38,38,0.06)]">
            <h3 className="text-2xl font-bold text-carbon-900 dark:text-white tracking-tight">
              ¿No ves tu empresa
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-carbon-600 dark:text-neutral-300">
              Registra tu empresa en la plataforma y comienza a gestionar tus operaciones
              con una experiencia moderna y profesional.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/empresas/nueva')}
                className="rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-burgundy-600 px-6 py-3 font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 hover:shadow-xl"
              >
                Registrar Nueva Empresa →
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mt-20 border-t border-neutral-200/70 bg-white/70 py-8 text-center text-carbon-500 backdrop-blur-xl dark:border-white/[0.06] dark:bg-carbon-950/70 dark:text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p>&copy; 2026 AutoTaller Pro. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default ListarEmpresas
