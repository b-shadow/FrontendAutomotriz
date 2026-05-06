import { Wrench, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import ThemeToggle from '../components/ThemeToggle'
import imgHeroWhite from '../assets/autoHome.jpg'
import imgHeroBlack from '../assets/autoHome.jpg'
import imgCaractWhite from '../assets/AutoHome2.jpg'
import imgCaractBlack from '../assets/AutoHome2.jpg'
import imgMultiTenant from '../assets/multitenant.jpg'
import imgSeguridad from '../assets/seguridad2.jpg'
import imgAnalitica from '../assets/analitica.jpg'

const floatingFeatureImages = [
  {
    src: imgMultiTenant, alt : 'Tarjeta Multi-Tenant',
  },
  {
    src: imgSeguridad, alt : 'Tarjeta Seguridad',
  },
  {
    src: imgAnalitica, alt : 'Tarjeta Analítica',
  },
]

const plans = [
  {
    name: 'Plan Mensual', price : '$50.00',
    duration: 'Suscripción por 30 días',
  },
  {
    name: 'Plan Trimestral', price : '$140.00',
    duration: 'Suscripción por 90 días',
  },
  {
    name: 'Plan Semestral', price : '$260.00',
    duration: 'Suscripción por 180 días',
  },
  {
    name: 'Plan Anual', price : '$480.00',
    duration: 'Suscripción por 365 días',
  },
]

function Home() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-100 text-carbon-900 transition-colors duration-300 dark:bg-carbon-950 dark:text-white">
      {/* FONDO GLOBAL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-burgundy-400/10 blur-3xl dark:bg-burgundy-500/8" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-400/5 blur-3xl dark:bg-primary-500/5" />
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200/70 bg-white/95 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.06] dark:bg-carbon-950/95 shadow-md dark:shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-burgundy-700 text-lg text-white shadow-lg shadow-primary-900/20">
              <Wrench className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-2xl tracking-tight">AutoTaller <span className="text-primary-500">Pro</span></h1>
              <p className="hidden text-xs text-carbon-500 dark:text-neutral-400 sm:block tracking-wide">
                Sistema profesional para talleres automotrices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <ul className="hidden items-center gap-6 md:flex">
              <li>
                <a
                  href="#inicio"
                  className="text-sm font-semibold text-carbon-600 transition hover:text-primary-500 dark:text-neutral-300 dark:hover:text-primary-400 tracking-wide uppercase"
                >
                  Inicio
                </a>
              </li>
              <li>
                <a
                  href="#caracteristicas"
                  className="text-sm font-semibold text-carbon-600 transition hover:text-primary-500 dark:text-neutral-300 dark:hover:text-primary-400 tracking-wide uppercase"
                >
                  Características
                </a>
              </li>
              <li>
                <a
                  href="#planes"
                  className="text-sm font-semibold text-carbon-600 transition hover:text-primary-500 dark:text-neutral-300 dark:hover:text-primary-400 tracking-wide uppercase"
                >
                  Precios
                </a>
              </li>
            </ul>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" className="relative z-10 pt-24 sm:pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-10">
          {/* TEXTO */}
          <div>
            <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl tracking-tight">
              Gestiona tu Taller Automotriz{' '}
              <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-burgundy-500 bg-clip-text text-transparent">
                desde cualquier lugar
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-carbon-600 dark:text-neutral-300">
              Controla empresas, vehículos, órdenes de trabajo, citas, pagos y reportes
              desde una experiencia moderna, visual y pensada para el flujo real de un
              taller automotriz.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => navigate('/empresas/nueva')}
                className="group rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-burgundy-600 px-7 py-4 text-base font-bold uppercase tracking-wider text-white shadow-2xl shadow-primary-900/20 transition hover:-translate-y-1 hover:shadow-primary-900/30"
              >
                Registrar Nueva Empresa
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </button>

              <button
                onClick={() => navigate('/empresas')}
                className="rounded-xl border-2 border-primary-500/40 bg-white/80 px-7 py-4 text-base font-semibold uppercase tracking-wider text-carbon-800 shadow-sm transition hover:-translate-y-1 hover:border-primary-500 hover:text-primary-600 dark:border-primary-400/30 dark:bg-white/[0.04] dark:text-white dark:hover:border-primary-400 dark:hover:text-primary-400"
              >
                Ver Empresas
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Vehículos', value: '1.2k+' },
                { label: 'Órdenes', value: '840+' },
                { label: 'Citas', value: '24/7' },
                { label: 'Reportes', value: 'Tiempo real' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="text-lg font-bold text-carbon-900 dark:text-white">{item.value}</div>
                  <div className="text-sm text-carbon-500 dark:text-neutral-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VISUAL HERO AUTOMOTRIZ */}
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={theme === 'dark' ? imgHeroBlack : imgHeroWhite}
              alt="Hero Dashboard"
              className="w-full h-auto rounded-2xl shadow-[0_30px_80px_rgba(220,38,38,0.12)] dark:shadow-[0_30px_80px_rgba(220,38,38,0.10)]"
            />
          </div>
        </div>
      </section>

      {/* FRANJA VISUAL + CARACTERÍSTICAS FLOTANTES */}
<section id="caracteristicas" className="relative z-10 pb-16 pt-24 sm:pb-20 sm:pt-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6">
    <div className="mb-10 text-center">
      <div className="mx-auto mb-4 accent-line"></div>
      <h3 className="mt-4 text-3xl font-black sm:text-4xl tracking-tight">
        Todo lo que tu taller necesita en una sola plataforma
      </h3>
      <p className="mx-auto mt-4 max-w-2xl text-base text-carbon-600 dark:text-neutral-300 sm:text-lg">
        Un sistema moderno para administrar la operación, seguridad y análisis de tu taller automotriz.
      </p>
    </div>

    {/* BLOQUE VISUAL */}
    <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.10)] dark:shadow-[0_30px_80px_rgba(220,38,38,0.08)]">
      <img
        src={theme === 'dark' ? imgCaractBlack : imgCaractWhite}
        alt="Características del Taller"
        className="w-full h-auto"
      />
    </div>

    {/* TARJETAS FLOTANTES */}
