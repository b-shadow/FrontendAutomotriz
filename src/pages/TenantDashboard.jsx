/** TenantDashboard: Dashboard principal para usuarios logueados en un tenant
 * Ruta: /:tenantSlug/app (protegida por TenantGuard)
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import authService from '../services/authService'
import TenantSidebar from '../components/TenantSidebar'
import ThemeToggle from '../components/ThemeToggle'

// Importar vistas del dashboard
import { DashboardHome } from './dashboard/DashboardHome'
import { PerfilUsuarioView } from './dashboard/PerfilUsuarioView'
import { GestionEmpresaView } from './dashboard/GestionEmpresaView'
import { GestionUsuariosRolesView } from './dashboard/GestionUsuariosRolesView'
import { GestionSuscripcionView } from './dashboard/GestionSuscripcionView'
import { NotificacionesView } from './dashboard/NotificacionesView'
import { BitacoraView } from './dashboard/BitacoraView'
import GestionVehiculosView from './dashboard/GestionVehiculosView'
import CatalogoServiciosView from './dashboard/CatalogoServiciosView'
import { EspaciosTrabajoView } from '../components/espacios/EspaciosTrabajoView'
import { HorariosGeneralesView } from './dashboard/HorariosGeneralesView'
import PlanVehiculoView from './dashboard/PlanVehiculoView'
import GestionCitasView from './dashboard/GestionCitasView'

export const TenantDashboard = () => {
  const { tenantSlug } = useParams()
  const { user, tenant } = useTenant()
  const navigate = useNavigate()

  // Estado de la vista activa - por defecto muestra "dashboard"
  const [activeView, setActiveView] = useState('dashboard')
  // Estado del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Redireccionar si no hay usuario o tenant
  if (!user || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    // logout ahora es async: llama backend para revocar sesión
    await authService.logoutTenant(tenantSlug)
    // Redirigir al login
    navigate(`/${tenantSlug}/login`)
  }

  const handleNavigate = (viewId) => {
    setActiveView(viewId)
  }

  // Renderizar la vista activa
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'editarPerfil':
        return <PerfilUsuarioView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'gestionEmpresa':
        return <GestionEmpresaView user={user} tenant={tenant} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      case 'gestionUsuariosRoles':
        return (
          <GestionUsuariosRolesView user={user} tenant={tenant} tenantSlug={tenantSlug} />
        )
      case 'gestionSuscripciones':
        return <GestionSuscripcionView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'notificaciones':
        return <NotificacionesView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'bitacora':
        return <BitacoraView tenantSlug={tenantSlug} />
      case 'gestionVehiculos':
        return <GestionVehiculosView user={user} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      case 'catalogoServicios':
        return <CatalogoServiciosView user={user} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      case 'espaciosTrabajo':
        return <EspaciosTrabajoView user={user} tenantSlug={tenantSlug} />
      case 'horarios':
        return <HorariosGeneralesView user={user} tenantSlug={tenantSlug} />
      case 'planVehiculo':
        return <PlanVehiculoView user={user} tenantSlug={tenantSlug} />
      case 'citas':
        return <GestionCitasView user={user} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      default:
        return <DashboardHome user={user} tenant={tenant} tenantSlug={tenantSlug} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* OVERLAY PARA MÓVIL */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <TenantSidebar
        user={user}
        tenant={tenant}
        tenantSlug={tenantSlug}
        activeView={activeView}
        onNavigate={handleNavigate}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="px-4 md:px-8 py-4 flex justify-between items-center">
            {/* Botón hamburguesa en móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Main Property •</h2>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tenant.nombre}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              <div className="hidden md:flex items-center gap-3">
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 dark:from-primary-500 dark:to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.nombres?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.nombres} {user.apellidos}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TenantDashboard
