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
        position: 'fixed', left : `${position.x}px`,
        top: `${position.y}px`, touchAction : 'none', // Evitar scroll al arrastrar en móviles
      }}
      className={`z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-burgundy-700 flex items-center justify-center text-white shadow-xl shadow-primary-900/30 cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'scale-110' : 'hover:scale-110'}`}
      title="Asistente de IA"
    >
      <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity pointer-events-none"></div>
      <Bot size={24} strokeWidth={2.5} className={!isDragging ? "animate-pulse" : ""} />
    </div>
  )
}
