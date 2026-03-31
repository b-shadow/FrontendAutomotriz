import { Card, Button } from '../../components/ui'

export const DashboardHome = ({ user, tenant, tenantSlug }) => {
  return (
    <div className="space-y-8">
      {/* WELCOME SECTION */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          👋 Bienvenido, {user?.nombres}!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Dashboard de {tenant?.nombre}
        </p>
      </div>

      {/* QUICK INFO */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ℹ️ Información Útil</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">🔗 URL del Tenant</p>
            <p className="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-slate-700 p-2 rounded border border-gray-200 dark:border-slate-600">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/${tenantSlug}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">📧 Soporte</p>
            <p className="text-gray-900 dark:text-gray-100">
              Para reportar problemas, contacta al equipo de administración
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
