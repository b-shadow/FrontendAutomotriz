export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.'

export const validateStrongPassword = (password) => {
  if (!password || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos 1 letra mayúscula'
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos 1 letra minúscula'
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos 1 número'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos 1 símbolo'
  }
  return null
}
