/** TenantDashboard: Dashboard principal para usuarios logueados en un tenant
 * Ruta: /:tenantSlug/app (protegida por TenantGuard)
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import { useRefresh } from '../context/RefreshContext'
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
import RecepcionVehiculoView from './dashboard/RecepcionVehiculoView'
import GestionPresupuestosView from './dashboard/GestionPresupuestosView'
import GestionOrdenesTrabajoView from './dashboard/GestionOrdenesTrabajoView'
import GestionTallerInternoView from './dashboard/GestionTallerInternoView'
import GestionAvanceVehiculoView from './dashboard/GestionAvanceVehiculoView'
import GestionInventarioView from './dashboard/GestionInventarioView'
import GestionSolicitudesRepuestoView from './dashboard/GestionSolicitudesRepuestoView'
import GestionBackupView from './dashboard/GestionBackupView'
import AsistenteIAView from './dashboard/AsistenteIAView'
import { ReportesDinamicosView } from './dashboard/ReportesDinamicosView'
import { FloatingAIAvatar } from '../components/FloatingAIAvatar'
import ChatAssistant from '../components/assistant/ChatAssistant'

export const TenantDashboard = () => {
  const { tenantSlug } = useParams()
  const { user, tenant, refreshUser } = useTenant()
  const { refreshTick, triggerRefresh } = useRefresh()
  const navigate = useNavigate()

  // Estado de la vista activa - por defecto muestra "dashboard"
  const [activeView, setActiveView] = useState('dashboard')
  // Estado del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Estado del asistente IA flotante
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  // Estado para la acción propuesta por la IA (para pre-llenado visual)
  const [pendingAction, setPendingAction] = useState(null)

  // EFECTO: Refrescar datos cuando cambia el refreshTick
  useEffect(() => {
    if (refreshTick > 0) {
      console.log("Detectado cambio en refreshTick:", refreshTick);
      refreshUser(); // <--- LLAMADA CLAVE PARA EL WOW DE SINCRONIZACIÓN
    }
  }, [refreshTick, refreshUser])

  // Función para refrescar datos globales del usuario sin recargar
  const refreshUserData = async () => {
    setPendingAction(null); // Limpiar acción pendiente tras éxito
    triggerRefresh();
  }

  // Redireccionar si no hay usuario o tenant
  if (!user || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-carbon-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-carbon-600 dark:text-neutral-400 font-medium tracking-wide">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await authService.logoutTenant(tenantSlug)
    navigate(`/${tenantSlug}/login`)
  }

  const handleNavigate = (viewId) => {
    setActiveView(viewId)
  }

  // Renderizar la vista activa
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome user={user} tenant={tenant} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      case 'editarPerfil':
        return (
          <PerfilUsuarioView
            user={user}
            tenant={tenant}
            tenantSlug={tenantSlug}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && (
              pendingAction?.accion === 'CAMBIAR_USUARIO' ||
              pendingAction?.accion === 'CAMBIAR_TELEFONO' ||
              pendingAction?.accion === 'CAMBIAR_CONTRASENA' ||
              pendingAction?.accion === 'ACTUALIZAR_PREFERENCIAS'
            ) ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'gestionEmpresa':
        return (
          <GestionEmpresaView
            user={user}
            tenant={tenant}
            tenantSlug={tenantSlug}
            onNavigate={handleNavigate}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && pendingAction?.accion === 'CAMBIAR_NOMBRE_EMPRESA' ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'gestionUsuariosRoles':
        return <GestionUsuariosRolesView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'gestionSuscripciones':
        return (
          <GestionSuscripcionView
            user={user}
            tenant={tenant}
            tenantSlug={tenantSlug}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && (pendingAction?.accion === 'COMPRAR_PLAN' || pendingAction?.accion === 'RELLENAR_PAGO' || pendingAction?.accion === 'CANCELAR_CAMBIO') ? { ...pendingAction.parametros, _ts: pendingAction._ts, accion: pendingAction.accion, estado: pendingAction.estado } : null}
          />
        )
      case 'notificaciones':
        return <NotificacionesView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'bitacora':
        return (
          <BitacoraView 
            tenantSlug={tenantSlug} 
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && ['FILTRAR_BITACORA', 'EXPORTAR_BITACORA'].includes(pendingAction?.accion) ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'gestionVehiculos':
        return (
          <GestionVehiculosView
            user={user}
            tenantSlug={tenantSlug}
            onNavigate={handleNavigate}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && (pendingAction?.accion === 'BUSCAR_VEHICULO' || pendingAction?.accion === 'REGISTRAR_VEHICULO') ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'catalogoServicios':
        return (
          <CatalogoServiciosView 
            user={user} 
            tenantSlug={tenantSlug} 
            onNavigate={handleNavigate}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && pendingAction?.accion === 'AGREGAR_SERVICIO' ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'espaciosTrabajo':
        return (
          <EspaciosTrabajoView 
            user={user} 
            tenantSlug={tenantSlug} 
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && ['REGISTRAR_ESPACIO', 'EDITAR_ESPACIO', 'VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO'].includes(pendingAction?.accion) ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'horarios':
        return (
          <HorariosGeneralesView 
            user={user} 
            tenantSlug={tenantSlug}
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && ['VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO'].includes(pendingAction?.accion) ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'planVehiculo':
        return (
          <PlanVehiculoView 
            user={user} 
            tenantSlug={tenantSlug} 
            onSuccess={refreshUserData}
            aiPrefill={(['PENDIENTE', 'EJECUTADA'].includes(pendingAction?.estado)) && ['BUSCAR_PLAN', 'VER_PLAN', 'EDITAR_PLAN', 'CAMBIAR_ESTADO_PLAN', 'AGREGAR_DETALLE_PLAN'].includes(pendingAction?.accion) ? { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts } : null}
          />
        )
      case 'citas':
        return <GestionCitasView user={user} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
      case 'recepcionVehiculo':
        return <RecepcionVehiculoView tenantSlug={tenantSlug} />
      case 'presupuestos':
        return <GestionPresupuestosView tenantSlug={tenantSlug} user={user} />
      case 'ordenesTrabajo':
        return <GestionOrdenesTrabajoView tenantSlug={tenantSlug} user={user} />
      case 'tallerInterno':
        return <GestionTallerInternoView tenantSlug={tenantSlug} user={user} />
      case 'avanceVehiculo':
        return <GestionAvanceVehiculoView tenantSlug={tenantSlug} user={user} />
      case 'inventario':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="inventario" />
      case 'solicitudesRepuesto':
        return <GestionSolicitudesRepuestoView tenantSlug={tenantSlug} user={user} />
      case 'proveedores':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="proveedores" />
      case 'comprasInsumos':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="comprasInsumos" />
      case 'ventasMostrador':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="ventasMostrador" />
      case 'pagosTaller':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="pagosTaller" />
      case 'facturasRecibos':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="facturasRecibos" />
      case 'cajaMovimientos':
        return <GestionInventarioView tenantSlug={tenantSlug} user={user} initialSection="cajaMovimientos" />
      case 'gestionarBackup':
        return <GestionBackupView />
      case 'asistenteIA':
        return <AsistenteIAView />
      case 'generarReportes':
        return <ReportesDinamicosView tenantSlug={tenantSlug} />
      default:
        return <DashboardHome user={user} tenant={tenant} tenantSlug={tenantSlug} onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-carbon-950 flex flex-col md:flex-row transition-colors duration-300">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

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

      <div className="flex-1 flex flex-col md:ml-64">
        <header className="sticky top-0 z-40 bg-white dark:bg-carbon-900 shadow-sm border-b border-neutral-200 dark:border-white/[0.06] transition-colors duration-300">
          <div className="px-4 md:px-8 py-4 flex justify-between items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-carbon-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 tracking-wide uppercase">Main Property •</h2>
              <h1 className="text-xl font-bold text-carbon-900 dark:text-white tracking-tight">{tenant.nombre}</h1>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-3">
                <div className="h-10 w-px bg-neutral-200 dark:bg-white/[0.06]"></div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-burgundy-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary-900/20">
                  {user.nombres.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-carbon-900 dark:text-white">
                    {user.nombres} {user.apellidos}
                  </p>
                  <p className="text-xs text-carbon-500 dark:text-neutral-400">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 relative">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      <FloatingAIAvatar onClick={() => setIsAssistantOpen(!isAssistantOpen)} />

      <ChatAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigate={handleNavigate}
        onActionProposed={(action) => {
          console.log("TenantDashboard recibió acción:", action.accion);
          setPendingAction(action);
        }}
        onActionSuccess={refreshUserData}
        tenantSlug={tenantSlug}
      />
    </div>
  )
}

export default TenantDashboard
