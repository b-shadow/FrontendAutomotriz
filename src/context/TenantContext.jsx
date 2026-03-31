/**
 * TenantContext: Provee info del tenant actual y usuario autenticado.
 */
import { createContext, useState, useCallback } from 'react'
import tokenStorage from '../services/tokenStorage'
// Crear contexto (no se exporta directamente)
const TenantContext = createContext(null)
// Proveedor del contexto
function TenantProvider({ children, tenant, tenantSlug }) {
  // Inicializar usuario desde storage
  const [user, setUser] = useState(() => {
    return tokenStorage.getTenantUser(tenantSlug) || null
  })
  // Logout limpia solo este tenant
  const logout = useCallback(() => {
    tokenStorage.logoutTenant(tenantSlug)
    setUser(null)
  }, [tenantSlug])
  // Actualizar usuario
  const setSessionUser = useCallback((newUser) => {
    setUser(newUser)
    if (newUser) {
      tokenStorage.setTenantUser(tenantSlug, newUser)
    }
  }, [tenantSlug])
  const value = {
    tenant,           // Objeto empresa { id, nombre, slug, estado }
    tenantSlug,       // Slug de la URL
    user,             // Usuario autenticado en este tenant
    setUser: setSessionUser, // Actualizar usuario
    logout,           // Logout del tenant
    isLoggedIn: !!user, // Verificar si hay sesión activa
  }
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
// Exportar el contexto y proveedor
export { TenantContext, TenantProvider }
export default TenantProvider
