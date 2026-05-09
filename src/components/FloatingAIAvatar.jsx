import React, { useState, useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'

export const FloatingAIAvatar = ({ onClick }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  
  const initialClickPos = useRef({ x: 0, y: 0 })
  const offset = useRef({ x: 0, y: 0 })

  // Inicializar la posición en la esquina inferior derecha
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 80, y : window.innerHeight - 80,
    })

    const handleResize = () => {
      // Evitar que el botón se quede fuera de la pantalla si se cambia el tamaño
      setPosition((prev) => {
        let newX = prev.x
        let newY = prev.y
        if (newX > window.innerWidth - 60) newX = window.innerWidth - 80
        if (newY > window.innerHeight - 60) newY = window.innerHeight - 80
        return { x: newX, y: newY }
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePointerDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    initialClickPos.current = { x: e.clientX, y: e.clientY }
    
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect()
      offset.current = {
        x: e.clientX - rect.left, y : e.clientY - rect.top,
      }
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    e.preventDefault()

    let newX = e.clientX - offset.current.x
    let newY = e.clientY - offset.current.y

    // Límites de la pantalla
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60

    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX > maxX) newX = maxX
    if (newY > maxY) newY = maxY

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    setIsDragging(false)

    // Si casi no se movió, lo consideramos un click
    const moveX = Math.abs(e.clientX - initialClickPos.current.x)
    const moveY = Math.abs(e.clientY - initialClickPos.current.y)
    
    if (moveX < 5 && moveY < 5) {
      onClick()
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    } else {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging])

  return (
    <div
      ref={dragRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`z-[70] w-14 h-14 rounded-2xl bg-gradient-to-br from-carbon-900 to-carbon-700 dark:from-primary-600 dark:to-burgundy-700 flex items-center justify-center text-white shadow-2xl shadow-black/30 cursor-grab active:cursor-grabbing transition-all duration-300 ${isDragging ? 'scale-110 rotate-12' : 'hover:scale-110 hover:-rotate-6'}`}
      title="Asistente de IA"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Icon and Pulse */}
      <div className="relative flex items-center justify-center">
        {!isDragging && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping scale-150"></div>
        )}
        <Bot size={24} strokeWidth={2.5} className="relative z-10" />
      </div>

      {/* Badge or indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-carbon-900 rounded-full shadow-sm"></div>
    </div>
  )
}
