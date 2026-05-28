import React from 'react'
import { Sparkles } from 'lucide-react'

export const GhostIndicator = ({ isSimulating, message = "IA escribiendo..." }) => {
  if (!isSimulating) return null

  return (
    <div className="fixed top-24 right-8 z-50 animate-bounce">
      <div className="bg-primary-600 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-primary-400 backdrop-blur-sm bg-opacity-90">
        <Sparkles className="animate-pulse text-amber-300" size={18} />
        <span className="text-sm font-bold tracking-tight">{message}</span>
      </div>
    </div>
  )
}

export default GhostIndicator
