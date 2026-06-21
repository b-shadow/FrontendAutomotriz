/** TenantDashboard: Dashboard principal para usuarios logueados en un tenant
 * Ruta: /:tenantSlug/app (protegida por TenantGuard)
 */
import { Bell, BellOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import { useRefresh } from '../context/RefreshContext'
import authService from '../services/authService'
import firebaseMessagingService from '../services/firebaseMessagingService'
import tokenStorage from '../services/tokenStorage'
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
import InventarioView from './dashboard/InventarioView'
import ProveedoresView from './dashboard/ProveedoresView'
import ComprasInsumosView from './dashboard/ComprasInsumosView'
import VentasMostradorView from './dashboard/VentasMostradorView'
import FacturasRecibosView from './dashboard/FacturasRecibosView'
import CajaMovimientosView from './dashboard/CajaMovimientosView'
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
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [pushPromptLoading, setPushPromptLoading] = useState(false)
  const [pushPromptMessage, setPushPromptMessage] = useState('')

  // EFECTO: Refrescar datos cuando cambia el refreshTick
  useEffect(() => {
    if (refreshTick > 0) {
      console.log("Detectado cambio en refreshTick:", refreshTick);
      refreshUser(); // <--- LLAMADA CLAVE PARA EL WOW DE SINCRONIZACIÓN
    }
  }, [refreshTick, refreshUser])

  useEffect(() => {
    if (!tenantSlug || typeof window === 'undefined') {
      return
    }

    const permission = firebaseMessagingService.getPermissionStatus()
    const pendingPrompt = tokenStorage.getTenantPushPromptPending(tenantSlug)
    const hasPushToken = !!tokenStorage.getTenantPushToken(tenantSlug)

    if ((permission === 'default' || permission === 'denied') && (pendingPrompt || !hasPushToken)) {
      setShowPushPrompt(true)
      return
    }

    setShowPushPrompt(false)
  }, [tenantSlug, user?.id])

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

  // Helper para inyectar Ghost UI data a la vista activa de forma universal
  const getAiPrefill = (validActions) => {
    if (!pendingAction || !['PENDIENTE', 'EJECUTADA'].includes(pendingAction.estado)) return null;
    if (validActions.includes(pendingAction.accion)) {
      return { ...pendingAction.parametros, type: pendingAction.accion, status: pendingAction.estado, _ts: pendingAction._ts };
    }
    return null;
  };

  const handleEnablePushNotifications = async () => {
    setPushPromptLoading(true)
    setPushPromptMessage('')

    try {
      await firebaseMessagingService.requestPermissionAndRegisterToken(tenantSlug)
      tokenStorage.setTenantPushPromptPending(tenantSlug, false)
      setShowPushPrompt(false)
    } catch (error) {
      tokenStorage.setTenantPushPromptPending(tenantSlug, true)
      setPushPromptMessage(error?.message || 'No se pudo activar las notificaciones push.')
    } finally {
      setPushPromptLoading(false)
    }
  }

  const handleDismissPushPrompt = () => {
    tokenStorage.setTenantPushPromptPending(tenantSlug, false)
    setShowPushPrompt(false)
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
            aiPrefill={getAiPrefill(['CAMBIAR_NOMBRES_PERSONALES', 'CAMBIAR_TELEFONO', 'CAMBIAR_CONTRASENA', 'ACTUALIZAR_PREFERENCIAS'])}
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
            aiPrefill={getAiPrefill(['CAMBIAR_NOMBRE_EMPRESA'])}
          />
        )
      case 'gestionUsuariosRoles':
        return <GestionUsuariosRolesView user={user} tenant={tenant} tenantSlug={tenantSlug} aiPrefill={getAiPrefill(['CREAR_USUARIO', 'CAMBIAR_ROL_USUARIO'])} />
      case 'gestionSuscripciones':
        return (
          <GestionSuscripcionView
            user={user}
            tenant={tenant}
            tenantSlug={tenantSlug}
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['COMPRAR_PLAN', 'RELLENAR_PAGO', 'CANCELAR_CAMBIO'])}
          />
        )
      case 'notificaciones':
        return <NotificacionesView user={user} tenant={tenant} tenantSlug={tenantSlug} />
      case 'bitacora':
        return (
          <BitacoraView 
            tenantSlug={tenantSlug} 
            aiPrefill={getAiPrefill(['FILTRAR_BITACORA', 'EXPORTAR_BITACORA', 'EXPORTAR_REPORTE'])}
          />
        )
      case 'gestionVehiculos':
        return (
          <GestionVehiculosView
            user={user}
            tenantSlug={tenantSlug}
            onNavigate={handleNavigate}
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['BUSCAR_VEHICULO', 'REGISTRAR_VEHICULO'])}
          />
        )
      case 'catalogoServicios':
        return (
          <CatalogoServiciosView 
            user={user} 
            tenantSlug={tenantSlug} 
            onNavigate={handleNavigate}
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['AGREGAR_SERVICIO'])}
          />
        )
      case 'espaciosTrabajo':
        return (
          <EspaciosTrabajoView 
            user={user} 
            tenantSlug={tenantSlug} 
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['REGISTRAR_ESPACIO', 'EDITAR_ESPACIO', 'VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO'])}
          />
        )
      case 'horarios':
        return (
          <HorariosGeneralesView 
            user={user} 
            tenantSlug={tenantSlug}
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO'])}
          />
        )
      case 'planVehiculo':
        return (
          <PlanVehiculoView 
            user={user} 
            tenantSlug={tenantSlug} 
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['BUSCAR_PLAN_VEHICULO', 'VER_PLAN_VEHICULO', 'EDITAR_PLAN_VEHICULO', 'CAMBIAR_ESTADO_PLAN_VEHICULO', 'AGREGAR_DETALLE_PLAN_VEHICULO'])}
          />
        )
      case 'citas':
        return (
          <GestionCitasView 
            user={user} 
            tenantSlug={tenantSlug} 
            onNavigate={handleNavigate} 
            onSuccess={refreshUserData}
            aiPrefill={getAiPrefill(['FILTRAR_CITAS', 'CREAR_CITA'])}
          />
        )
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
        return <InventarioView tenantSlug={tenantSlug} user={user} aiPrefill={getAiPrefill(['CREAR_CATEGORIA_INVENTARIO', 'CREAR_ITEM_INVENTARIO'])} />
      case 'solicitudesRepuesto':
        return <GestionSolicitudesRepuestoView tenantSlug={tenantSlug} user={user} />
      case 'proveedores':
        return <ProveedoresView tenantSlug={tenantSlug} user={user} aiPrefill={getAiPrefill(['CREAR_PROVEEDOR'])} />
      case 'comprasInsumos':
        return <ComprasInsumosView tenantSlug={tenantSlug} user={user} aiPrefill={getAiPrefill(['AGREGAR_ITEM_COMPRA'])} />
      case 'ventasMostrador':
        return <VentasMostradorView tenantSlug={tenantSlug} user={user} />
      case 'pagosTaller':
        return <VentasMostradorView tenantSlug={tenantSlug} user={user} />
      case 'facturasRecibos':
        return <FacturasRecibosView tenantSlug={tenantSlug} user={user} />
      case 'cajaMovimientos':
        return <CajaMovimientosView tenantSlug={tenantSlug} user={user} />
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
            {showPushPrompt && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      <Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Activa las notificaciones del navegador
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/90">
                      Necesitamos registrar este dispositivo para recibir push. Si el navegador las bloqueó, habilítalas en los permisos del sitio y vuelve a intentarlo.
                    </p>
                    {pushPromptMessage && (
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <BellOff className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {pushPromptMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleEnablePushNotifications}
                      disabled={pushPromptLoading}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pushPromptLoading ? 'Activando...' : 'Activar notificaciones'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissPushPrompt}
                      className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/30 dark:text-amber-200 dark:hover:bg-amber-500/10"
                    >
                      Ahora no
                    </button>
                  </div>
                </div>
              </div>
            )}
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
