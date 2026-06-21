import { useState, useCallback } from 'react';

export const useGhostAutomation = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateDelay = useCallback((ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const simulateTyping = useCallback(async (setter, field, value) => {
    if (value === undefined || value === null) return;
    
    // Asignación instantánea (sin el delay inestable de tipeo letra por letra)
    if (field) {
      setter(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setter(value);
    }
    
    // Pequeño respiro para que React renderice
    await new Promise(resolve => setTimeout(resolve, 200));
  }, []);

  const simulateClick = useCallback(async (buttonId, highlightDuration = 800) => {
    const btn = document.getElementById(buttonId);
    if (!btn) return false;
    
    btn.classList.add('ring-4', 'ring-primary-400', 'scale-105', 'shadow-xl');
    await new Promise(resolve => setTimeout(resolve, highlightDuration));
    btn.classList.remove('ring-4', 'ring-primary-400', 'scale-105', 'shadow-xl');
    btn.click();
    return true;
  }, []);

  return {
    isSimulating,
    setIsSimulating,
    simulateTyping,
    simulateClick,
    simulateDelay
  };
};

export default useGhostAutomation;
