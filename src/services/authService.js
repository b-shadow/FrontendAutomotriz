/**
 * AuthService: Maneja autenticación global y por tenant.
 */
import apiClient, { publicApiClient } from './apiClient'
import tokenStorage from './tokenStorage'

export const authService = {
  //ADMIN AUTH
  async loginAdmin() {
    return {
      success: false,
      error: 'Login admin no disponible en este flujo. Admin login es via Django admin.',
    }
  },
  logoutAdmin() {
    tokenStorage.logoutAdmin()
  },
  getAdminUser() {
    return tokenStorage.getAdminUser()
  },
  isAdminLoggedIn() {
    return tokenStorage.isAdminLoggedIn()
  },
  // GLOBAL ENDPOINTS (SIN TENANT)
  // Obtener lista de planes
  async getPlanes() {
    try {
      const response = await publicApiClient.get('/api/planes/')
      return {
        success: true,
        planes: response.data.results || response.data,
      }
    } catch {
      return {
        success: false,
        error: 'Error al cargar planes',
        planes: [],
      }
    }
  },
  // Obtener lista de empresas
  async getEmpresas() {
    try {
      const response = await publicApiClient.get('/api/empresas/')
      return {
        success: true,
        empresas: response.data.results || response.data,
      }
    } catch {
      return {
        success: false,
        error: 'Error al cargar empresas',
        empresas: [],
      }
    }
  },
  // Resolver tenant por slug
  async resolveTenant(slug) {
    try {
      const response = await publicApiClient.get('/api/tenants/resolve/', {
        params: { slug },
      })
      return {
        success: true,
        tenant: response.data,
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Empresa no encontrada',
        status: err.response?.status,
      }
    }
  },
  // ===== TENANT AUTH =====
  // Registrar usuario en un tenant específico
  async registerTenant(tenantSlug, email, password, nombres, apellidos = '') {
    try {
      const response = await publicApiClient.post(
        `/api/tenants/${tenantSlug}/auth/register/`,
        { email, password, nombres, apellidos }
      )
      const { usuario, tokens, tenant } = response.data
      // Guardar sesión tenant
      tokenStorage.setTenantToken(tenantSlug, tokens.access)
      tokenStorage.setTenantRefreshToken(tenantSlug, tokens.refresh)
      tokenStorage.setTenantUser(tenantSlug, usuario)
      tokenStorage.setTenant(tenantSlug, tenant)
      return {
        success: true,
        usuario,
        tenant,
        tokens,
      }
    } catch (err) {
      const errorData = err.response?.data || {}
      let errorMsg = 'Error al registrar'
      // Manejar diferentes formatos de error del backend
      if (errorData.email && Array.isArray(errorData.email)) {
        errorMsg = errorData.email[0]
      } else if (errorData.email && typeof errorData.email === 'string') {
        errorMsg = errorData.email
      } else if (errorData.nombres && Array.isArray(errorData.nombres)) {
        errorMsg = errorData.nombres[0]
      } else if (errorData.password && Array.isArray(errorData.password)) {
        errorMsg = errorData.password[0]
      } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        errorMsg = errorData.non_field_errors[0]
      } else if (typeof errorData.error === 'string') {
        errorMsg = errorData.error
      } else if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail
      }
      return {
        success: false,
        error: errorMsg,
      }
    }
  },
  // Login de usuario en un tenant específico
  async loginTenant(tenantSlug, email, password) {
    try {
      const response = await publicApiClient.post(
        `/api/tenants/${tenantSlug}/auth/login/`,
        { email, password }
      )
      const { usuario, tokens, tenant } = response.data
      // Guardar sesión tenant
      tokenStorage.setTenantToken(tenantSlug, tokens.access)
      tokenStorage.setTenantRefreshToken(tenantSlug, tokens.refresh)
      tokenStorage.setTenantUser(tenantSlug, usuario)
      tokenStorage.setTenant(tenantSlug, tenant)
      return {
        success: true,
        usuario,
        tokens,
        tenant,
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Email o contraseña inválidos',
      }
    }
  },

  // Logout de tenant - invalida sesión en backend
  async logoutTenant(tenantSlug) {
    try {
      // Llamar endpoint backend para revocar sesión
      await apiClient.post(`/api/tenants/${tenantSlug}/auth/logout/`)
    } catch (err) {
      console.warn('Error logout backend:', err.message)
    } finally {
      tokenStorage.logoutTenant(tenantSlug)
    }
  },
  // Obtener usuario actual del tenant
  getTenantUser(tenantSlug) {
    return tokenStorage.getTenantUser(tenantSlug)
  },
  // Verificar si está logueado en el tenant
  isTenantLoggedIn(tenantSlug) {
    return tokenStorage.isTenantLoggedIn(tenantSlug)
  },
  // ===== PASSWORD RECOVERY (TENANT) =====
  // Enviar email de recuperación de contraseña
  async forgotPasswordTenant(tenantSlug, email) {
    try {
      await apiClient.post(
        `/api/tenants/${tenantSlug}/auth/forgot-password/`,
        { email }
      )
      return {
        success: true,
        message: 'Email de recuperación enviado',
      }
    } catch {
      return {
        success: false,
        error: 'Error al enviar email de recuperación',
      }
    }
  },
  // ===== REGISTRO DE EMPRESA (GLOBAL) =====
  // Crear pago para registrar empresa (integración Stripe)
  async crearPagoEmpresa(planId, empresaData, usuarioData) {
    try {
      const response = await publicApiClient.post('/api/pagos/crear_pago/', {
        plan_id: planId,
        empresa_nombre: empresaData.nombre,
        empresa_slug: empresaData.slug,
        usuario_nombres: usuarioData.nombres,
        usuario_apellidos: usuarioData.apellidos,
        usuario_email: usuarioData.email,
        usuario_password: usuarioData.password,
      })
      return {
        success: true,
        paymentIntentId: response.data.paymentIntentId,
        paymentIntent: response.data,
      }
    } catch (err) {
      const errorData = err.response?.data || {}
      let errorMsg = 'Error al crear pago'

      if (errorData.error) {
        errorMsg = errorData.error
      }

      return {
        success: false,
        error: errorMsg,
      }
    }
  },

  // Confirmar pago y registrar empresa
  async confirmarPagoEmpresa(paymentIntentId) {
    try {
      const response = await publicApiClient.post('/api/pagos/confirmar_pago/', {
        payment_intent_id: paymentIntentId,
      })
      return {
        success: true,
        empresa: response.data.empresa || response.data,
      }
    } catch (err) {
      const errorData = err.response?.data || {}
      let errorMsg = 'Error al confirmar pago'
      if (errorData.error) {
        errorMsg = errorData.error
      } else if (errorData.detail) {
        errorMsg = errorData.detail
      }
      return {
        success: false,
        error: errorMsg,
      }
    }
  },
  // ===== AUDITORÍA (TENANT) =====

  // Obtener eventos de auditoría/bitácora
  async getAuditoria(tenantSlug, filtros = {}) {
    try {
      const params = new URLSearchParams()
      if (filtros.accion) params.append('accion', filtros.accion)
      if (filtros.usuario) params.append('usuario', filtros.usuario)
      if (filtros.search) params.append('search', filtros.search)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      const response = await apiClient.get(
        `/api/${tenantSlug}/auditoria/`,
        { params }
      )
      return {
        success: true,
        eventos: response.data.results || response.data,
        total: response.data.count || (Array.isArray(response.data) ? response.data.length : 0),
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Error al cargar auditoría',
        eventos: [],
        total: 0,
      }
    }
  },

  // Obtener resumen de auditoría
  async getAuditoriaResumen(tenantSlug) {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/auditoria/resumen/`
      )
      return {
        success: true,
        resumen: response.data,
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Error al cargar resumen',
        resumen: null,
      }
    }
  },
}

export default authService
