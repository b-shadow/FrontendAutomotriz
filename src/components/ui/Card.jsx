import React from 'react'

export const Card = ({ children, elevated = false, className = '', ...props }) => {
  const style = elevated ? 'card-elevated' : 'card'
  return (
    <div className={`${style} ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
