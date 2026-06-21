import {
  Building2,
  CheckCircle,
  Info,
  Mail,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { Card } from '../../components/ui'
import apiClient from '../../services/apiClient'
import { getRoleName } from '../../utils/roleHelper'

const CHART_COLORS = ['#d4572f', '#10203a', '#10b981', '#f59e0b', '#6366f1', '#ef4444']

const TONE_STYLES = {
  neutral: 'border-neutral-200 dark:border-white/[0.06]',
  success: 'border-emerald-200 dark:border-emerald-800/40',
  warning: 'border-amber-200 dark:border-amber-800/40',
  danger: 'border-rose-200 dark:border-rose-800/40',
}

const formatValue = (value, format) => {
  if (value === null || value === undefined) return '-'
  if (format === 'currency') {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(Number(value || 0))
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-BO').format(value)
  }
  return String(value)
}

const prettifyKey = (text) => {
  if (!text) return ''
  return String(text)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const KpiCard = ({ item }) => (
  <Card className={`p-5 border-l-4 border-l-primary-500 ${TONE_STYLES[item.tone] || TONE_STYLES.neutral}`}>
    <p className="text-xs uppercase tracking-[0.18em] text-carbon-500 dark:text-neutral-400">
      {item.label}
    </p>
    <p className="mt-2 text-2xl font-bold text-carbon-900 dark:text-white">
      {formatValue(item.value, item.format)}
    </p>
  </Card>
)

const DashboardChart = ({ chart }) => {
  const data = Array.isArray(chart?.data) ? chart.data : []
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-sm text-carbon-500 dark:border-white/[0.06] dark:text-neutral-400">
        Sin datos para mostrar
      </div>
    )
  }

  const xKey = chart.xKey || 'name'
  const yKey = chart.yKey || 'value'
  const series = Array.isArray(chart.series) ? chart.series : []

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chart.type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
              {data.map((entry, index) => (
                <Cell key={`${chart.id}-${entry.name || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px' }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        ) : chart.type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
            <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '12px' }} />
            {series.length ? (
              <>
                <Legend verticalAlign="bottom" height={30} />
                {series.map((serie, index) => (
                  <Line
                    key={`${chart.id}-${serie.key}`}
                    type="monotone"
                    dataKey={serie.key}
                    name={serie.label}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                ))}
              </>
            ) : (
              <Line type="monotone" dataKey={yKey} stroke="#d4572f" strokeWidth={3} dot={{ r: 4 }} />
            )}
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
            <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '12px' }} />
            {series.length ? (
              <>
                <Legend verticalAlign="bottom" height={30} />
                {series.map((serie, index) => (
                  <Bar
                    key={`${chart.id}-${serie.key}`}
                    dataKey={serie.key}
                    name={serie.label}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[8, 8, 0, 0]}
                  />
                ))}
              </>
            ) : (
              <Bar dataKey={yKey} fill="#10203a" radius={[8, 8, 0, 0]} />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

const DashboardTable = ({ table }) => {
  const rows = Array.isArray(table?.rows) ? table.rows : []
  return (
    <Card className="p-6">
      <h4 className="mb-4 text-lg font-bold text-carbon-900 dark:text-white">{table.title}</h4>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-white/[0.06]">
                {table.columns.map((column) => (
                  <th key={`${table.id}-${column}`} className="p-3 text-sm font-semibold text-carbon-500 dark:text-neutral-400">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${table.id}-${index}`} className="border-b border-neutral-100 dark:border-white/[0.03] hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                  {Object.values(row).map((value, valueIndex) => (
                    <td key={`${table.id}-${index}-${valueIndex}`} className="p-3 text-sm text-carbon-700 dark:text-neutral-300">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-sm text-carbon-500 dark:border-white/[0.06] dark:text-neutral-400">
          Sin registros para mostrar
        </div>
      )}
    </Card>
  )
}

const DashboardSection = ({ section }) => (
  <Card className="space-y-6 p-6">
    <div>
      <h3 className="text-xl font-bold text-carbon-900 dark:text-white">{section.title}</h3>
      <p className="mt-1 text-sm text-carbon-500 dark:text-neutral-400">{section.description}</p>
    </div>

    {section.kpis?.length ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {section.kpis.map((item) => (
          <KpiCard key={item.key} item={item} />
        ))}
      </div>
    ) : null}

    {section.charts?.length ? (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {section.charts.map((chart) => (
          <Card key={chart.id} className="p-6">
            <h4 className="mb-4 text-lg font-bold text-carbon-900 dark:text-white">{chart.title}</h4>
            <DashboardChart chart={chart} />
          </Card>
        ))}
      </div>
    ) : null}

    {section.tables?.length ? (
      <div className="grid grid-cols-1 gap-6">
        {section.tables.map((table) => (
          <DashboardTable key={table.id} table={table} />
        ))}
      </div>
    ) : null}
  </Card>
)

