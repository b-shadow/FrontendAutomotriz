/**
 * roleHelper.js - Utilidades para control de acceso según rol del usuario tenant.
 *
 * Proporciona funciones para determinar si un usuario tiene permisos para ver/usar
 * ciertas opciones del dashboard según su rol.
 *
 * ROLES DEL SISTEMA:
 * - ADMIN: Administrador del tenant
 * - USUARIO: Cliente/Usuario regular
 * - ASESOR DE SERVICIO: Asesor técnico
 * - MECÁNICO: Mecánico (sin acceso a ciertos módulos)
 * - ADMINISTRATIVO: Personal administrativo
 * - ALMACENERO: Personal de almacén
 */

/**
 * Obtiene el nombre del rol de forma normalizada.
 * Soporta rol como string o como objeto {nombre: "..."}
 * @param {Object} user - Objeto del usuario
 * @returns {string} - Nombre del rol en mayúsculas
 */
const getRolNameNormalized = (user) => {
  if (!user || !user.rol) return ''

  const rolName =
    typeof user.rol === 'string'
      ? user.rol // Si es string directo
      : user.rol.nombre // Si es objeto con propiedad nombre
  
  return (rolName || '').toUpperCase().trim()
}

/**
 * Verifica si un usuario es administrador del tenant.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isAdminTenant = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'ADMIN'
}

/**
 * Verifica si un usuario es cliente/usuario regular.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isUsuarioCliente = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'USUARIO'
}

/**
 * Verifica si un usuario es asesor de servicio.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isAsesorServicio = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'ASESOR DE SERVICIO'
}

/**
 * Verifica si un usuario es mecánico.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isMecanico = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'MECÁNICO'
}

/**
 * Verifica si un usuario es administrativo.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isAdministrativo = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'ADMINISTRATIVO'
}

/**
 * Verifica si un usuario es almacenero.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const isAlmacenero = (user) => {
  if (!user || !user.rol) return false

  const rolName = getRolNameNormalized(user)
  return rolName === 'ALMACENERO'
}

/**
 * Verifica si un usuario puede ver el módulo de gestión de vehículos.
 * Visible para: ADMIN, ASESOR DE SERVICIO, USUARIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewVehiculos = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user)
  )
}

/**
 * Verifica si un usuario puede crear vehículos.
 * ADMIN, ASESOR DE SERVICIO, USUARIO: todos pueden crear
 * Pero con restricciones: cliente solo para sí mismo, otros para cualquiera
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCreateVehiculos = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user) || isUsuarioCliente(user)
}

/**
 * Verifica si un usuario puede editar vehículos.
 * Solo ADMIN, ASESOR DE SERVICIO pueden editar
 * USUARIO NO puede editar vehículos
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditVehiculos = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede seleccionar propietario al crear vehículo.
 * Solo ADMIN y ASESOR DE SERVICIO pueden seleccionar propietario.
 * USUARIO solo puede crear con propietario = a sí mismo.
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canSelectPropietarioVehiculo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario es propietario de un vehículo.
 * @param {Object} user - Objeto del usuario
 * @param {Object} vehiculo - Objeto del vehículo
 * @returns {boolean}
 */
export const isVehiculoOwner = (user, vehiculo) => {
  if (!user || !vehiculo) return false

  const propietarioId = typeof vehiculo.propietario === 'object' 
    ? vehiculo.propietario.id 
    : vehiculo.propietario
  
  return user.id === propietarioId
}

/**
 * Verifica si un usuario puede cambiar estado de vehículos.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangeVehiculoStatus = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si una opción debe ser visible según el rol del usuario.
 * @param {Object} user - Objeto del usuario
 * @param {string} optionKey - Clave de la opción (ej: 'gestionEmpresa')
 * @returns {boolean}
 */
export const canViewOption = (user, optionKey) => {
  if (!user) return false

  // Opciones visibles para TODOS
  const visibleForAll = [
    'dashboard',
    'editarPerfil',
    'notificaciones',
  ]

  // Opciones visibles SOLO PARA ADMINS
  const visibleForAdminOnly = [
    'gestionEmpresa',
    'gestionUsuariosRoles',
    'bitacora',
  ]

  if (visibleForAll.includes(optionKey)) {
    return true
  }

  if (visibleForAdminOnly.includes(optionKey)) {
    return isAdminTenant(user)
  }

  return false
}

/**
 * Retorna el nombre del rol en formato legible.
 * @param {Object} user
 * @returns {string}
 */
export const getRoleName = (user) => {
  if (!user || !user.rol) return 'Usuario'

  if (typeof user.rol === 'string') {
    return user.rol
  }

  return user.rol.nombre || 'Usuario'
}

/**
 * Verifica permisos para ver la bitácora (solo admins).
 * @param {Object} user
 * @returns {boolean}
 */
export const canViewBitacora = (user) => {
  return isAdminTenant(user)
}

