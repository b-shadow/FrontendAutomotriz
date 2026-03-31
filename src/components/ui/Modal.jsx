import React from 'react'

export const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>
        {title && <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-6 pr-8">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export default Modal