export const DashboardHome = ({ user, tenant, tenantSlug, onNavigate }) => {
  const [dashboard, setDashboard] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!tenantSlug) return
      setLoadingDashboard(true)
      try {
        const res = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/reportes/dashboard_kpis/`)
        if (mounted) setDashboard(res.data || null)
      } catch {
        if (mounted) setDashboard(null)
      } finally {
        if (mounted) setLoadingDashboard(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [tenantSlug])

  const summary = dashboard?.summary || []
  const sections = dashboard?.sections || []
  const fallbackKpis = !summary.length && dashboard?.kpis
    ? Object.entries(dashboard.kpis).map(([key, value]) => ({
        key,
        label: prettifyKey(key),
        value,
        format: typeof value === 'number' && String(key).includes('ingresos') ? 'currency' : 'number',
        tone: 'neutral',
      }))
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-carbon-900 dark:text-white">
          Bienvenido, {user.nombres}
        </h1>
        <p className="text-xl text-carbon-600 dark:text-neutral-300">
          Dashboard de {tenant.nombre}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-burgundy-50 dark:border-primary-800/30 dark:from-primary-900/15 dark:to-burgundy-900/15">
          <h3 className="mb-4 text-lg font-bold tracking-tight text-carbon-900 dark:text-white">
            <User className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Tu perfil
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Nombre completo</p>
              <p className="font-semibold text-carbon-900 dark:text-neutral-100">
                {user.nombres} {user.apellidos}
              </p>
            </div>
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Correo electronico</p>
              <p className="font-mono text-xs text-carbon-900 dark:text-neutral-100">{user.email}</p>
            </div>
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Rol operativo</p>
              <span className="inline-block rounded-full border border-primary-200 bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-700/40 dark:bg-primary-900/30 dark:text-primary-300">
                {getRoleName(user)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-neutral-300 bg-gradient-to-br from-carbon-50 to-neutral-100 dark:border-white/[0.06] dark:from-carbon-800/30 dark:to-carbon-900/30">
          <h3 className="mb-4 text-lg font-bold tracking-tight text-carbon-900 dark:text-white">
            <Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Informacion de empresa
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Nombre</p>
              <p className="font-semibold text-carbon-900 dark:text-neutral-100">{tenant.nombre}</p>
            </div>
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Slug</p>
              <p className="font-mono text-xs text-carbon-900 dark:text-neutral-100">{tenantSlug}</p>
            </div>
            <div>
              <p className="mb-1 text-carbon-500 dark:text-neutral-400">Estado</p>
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle className="inline-block mx-1 text-current" size={16} strokeWidth={2} /> Activo
              </span>
            </div>
          </div>
        </Card>
      </div>

      {loadingDashboard ? (
        <Card className="p-6">
          <p className="text-sm text-carbon-500 dark:text-neutral-400">Cargando KPIs del rol...</p>
        </Card>
      ) : null}

      {summary.length ? (
        <Card className="border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:border-white/[0.06] dark:from-carbon-800/20 dark:to-carbon-900/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-carbon-900 dark:text-white">Resumen ejecutivo</h3>
              <p className="text-sm text-carbon-500 dark:text-neutral-400">
                KPIs visibles para el rol {dashboard?.rol || getRoleName(user)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {summary.map((item) => (
              <KpiCard key={item.key} item={item} />
            ))}
          </div>
        </Card>
      ) : null}

      {!summary.length && fallbackKpis.length ? (
        <Card className="border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:border-white/[0.06] dark:from-carbon-800/20 dark:to-carbon-900/20">
          <h3 className="mb-4 text-lg font-bold tracking-tight text-carbon-900 dark:text-white">Indicadores del dia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {fallbackKpis.map((item) => (
              <KpiCard key={item.key} item={item} />
            ))}
          </div>
        </Card>
      ) : null}

      {sections.map((section) => (
        <DashboardSection key={section.id} section={section} />
      ))}

      <Card className="border-neutral-300 bg-gradient-to-r from-carbon-50 to-neutral-100 dark:border-white/[0.06] dark:from-carbon-800/20 dark:to-carbon-900/30">
        <h3 className="mb-4 text-xl font-bold tracking-tight text-carbon-900 dark:text-white">
          <Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Informacion util
        </h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="mb-1 text-carbon-500 dark:text-neutral-400">URL del tenant</p>
            <p className="rounded border border-neutral-200 bg-white p-2 font-mono text-xs text-carbon-900 dark:border-white/[0.06] dark:bg-carbon-800/60 dark:text-neutral-100">
              {typeof window !== 'undefined' ? `${window.location.origin}/${tenantSlug}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-carbon-500 dark:text-neutral-400">
              <Mail className="inline-block mx-1 text-current" size={16} strokeWidth={2} /> Soporte
            </p>
            <p className="text-carbon-900 dark:text-neutral-100">
              Para reportar problemas, contacta al equipo de administracion.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
