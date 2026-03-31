import { useState } from 'react'
import {
  //canViewBitacora,
  canManageUsers,
  canManageCompany,
  canManageSuscription,
  //canViewVehiculos,
  //canViewServiciosCatalogo,
  //canViewEspaciosTrabajo,
  //canViewPlanVehiculo,
  //canViewCitas,
} from '../utils/roleHelper'

// Icono Chevron
const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 14l-7 7m0 0l-7-7m7 7V3"
    />
  </svg>
)

export const TenantSidebar = ({
  user,
  activeView,
  onNavigate,
  tenantSlug,
  tenant,
  isMobileOpen = false,
  onMobileClose = () => {},
  onLogout = () => {},
}) => {
  const [expandedModules, setExpandedModules] = useState({
    gestionUsuarios: true,
    reportesEstadisticas: false,
    modulo2: false,
    modulo3: false,
    modulo4: false,
  })

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }))
  }

  const handleNavigateMobile = (itemId) => {
    onNavigate(itemId)
    if (isMobileOpen) {
      onMobileClose()
    }
  }

  const menuItems = {
    gestionUsuarios: {
      label: '👥 Gestión de Usuarios',
      icon: '👥',
      items: [
        { id: 'dashboard', label: '📊 Dashboard', visible: true },
        { id: 'editarPerfil', label: '✏️ Editar Perfil de Usuario', visible: true },
        {
          id: 'gestionEmpresa',
          label: '🏢 Gestionar Empresa',
          visible: canManageCompany(user),
        },
        {
          id: 'gestionUsuariosRoles',
          label: '👨‍💼 Gestionar Usuarios y Roles',
          visible: canManageUsers(user),
        },
        {
          id: 'gestionSuscripciones',
          label: '💳 Gestionar Suscripción',
          visible: canManageSuscription(user),
        },
        /*{ id: 'notificaciones', label: '🔔 Gestionar Notificaciones', visible: true },*/
      ],
    },
    modulo2: {
      label: '🚗 Vehículos, Servicios y Citas',
      icon: '🚗',
      items: [
        /* {
          id: 'gestionVehiculos',
          label: '🚗 Gestionar Vehículos',
          visible: canViewVehiculos(user),
        },
        {
          id: 'planVehiculo',
          label: '📋 Plan de Vehículo',
          visible: canViewPlanVehiculo(user),
        },
        {
          id: 'catalogoServicios',
          label: '🛠️ Catálogo de Servicios',
          visible: canViewServiciosCatalogo(user),
        },
        {
          id: 'espaciosTrabajo',
          label: '🛠️ Espacios de Trabajo',
          visible: canViewEspaciosTrabajo(user),
        },
        {
          id: 'horarios',
          label: '⏰ Horarios',
          visible: canViewEspaciosTrabajo(user),
        },
        {
          id: 'citas',
          label: '📅 Gestionar Citas',
          visible: canViewCitas(user),
        }, */
      ],
    },
    modulo3: {
      label: '📈 Módulo',
      icon: '📈',
      items: [
        {
          id: 'modulo3placeholder',
          label: '⏳ Próximamente',
          visible: true,
        },
      ],
    },
    modulo4: {
      label: '⚙️ Módulo',
      icon: '⚙️',
      items: [
        {
          id: 'modulo4placeholder',
          label: '⏳ Próximamente',
          visible: true,
        },
      ],
    },
    reportesEstadisticas: {
      label: '📊 Reportes y Estadísticas',
      icon: '📊',
      items: [
        /* {
          id: 'generarReportes',
          label: '📄 Generar Reportes',
          visible: true,
        },
        {
          id: 'bitacora',
          label: '📋 Visualizar Bitácora',
          visible: canViewBitacora(user),
        },
        {
          id: 'historialNotificaciones',
          label: '📬 Historial de Notificaciones',
          visible: true,
        },
        {
          id: 'gestionarBackup',
          label: '💾 Gestionar Backup',
          visible: true,
        }, */
      ],
    },
  }

  const modules = [
    'gestionUsuarios',
    'modulo2',
    'modulo3',
    'modulo4',
    'reportesEstadisticas',
  ]

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`min-h-screen w-64 flex-col border-r border-slate-200/70 bg-white/95 text-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#0f0a25]/95 dark:text-slate-100 dark:shadow-[0_20px_50px_rgba(2,6,23,0.45)]
        ${
          isMobileOpen
            ? 'fixed left-0 top-0 z-50 flex md:z-30'
            : 'hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex'
        }`}
      >
        {/* Botón cerrar móvil */}
        <div className="absolute right-4 top-4 z-20 md:hidden">
          <button
            onClick={onMobileClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 px-4 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#120a2f]/95">
          <div className="rounded-[26px] border border-slate-200/60 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-blue-500 p-4 text-white shadow-[0_20px_45px_rgba(91,33,182,0.18)] dark:border-white/10 dark:from-fuchsia-600/90 dark:via-violet-600/90 dark:to-blue-600/90 dark:shadow-[0_20px_45px_rgba(91,33,182,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold shadow-lg">
                {tenant?.nombre?.charAt(0)?.toUpperCase() || 'T'}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-white">
                  {tenant?.nombre || 'Tenant'}
                </h3>
                <p className="truncate text-xs text-white/80">/{tenantSlug}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {modules.map((moduleName) => {
              const module = menuItems[moduleName]
              const isExpanded = expandedModules[moduleName]
              const visibleItems = module.items.filter((item) => item.visible)

              if (visibleItems.length === 0) return null

              const hasActiveChild = visibleItems.some((item) => item.id === activeView)

              return (
                <div
                  key={moduleName}
                  className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-100/70 dark:border-white/8 dark:bg-white/[0.03]"
                >
                  {/* Módulo */}
                  <button
                    onClick={() => toggleModule(moduleName)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition duration-200 ${
                      hasActiveChild
                        ? 'bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-blue-500/10 text-slate-900 dark:from-fuchsia-500/15 dark:via-violet-500/10 dark:to-blue-500/15 dark:text-white'
                        : 'text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-base shadow-sm dark:bg-white/10 dark:shadow-inner">
                        {module.icon}
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {module.label.replace(/^..\s/, '')}
                      </span>
                    </span>

                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div className="px-2 pb-2">
                      <div className="space-y-1 rounded-2xl bg-white/70 p-2 dark:bg-black/10">
                        {visibleItems.map((item) => {
                          const isActive = activeView === item.id

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavigateMobile(item.id)}
                              title={item.label}
                              className={`group w-full rounded-2xl px-3 py-2.5 text-left text-sm transition duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                {isActive && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
                                )}
                                <span className={`truncate ${!isActive ? 'pl-1' : ''}`}>
                                  {item.label}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200/70 px-4 py-4 dark:border-white/10">
          <button
            onClick={onLogout}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:scale-[1.01] hover:from-red-500 hover:to-rose-500"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default TenantSidebar