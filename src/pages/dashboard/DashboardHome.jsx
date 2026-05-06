import { Briefcase, ClipboardList, User, Users, Building2, CreditCard, Car, Calendar, BarChart, CheckCircle, Package, Rocket, Lightbulb, Check, Info, Mail, Bot } from 'lucide-react';
import { Card, Button } from '../../components/ui'

export const DashboardHome = ({ user, tenant, tenantSlug, onNavigate }) => {
  const getModulesAvailable = () => {
    const modules = []
    if (user) {
      const roleValue = user.role
      const hasAdminRole = Array.isArray(roleValue)
        ? roleValue.includes('ADMIN')
        : typeof roleValue === 'string'
          ? roleValue.includes('ADMIN')
          : false

      if (user.is_staff || hasAdminRole) {
        modules.push({ icon: <Users className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Gestión de Usuarios', id: 'gestionUsuariosRoles' })
        modules.push({ icon: <Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Gestión de Empresa', id: 'gestionEmpresa' })
        modules.push({ icon: <CreditCard className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Gestión de Suscripción', id: 'gestionSuscripciones' })
      }
      modules.push({ icon: <Car className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Vehículos y Servicios', id: 'gestionVehiculos' })
      modules.push({ icon: <Calendar className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Gestión de Citas', id: 'citas' })
      modules.push({ icon: <BarChart className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Reportes y Estadísticas', id: 'generarReportes' })
      modules.push({ icon: <Bot className="inline-block mx-1 text-current" size={20} strokeWidth={2} />, text: 'Asistente IA', id: 'asistenteIA' })
    }
    return modules
  }

  return (
    <div className="space-y-8">
      {/* WELCOME SECTION */}
      <div>
        <h1 className="text-4xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
          Bienvenido, {user.nombres}!
        </h1>
        <p className="text-xl text-carbon-600 dark:text-neutral-300">
          Dashboard de {tenant.nombre}
        </p>
      </div>

      {/* PERFIL DEL USUARIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-burgundy-50 dark:from-primary-900/15 dark:to-burgundy-900/15 border-primary-200 dark:border-primary-800/30">
          <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><User className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Tu Perfil</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Nombre Completo</p>
              <p className="text-carbon-900 dark:text-neutral-100 font-semibold">
                {user.nombres} {user.apellidos}
              </p>
            </div>
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Correo Electrónico</p>
              <p className="text-carbon-900 dark:text-neutral-100 font-mono text-xs">
                {user.email}
              </p>
            </div>
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Rol</p>
              <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium border border-primary-200 dark:border-primary-700/40">
                {user.is_staff ? <><Briefcase className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Administrador</> : <><Users className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Usuario</>}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-carbon-50 to-neutral-100 dark:from-carbon-800/30 dark:to-carbon-900/30 border-neutral-300 dark:border-white/[0.06]">
          <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Información de Empresa</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Nombre</p>
              <p className="text-carbon-900 dark:text-neutral-100 font-semibold">
                {tenant.nombre}
              </p>
            </div>
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Slug</p>
              <p className="text-carbon-900 dark:text-neutral-100 font-mono text-xs">
                {tenantSlug}
              </p>
            </div>
            <div>
              <p className="text-carbon-500 dark:text-neutral-400 mb-1">Estado</p>
              <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-700/40">
                <CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Activo
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* MÓDULOS DISPONIBLES */}
      <Card className="bg-gradient-to-r from-burgundy-50 to-primary-50 dark:from-burgundy-900/15 dark:to-primary-900/15 border-burgundy-200 dark:border-burgundy-800/30">
        <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><Package className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Módulos Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getModulesAvailable().map((module, idx) => (
            <button 
              key={idx} 
              onClick={() => onNavigate && onNavigate(module.id)}
              className="w-full text-left flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/[0.04] hover:bg-white hover:shadow-md dark:hover:bg-carbon-800 transition-all cursor-pointer group"
            >
              <span className="text-xl text-primary-500 group-hover:scale-110 transition-transform">{module.icon}</span>
              <span className="text-sm text-carbon-700 dark:text-neutral-300 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {module.text}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* GUÍA RÁPIDA */}
      <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-carbon-800/20 dark:to-carbon-900/20 border-neutral-200 dark:border-white/[0.06]">
        <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><Rocket className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guía Rápida de Navegación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <button onClick={() => onNavigate && onNavigate('dashboard')} className="w-full text-left p-3 bg-white/60 dark:bg-white/[0.03] rounded-lg border border-neutral-200/50 dark:border-white/[0.04] hover:bg-white hover:shadow-md dark:hover:bg-carbon-800 transition-all cursor-pointer group">
            <p className="font-semibold text-carbon-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"><BarChart className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Dashboard</p>
            <p className="text-carbon-600 dark:text-neutral-400">Resumen general de tu empresa</p>
          </button>
          <button onClick={() => onNavigate && onNavigate('gestionUsuariosRoles')} className="w-full text-left p-3 bg-white/60 dark:bg-white/[0.03] rounded-lg border border-neutral-200/50 dark:border-white/[0.04] hover:bg-white hover:shadow-md dark:hover:bg-carbon-800 transition-all cursor-pointer group">
            <p className="font-semibold text-carbon-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"><Users className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestión de Usuarios</p>
            <p className="text-carbon-600 dark:text-neutral-400">Administra usuarios y roles</p>
          </button>
          <button onClick={() => onNavigate && onNavigate('citas')} className="w-full text-left p-3 bg-white/60 dark:bg-white/[0.03] rounded-lg border border-neutral-200/50 dark:border-white/[0.04] hover:bg-white hover:shadow-md dark:hover:bg-carbon-800 transition-all cursor-pointer group">
            <p className="font-semibold text-carbon-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"><Calendar className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Citas</p>
            <p className="text-carbon-600 dark:text-neutral-400">Programa y gestiona citas</p>
          </button>
          <button onClick={() => onNavigate && onNavigate('bitacora')} className="w-full text-left p-3 bg-white/60 dark:bg-white/[0.03] rounded-lg border border-neutral-200/50 dark:border-white/[0.04] hover:bg-white hover:shadow-md dark:hover:bg-carbon-800 transition-all cursor-pointer group">
            <p className="font-semibold text-carbon-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Bitácora</p>
            <p className="text-carbon-600 dark:text-neutral-400">Historial de auditoría completo</p>
          </button>
        </div>
      </Card>

      {/* CONSEJOS Y SUGERENCIAS */}
      <Card className="bg-gradient-to-r from-primary-50 to-burgundy-50 dark:from-primary-900/10 dark:to-burgundy-900/10 border-primary-200 dark:border-primary-800/30">
        <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><Lightbulb className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Consejos Útiles</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary-500"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <span className="text-carbon-700 dark:text-neutral-300">
              Revisa regularmente la <strong>Bitácora</strong> para auditoría y seguridad
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-500"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <span className="text-carbon-700 dark:text-neutral-300">
              Mantén tu <strong>Perfil</strong> actualizado con información válida
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-500"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <span className="text-carbon-700 dark:text-neutral-300">
              Usa <strong>Reportes</strong> para analizar datos y estadísticas
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-500"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <span className="text-carbon-700 dark:text-neutral-300">
              Configura <strong>Notificaciones</strong> según tus preferencias
            </span>
          </li>
        </ul>
      </Card>

      {/* QUICK INFO - Al final como solicitaste */}
      <Card className="bg-gradient-to-r from-carbon-50 to-neutral-100 dark:from-carbon-800/20 dark:to-carbon-900/30 border-neutral-300 dark:border-white/[0.06]">
        <h3 className="text-xl font-bold text-carbon-900 dark:text-white mb-4 tracking-tight"><Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Información Útil</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-carbon-500 dark:text-neutral-400 mb-1">🔗 URL del Tenant</p>
            <p className="text-carbon-900 dark:text-neutral-100 font-mono text-xs bg-white dark:bg-carbon-800/60 p-2 rounded border border-neutral-200 dark:border-white/[0.06]">
              {typeof window !== 'undefined' ? `${window.location.origin}/${tenantSlug}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-carbon-500 dark:text-neutral-400 mb-1"><Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Soporte</p>
            <p className="text-carbon-900 dark:text-neutral-100">
              Para reportar problemas, contacta al equipo de administración
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
