import { X } from 'lucide-react';
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
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-white/[0.06] hover:bg-primary-50 dark:hover:bg-primary-900/30 text-carbon-500 hover:text-primary-500 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
        </button>
        {title && <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-6 pr-8 tracking-tight">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export default Modal