<div className="relative z-20 mx-auto -mt-16 grid max-w-5xl gap-5 place-items-center sm:-mt-20 lg:grid-cols-3">
  {floatingFeatureImages.map((item, index) => (
    <div
      key={index}
      className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_20px_45px_rgba(0,0,0,0.10)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(220,38,38,0.10)] dark:border-white/[0.06] dark:bg-carbon-900/90 dark:shadow-[0_25px_50px_rgba(0,0,0,0.30)]"
    >
      <img
        src={item.src}
        alt={item.alt}
        className="block w-full h-auto object-contain"
        loading="lazy"
      />
    </div>
  ))}
</div>
  </div>
</section>

      {/* PLANES */}
      <section id="planes" className="relative z-10 pb-20 pt-6 sm:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 accent-line"></div>
            <h3 className="mt-4 text-3xl font-black sm:text-4xl tracking-tight">Elige el plan ideal para tu empresa</h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-carbon-600 dark:text-neutral-300 sm:text-lg">
              Cuatro opciones claras para que puedas iniciar y escalar según el tamaño del taller.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:-translate-y-2 hover:shadow-xl dark:border-white/[0.06] dark:bg-white/[0.03] ${
                  index === 1
                   ? 'ring-2 ring-primary-500/50 dark:ring-primary-400/40'
                    : ''
                }`}
              >
                {index === 1 && (
                  <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-primary-600 to-burgundy-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Popular
                  </div>
                )}

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 via-burgundy-500/15 to-carbon-500/10 text-3xl">
                  <Calendar className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
                </div>

                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-carbon-900 dark:text-white tracking-tight">{plan.name}</h4>
                  <p className="mt-2 text-carbon-500 dark:text-neutral-400">{plan.duration}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black bg-gradient-to-r from-primary-500 via-primary-400 to-burgundy-500 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/empresas/nueva')}
                  className="w-full rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-burgundy-600 px-5 py-3 font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 hover:shadow-xl"
                >
                  Contratar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-neutral-200/70 bg-white/70 py-8 text-center text-carbon-500 backdrop-blur-xl dark:border-white/[0.06] dark:bg-carbon-950/70 dark:text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p>&copy; 2026 AutoTaller Pro. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home