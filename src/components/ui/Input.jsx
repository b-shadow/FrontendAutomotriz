import React from 'react'

export const Input = ({ 
  label,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input 
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-600 font-medium">{error}</span>
      )}
    </div>
  )
}

export default Input
