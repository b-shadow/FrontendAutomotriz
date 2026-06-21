/**
 * Token Storage: Gestor de tokens y sesiones.
 * Almacenamiento por tipo:
 * - ADMIN: token:admin, refresh_token:admin, admin_user
 * - TENANT: token:${slug}, refresh_token:${slug}, user:${slug}, tenant:${slug}
 */

export const tokenStorage = {
  // ===== ADMIN TOKEN =====
  setAdminToken(token) {
    if (token) {
      localStorage.setItem('token:admin', token)
    } else {
      localStorage.removeItem('token:admin')
    }
  },

  getAdminToken() {
    return localStorage.getItem('token:admin')
  },

  clearAdminToken() {
    localStorage.removeItem('token:admin')
  },

  isAdminLoggedIn() {
    return !!this.getAdminToken()
  },

  // ===== ADMIN REFRESH TOKEN =====
  setAdminRefreshToken(token) {
    if (token) {
      localStorage.setItem('refresh_token:admin', token)
    } else {
      localStorage.removeItem('refresh_token:admin')
    }
  },

  getAdminRefreshToken() {
    return localStorage.getItem('refresh_token:admin')
  },

  // ===== ADMIN USER DATA =====
  setAdminUser(user) {
    if (user) {
      localStorage.setItem('admin_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('admin_user')
    }
  },

  getAdminUser() {
    const user = localStorage.getItem('admin_user')
    return user ? JSON.parse(user) : null
  },

  // ===== CLEAR ADMIN SESSION =====
  logoutAdmin() {
    this.clearAdminToken()
    this.setAdminRefreshToken(null)
    this.setAdminUser(null)
  },

  // ===== TENANT TOKEN =====
  setTenantToken(tenantSlug, token) {
    if (token) {
      localStorage.setItem(`token:${tenantSlug}`, token)
    } else {
      localStorage.removeItem(`token:${tenantSlug}`)
    }
  },

  getTenantToken(tenantSlug) {
    return localStorage.getItem(`token:${tenantSlug}`)
  },

  // ===== TENANT REFRESH TOKEN =====
  setTenantRefreshToken(tenantSlug, token) {
    if (token) {
      localStorage.setItem(`refresh_token:${tenantSlug}`, token)
    } else {
      localStorage.removeItem(`refresh_token:${tenantSlug}`)
    }
  },

  getTenantRefreshToken(tenantSlug) {
    return localStorage.getItem(`refresh_token:${tenantSlug}`)
  },

  // ===== TENANT USER DATA =====
  setTenantUser(tenantSlug, user) {
    if (user) {
      localStorage.setItem(`user:${tenantSlug}`, JSON.stringify(user))
    } else {
      localStorage.removeItem(`user:${tenantSlug}`)
    }
  },

  getTenantUser(tenantSlug) {
    const user = localStorage.getItem(`user:${tenantSlug}`)
    return user ? JSON.parse(user) : null
  },

  // ===== TENANT METADATA =====
  setTenant(tenantSlug, tenant) {
    if (tenant) {
      localStorage.setItem(`tenant:${tenantSlug}`, JSON.stringify(tenant))
    } else {
      localStorage.removeItem(`tenant:${tenantSlug}`)
    }
  },

  getTenant(tenantSlug) {
    const tenant = localStorage.getItem(`tenant:${tenantSlug}`)
    return tenant ? JSON.parse(tenant) : null
  },

  setTenantPushToken(tenantSlug, token) {
    if (token) {
      localStorage.setItem(`push_token:${tenantSlug}`, token)
    } else {
      localStorage.removeItem(`push_token:${tenantSlug}`)
    }
  },

  getTenantPushToken(tenantSlug) {
    return localStorage.getItem(`push_token:${tenantSlug}`)
  },

  setTenantPushPromptPending(tenantSlug, pending) {
    if (pending) {
      localStorage.setItem(`push_prompt_pending:${tenantSlug}`, '1')
    } else {
      localStorage.removeItem(`push_prompt_pending:${tenantSlug}`)
    }
  },

  getTenantPushPromptPending(tenantSlug) {
    return localStorage.getItem(`push_prompt_pending:${tenantSlug}`) === '1'
  },

  // ===== CLEAR TENANT SESSION =====
  logoutTenant(tenantSlug) {
    this.setTenantToken(tenantSlug, null)
    this.setTenantRefreshToken(tenantSlug, null)
    this.setTenantUser(tenantSlug, null)
    this.setTenant(tenantSlug, null)
    this.setTenantPushPromptPending(tenantSlug, false)
  },

  // ===== CHECK SESSION =====
  isTenantLoggedIn(tenantSlug) {
    return !!this.getTenantToken(tenantSlug)
  },

  // ===== LIMPIAR SOLO ADMIN (cuando se cierra sesión admin) =====
  clearAdminSession() {
    this.logoutAdmin()
  },

  // ===== LIMPIAR TODO (usar con cuidado) =====
  clearAll() {
    localStorage.clear()
  },
}

export default tokenStorage