/**
 * Verifica permisos para gestionar usuarios (solo admins).
 * @param {Object} user
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  return isAdminTenant(user)
}

/**
 * Verifica permisos para gestionar empresa (solo admins).
 * @param {Object} user
 * @returns {boolean}
 */
export const canManageCompany = (user) => {
  return isAdminTenant(user)
}

/**
 * Verifica permisos para gestionar suscripción (solo admins).
 * @param {Object} user
 * @returns {boolean}
 */
export const canManageSuscription = (user) => {
  return isAdminTenant(user)
}

// ============================================================================
// HELPERS PARA CU15 - GESTIONAR CATÁLOGO DE SERVICIOS
// ============================================================================

/**
 * Verifica si un usuario puede ver el catálogo de servicios.
 * Visible para: ADMIN, ASESOR DE SERVICIO, USUARIO, MECÁNICO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewServiciosCatalogo = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user) ||
    isMecanico(user)
  )
}

/**
 * Verifica si un usuario puede crear servicios en el catálogo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCreateServiciosCatalogo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede editar servicios en el catálogo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditServiciosCatalogo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cambiar el estado (activo/inactivo) de un servicio.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangeServicioCatalogoStatus = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * CU16 - Configurar Espacios de Trabajo
 * =====================================
 */

/**
 * Verifica si un usuario puede ver/consultar espacios de trabajo.
 * Visible para: TODOS los roles autenticados (porque se usan en otros flujos)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewEspaciosTrabajo = (user) => {
  if (!user) return false
  // Todos los roles autenticados pueden ver espacios
  return true
}

/**
 * Verifica si un usuario puede gestionar espacios de trabajo (crear, editar, cambiar estado, etc).
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canManageEspaciosTrabajo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede crear espacios de trabajo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCreateEspaciosTrabajo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede editar espacios de trabajo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditEspaciosTrabajo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cambiar el estado de un espacio de trabajo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangeEspacioTrabajoEstado = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cambiar el estado activo/inactivo de un espacio de trabajo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangeEspacioTrabajoActivo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede gestionar horarios de espacios de trabajo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canManageHorariosEspacio = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede ver/consultar horarios de espacios de trabajo.
 * Visible para: TODOS los roles autenticados
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewEspacioTrabajoHorarios = (user) => {
  if (!user) return false
  // Todos los roles autenticados pueden ver horarios
  return true
}

// ============================================================================
// HELPERS PARA CU22 - GESTIONAR PLAN DE VEHÍCULO
// ============================================================================

/**
 * Verifica si un usuario puede ver el módulo de Plan de Vehículo.
 * Visible para: ADMIN, ASESOR DE SERVICIO, USUARIO, MECÁNICO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewPlanVehiculo = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user) ||
    isMecanico(user)
  )
}

/**
 * Verifica si un usuario puede crear planes de vehículos.
 * Permite: ADMIN, ASESOR DE SERVICIO, USUARIO (en sus propios vehículos)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCreatePlanVehiculo = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user)
  )
}

/**
 * Verifica si un usuario puede editar planes de vehículos.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditPlanVehiculo = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cambiar el estado de un plan de vehículo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangePlanVehiculoStatus = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede agregar detalles a un plan de vehículo.
 * Permite: ADMIN, ASESOR DE SERVICIO, USUARIO, MECÁNICO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canAddPlanVehiculoDetalle = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user) ||
    isMecanico(user)
  )
}

/**
 * Verifica si un usuario puede editar detalles de un plan de vehículo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditPlanVehiculoDetalle = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cambiar el estado de un detalle del plan.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canChangePlanVehiculoDetalleStatus = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede eliminar detalles de un plan de vehículo.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canDeletePlanVehiculoDetalle = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

// ============================================================================
// HELPERS PARA CU18 - GESTIONAR CITA
// ============================================================================

/**
 * Verifica si un usuario puede ver el módulo de Gestionar Cita.
 * Visible para: ADMIN, ASESOR DE SERVICIO, USUARIO (sus propias citas)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canViewCitas = (user) => {
  if (!user) return false

  return (
    isAdminTenant(user) ||
    isAsesorServicio(user) ||
    isUsuarioCliente(user)
  )
}

/**
 * Verifica si un usuario puede crear citas.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * (USUARIO no crea citas, son creadas por asesor/admin)
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCreateCita = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede editar citas.
 * Solo: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canEditCita = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede cancelar citas.
 * Permite: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canCancelCita = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}

/**
 * Verifica si un usuario puede reprogramar citas.
 * Permite: ADMIN, ASESOR DE SERVICIO
 * @param {Object} user - Objeto del usuario
 * @returns {boolean}
 */
export const canReprogramarCita = (user) => {
  if (!user) return false

  return isAdminTenant(user) || isAsesorServicio(user)
}
