/**
 * TenantGuard: Protege rutas que requieren autenticación en el tenant.
 */
import { Navigate } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'

export const TenantGuard = ({ children }) => {
  const { tenantSlug, isLoggedIn, user } = useTenant()

  // Si no hay sesión de usuario, redirigir a login
  if (!user || !isLoggedIn) {
    return <Navigate to={`/${tenantSlug}/login`} replace />
  }

  return children
}

export default TenantGuard
