import { Card, Button } from '../../components/ui'

export const DashboardHome = ({ user, tenant, tenantSlug }) => {
  const getRoleLabel = (role) => {
    const roles = {
      ADMIN: '👨‍💼 Administrador',
      MANAGER: '📋 Gerente',
      STAFF: '👤 Personal',
      USER: '👥 Usuario',
    }
    return roles[role] || role
  }

  const getModulesAvailable = () => {
    const modules = []
    if (user) {
      if (user.is_staff || user.role?.includes('ADMIN')) {
        modules.push('👥 Gestión de Usuarios')
        modules.push('🏢 Gestión de Empresa')
        modules.push('💳 Gestión de Suscripción')
      }
      modules.push('🚗 Vehículos y Servicios')
      modules.push('📅 Gestión de Citas')
      modules.push('📊 Reportes y Estadísticas')
    }
    return modules
  }

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

      {/* PERFIL DEL USUARIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">👤 Tu Perfil</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Nombre Completo</p>
              <p className="text-gray-900 dark:text-gray-100 font-semibold">
                {user?.nombres} {user?.apellidos}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Correo Electrónico</p>
              <p className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                {user?.email}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Rol</p>
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                {user?.is_staff ? '👨‍💼 Administrador' : '👥 Usuario'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏢 Información de Empresa</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Nombre</p>
              <p className="text-gray-900 dark:text-gray-100 font-semibold">
                {tenant?.nombre}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Slug</p>
              <p className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                {tenantSlug}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Estado</p>
              <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                ✅ Activo
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* MÓDULOS DISPONIBLES */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📦 Módulos Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getModulesAvailable().map((module, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5">
              <span className="text-lg">{module.split(' ')[0]}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {module.split(' ').slice(1).join(' ')}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* GUÍA RÁPIDA */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🚀 Guía Rápida de Navegación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-white/60 dark:bg-white/5 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">📊 Dashboard</p>
            <p className="text-gray-600 dark:text-gray-400">Resumen general de tu empresa</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-white/5 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">👥 Gestión de Usuarios</p>
            <p className="text-gray-600 dark:text-gray-400">Administra usuarios y roles</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-white/5 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">📅 Citas</p>
            <p className="text-gray-600 dark:text-gray-400">Programa y gestiona citas</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-white/5 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">📋 Bitácora</p>
            <p className="text-gray-600 dark:text-gray-400">Historial de auditoría completo</p>
          </div>
        </div>
      </Card>

      {/* CONSEJOS Y SUGERENCIAS */}
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💡 Consejos Útiles</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span>✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              Revisa regularmente la <strong>Bitácora</strong> para auditoría y seguridad
            </span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              Mantén tu <strong>Perfil</strong> actualizado con información válida
            </span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              Usa <strong>Reportes</strong> para analizar datos y estadísticas
            </span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span className="text-gray-700 dark:text-gray-300">
              Configura <strong>Notificaciones</strong> según tus preferencias
            </span>
          </li>
        </ul>
      </Card>

      {/* QUICK INFO - Al final como solicitaste */}
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
