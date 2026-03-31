/**
 * Hook useTenant: Acceso del contexto del tenant actual
 */
import { useContext } from 'react'
import { TenantContext } from '../context/TenantContext'

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider')
  }
  return context
}

export default useTenant
