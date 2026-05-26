import { Users, BarChart, Pencil, Building2, Briefcase, CreditCard, Car, ClipboardList, Settings, Clock, Calendar, Mailbox, Save, LogOut, Sparkles, Bot, NotebookTabs, ClipboardCheck, Wrench } from 'lucide-react'
import { useState } from 'react'
import {
  canViewBitacora,
  canManageUsers,
  canManageCompany,
  canManageSuscription,
  canViewVehiculos,
  canViewServiciosCatalogo,
  canViewEspaciosTrabajo,
  canViewPlanVehiculo,
  canViewCitas,
  canViewTallerInterno,
  canViewInventario,
  canViewRecepcionVehiculo,
  canManageBackups,
  canManageProveedores,
  canManageCompras,
  canManageVentasMostrador,
  canManagePagosTaller,
  canManageFacturas,
  canManageCaja,
} from '../utils/roleHelper'

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
    modulo2: false,
    atencionTecnica: false,
    inventarioGestionAdministrativa: false,
    reportesEstadisticas: false,
    inteligenciaArtificial: false,
  })

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    onLogout()
  }

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
      label: 'Gestión de Usuarios', icon: <Users className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        { id: 'dashboard', label: <><BarChart className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Dashboard</>, visible: true },
        { id: 'editarPerfil', label: <><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Perfil de Usuario</>, visible: true },
        {
          id: 'gestionEmpresa', label: <><Building2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Empresa</>,
          visible: canManageCompany(user),
        },
        {
          id: 'gestionUsuariosRoles', label: <><Briefcase className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Usuarios y Roles</>,
          visible: canManageUsers(user),
        },
        {
          id: 'gestionSuscripciones', label: <><CreditCard className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Suscripción</>,
          visible: canManageSuscription(user),
        },
      ],
    },
    modulo2: {
      label: 'Vehículos, Servicios y Citas', icon: <Car className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        {
          id: 'gestionVehiculos', label: <><Car className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Vehículos</>,
          visible: canViewVehiculos(user),
        },
        {
          id: 'planVehiculo', label: <><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Plan de Vehículo</>,
          visible: canViewPlanVehiculo(user),
        },
        {
          id: 'catalogoServicios', label: <><Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Catálogo de Servicios</>,
          visible: canViewServiciosCatalogo(user),
        },
        {
          id: 'espaciosTrabajo', label: <><Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Espacios de Trabajo</>,
          visible: canViewEspaciosTrabajo(user),
        },
        {
          id: 'horarios', label: <><Clock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Horarios</>,
          visible: canViewEspaciosTrabajo(user),
        },
        {
          id: 'citas', label: <><Calendar className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Citas</>,
          visible: canViewCitas(user),
        },
      ],
    },
    atencionTecnica: {
      label: 'Atención Técnica', icon: <Wrench className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        {
          id: 'recepcionVehiculo', label: <><ClipboardCheck className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Recepción de Vehículos</>,
          visible: canViewRecepcionVehiculo(user),
        },
        {
          id: 'presupuestos', label: <><CreditCard className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Presupuesto</>,
          visible: canViewCitas(user),
        },
        {
          id: 'ordenesTrabajo', label: <><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Órdenes de Trabajo</>,
          visible: canViewRecepcionVehiculo(user),
        },
        {
          id: 'tallerInterno', label: <><ClipboardCheck className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Taller Interno</>,
          visible: canViewTallerInterno(user),
        },
        {
          id: 'avanceVehiculo', label: <><Calendar className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Avance Vehículo</>,
          visible: true,
        },
      ],
    },
    inventarioGestionAdministrativa: {
      label: 'Inventario y Gestión Administrativa', icon: <Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        {
          id: 'inventario', label: <><Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Inventario</>,
          visible: canViewInventario(user),
        },
        {
          id: 'solicitudesRepuesto', label: <><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Solicitudes Repuesto</>,
          visible: canViewInventario(user),
        },
        {
          id: 'proveedores', label: <><Briefcase className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Proveedores</>,
          visible: canManageProveedores(user),
        },
        {
          id: 'comprasInsumos', label: <><NotebookTabs className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Compras de Insumos</>,
          visible: canManageCompras(user),
        },
        {
          id: 'ventasMostrador', label: <><CreditCard className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Venta Presencial</>,
          visible: canManageVentasMostrador(user),
        },
        {
          id: 'pagosTaller', label: <><CreditCard className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Registrar Pago</>,
          visible: canManagePagosTaller(user),
        },
        {
          id: 'facturasRecibos', label: <><Save className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Facturas y Recibos</>,
          visible: canManageFacturas(user),
        },
        {
          id: 'cajaMovimientos', label: <><BarChart className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Caja y Movimientos</>,
          visible: canManageCaja(user),
        },
      ],
    },
    reportesEstadisticas: {
      label: 'Reportes y Estadísticas', icon: <BarChart className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        {
          id: 'generarReportes', label: <><NotebookTabs className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Generar Reportes</>,
          visible: true,
        },
        {
          id: 'bitacora', label: <><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Visualizar Bitácora</>,
          visible: canViewBitacora(user),
        },
        {
          id: 'notificaciones', label: <><Mailbox className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Historial de Notificaciones</>,
          visible: true,
        },
        {
          id: 'gestionarBackup', label: <><Save className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Backup</>,
          visible: canManageBackups(user),
        },
      ],
    },
    inteligenciaArtificial: {
      label: 'Inteligencia Artificial', icon: <Sparkles className="inline-block mx-1 text-current" size={20} strokeWidth={2} />,
      items: [
        {
          id: 'asistenteIA', label: <><Bot className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Asistente IA</>,
          visible: true,
        },
      ],
    },
  }

  const modules = [
    'gestionUsuarios',
    'modulo2',
    'atencionTecnica',
    'inventarioGestionAdministrativa',
    'reportesEstadisticas',
    'inteligenciaArtificial',
  ]

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`h-screen w-64 flex-col border-r border-neutral-200/70 bg-white text-carbon-800 shadow-lg transition-colors duration-300 dark:border-white/[0.06] dark:bg-carbon-950 dark:text-neutral-100
        ${
          isMobileOpen ?
             'fixed left-0 top-0 z-50 flex md:z-30'
            : 'hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex'
        }`}
      >
        <div className="absolute right-4 top-4 z-20 md:hidden">
          <button
            onClick={onMobileClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-carbon-600 transition hover:bg-primary-50 hover:text-primary-500 hover:border-primary-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white px-4 py-5 dark:border-white/[0.06] dark:bg-carbon-950">
          <div className="rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-600 via-burgundy-600 to-carbon-900 p-4 text-white shadow-lg shadow-primary-900/20 dark:border-primary-800/40 dark:from-primary-700 dark:via-burgundy-700 dark:to-carbon-950">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold shadow-inner backdrop-blur-sm">
                {tenant.nombre.charAt(0).toUpperCase() || 'T'}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-white tracking-wide">
                  {tenant.nombre || 'Tenant'}
                </h3>
                <p className="truncate text-xs text-white/70">/{tenantSlug}</p>
              </div>
            </div>
          </div>
        </div>
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
                  className="overflow-hidden rounded-xl border border-neutral-200/70 bg-neutral-50/70 dark:border-white/[0.04] dark:bg-white/[0.02]"
                >
                  <button
                    onClick={() => toggleModule(moduleName)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition duration-200 ${
                      hasActiveChild ?
                         'bg-primary-50/80 text-carbon-900 dark:bg-primary-900/15 dark:text-white'
                        : 'text-carbon-700 hover:bg-neutral-100 hover:text-carbon-900 dark:text-neutral-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm dark:bg-white/[0.06] dark:shadow-inner">
                        {module.icon}
                      </span>
                      <span className="truncate text-sm font-semibold tracking-wide">
                        {module.label}
                      </span>
                    </span>

                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-2 pb-2">
                      <div className="space-y-1 rounded-xl bg-white/80 p-2 dark:bg-black/20">
                        {visibleItems.map((item) => {
                          const isActive = activeView === item.id

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavigateMobile(item.id)}
                              title={item.label}
                              className={`group w-full rounded-xl px-3 py-2.5 text-left text-sm transition duration-200 ${
                                isActive ?
                                   'bg-gradient-to-r from-primary-600 via-burgundy-600 to-carbon-800 text-white shadow-lg shadow-primary-900/20'
                                  : 'text-carbon-600 hover:bg-neutral-100 hover:text-carbon-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-neutral-100'
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

        <div className="border-t border-neutral-200/70 px-4 py-4 dark:border-white/[0.06]">
          <button
            onClick={handleLogoutClick}
            className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110 hover:shadow-xl"
          >
            <LogOut className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-carbon-900">
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
              Cerrar Sesión
            </h2>
            <p className="text-carbon-600 dark:text-neutral-400 mb-6">
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 font-semibold text-carbon-900 transition hover:bg-neutral-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-900/20 transition hover:brightness-110"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default TenantSidebar


