/**
 * API Client: Instancia de Axios configurada para multi-tenant.
 * IMPORTANTE SOBRE TOKENS:
 * - Endpoints PÚBLICOS (sin token): /api/tenants/resolve/, /api/empresas/, /api/planes/
 * - Endpoints TENANT (con token tenant): /:tenantSlug/... usan token del tenant
 * - Endpoints ADMIN (con token admin): /admin/... (si existe)
 * El interceptor añade token automático, excepto para rutas públicas.
 */
import axios from 'axios'
import tokenStorage from './tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Crear instancia sin interceptor para requests públicas
const publicApiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Crear instancia CON interceptor para requests con token
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Rutas públicas que NUNCA enviamos token
const PUBLIC_ENDPOINTS = [
  '/api/tenants/resolve/',
  '/api/planes/',
  '/api/auth/admin/login/', // si existe
]

const isPublicEndpoint = (url) => {
  // /api/empresas/ solo es público para GET (list), no para mi_empresa que requiere auth
  if (url.includes('/api/empresas/mi_empresa/')) {
    return false // Requiere autenticación
  }
  
  // /api/empresas/ (sin path adicional) es público 
  if (url === '/api/empresas/' && !url.includes('/api/empresas/mi_empresa/')) {
    return true
  }
  
  return PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint))
}

// Interceptor para agregar token SOLO en endpoints privados
apiClient.interceptors.request.use((config) => {
  // Si es endpoint público, no agregar token
  if (isPublicEndpoint(config.url)) {
    return config
  }

  // Detectar si es una ruta tenant
  const tenantMatch = window.location.pathname.match(/^\/([a-z0-9-]+)\//) 
  const detectedTenantSlug = tenantMatch ? tenantMatch[1] : null

  // Prioridad:
  // 1. Si es ruta tenant y existe token tenant, usar token tenant
  if (detectedTenantSlug) {
    const tenantToken = tokenStorage.getTenantToken(detectedTenantSlug)
    if (tenantToken) {
      config.headers.Authorization = `Bearer ${tenantToken}`
      return config
    }
  }

  // 2. Si existe token admin, usar token admin
  const adminToken = tokenStorage.getAdminToken()
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
    return config
  }

  // 3. Sin token (no debería llegar aquí si es endpoint privado)
  return config
})

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      const tenantMatch = window.location.pathname.match(/^\/([a-z0-9-]+)\//)
      const detectedTenantSlug = tenantMatch ? tenantMatch[1] : null

      if (detectedTenantSlug) {
        // Logout del tenant
        tokenStorage.logoutTenant(detectedTenantSlug)
        window.location.href = `/${detectedTenantSlug}/login`
      } else {
        // Logout admin
        tokenStorage.logoutAdmin()
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// También añadir el mismo manejador a publicApiClient (por si acaso)
publicApiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export { apiClient, publicApiClient }
export default apiClient
