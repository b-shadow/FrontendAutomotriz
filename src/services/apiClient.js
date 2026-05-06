/**
 * API Client: Instancia de Axios configurada para multi-tenant.
 * IMPORTANTE SOBRE TOKENS:
 * - Endpoints PUBLICOS (sin token): /api/tenants/resolve/, /api/empresas/, /api/planes/
 * - Endpoints TENANT (con token tenant): /:tenantSlug/... usan token del tenant
 * - Endpoints ADMIN (con token admin) : /admin/... ? (si existe)
 * El interceptor anade token automatico, excepto para rutas publicas.
 */
import axios from 'axios'
import tokenStorage from './tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Crear instancia sin interceptor para requests publicas
const publicApiClient = axios.create({
  baseURL: API_BASE, headers : {
    'Content-Type': 'application/json',
  },
})

// Crear instancia CON interceptor para requests con token
const apiClient = axios.create({
  baseURL: API_BASE, headers : {
    'Content-Type': 'application/json',
  },
})

// Rutas publicas que NUNCA enviamos token
const PUBLIC_ENDPOINTS = [
  '/api/tenants/resolve/',
  '/api/planes/',
  '/api/auth/admin/login/',
]

const isPublicEndpoint = (url) => {
  if (!url) return false

  // /api/empresas/mi_empresa/ requiere autenticacion
  if (url.includes('/api/empresas/mi_empresa/')) {
    return false
  }

  // /api/empresas/ (sin path adicional) es publico
  if (url === '/api/empresas/' && !url.includes('/api/empresas/mi_empresa/')) {
    return true
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => url.startsWith(endpoint))
}

const MODULE_PREFIXES = new Set([
  'administracion',
  'vehiculos-servicios',
  'atencion-tecnica',
  'gestion-administrativa',
  'comunicacion-control',
])

const LEGACY_MODULE_MAP = {
  usuarios: 'administracion', suscripciones : 'administracion',
  auditoria: 'administracion', vehiculos : 'vehiculos-servicios',
  servicios: 'vehiculos-servicios', espacios : 'vehiculos-servicios',
  'planes-vehiculo': 'vehiculos-servicios', citas : 'vehiculos-servicios',
  'recepciones-vehiculo': 'atencion-tecnica',
}

const remapLegacyTenantUrl = (url) => {
  if (!url || !url.startsWith('/api/')) return url
  if (url.startsWith('/api/tenants/')) return url

  // /api/{empresa_slug}/{recurso}/...
  const match = url.match(/^\/api\/([^/]+)\/([^/#]+)(.*)$/)
  if (!match) return url

  const [, tenantSlug, secondSegment, rest] = match

  // Ya usa prefijo modular
  if (MODULE_PREFIXES.has(secondSegment)) return url

  // Legacy endpoint -> convertir a endpoint modular
  const modulePrefix = LEGACY_MODULE_MAP[secondSegment]
  if (modulePrefix) {
    return `/api/${tenantSlug}/${modulePrefix}/${secondSegment}${rest}`
  }

  return url
}

const hasMojibake = (value) => (
  typeof value === 'string' &&
  (value.includes('Ã') || value.includes('Â') || value.includes('â'))
)

const fixMojibakeString = (value) => {
  if (!hasMojibake(value)) return value
  try {
    return decodeURIComponent(escape(value))
  } catch {
    return value
  }
}

const normalizeResponseData = (value) => {
  if (typeof value === 'string') {
    return fixMojibakeString(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeResponseData(item))
  }
  if (value && typeof value === 'object') {
    const normalized = {}
    Object.keys(value).forEach((key) => {
      normalized[key] = normalizeResponseData(value[key])
    })
    return normalized
  }
  return value
}

// Interceptor para agregar token SOLO en endpoints privados
apiClient.interceptors.request.use((config) => {
  config.url = remapLegacyTenantUrl(config.url)

  // Si es endpoint publico, no agregar token
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

  // 3. Sin token
  return config
})

// Interceptor para manejar errores de autenticacion
apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeResponseData(response.data)
    return response
  },
  (error) => {
    if (error.response.status === 401) {
      const tenantMatch = window.location.pathname.match(/^\/([a-z0-9-]+)\//)
      const detectedTenantSlug = tenantMatch ? tenantMatch[1] : null

      if (detectedTenantSlug) {
        tokenStorage.logoutTenant(detectedTenantSlug)
        window.location.href = `/${detectedTenantSlug}/login`
      } else {
        tokenStorage.logoutAdmin()
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

publicApiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeResponseData(response.data)
    return response
  },
  (error) => Promise.reject(error)
)

export { apiClient, publicApiClient }
export default apiClient
