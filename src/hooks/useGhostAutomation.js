import { useState, useCallback } from 'react';

export const useGhostAutomation = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateDelay = useCallback((ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const simulateTyping = useCallback(async (setter, field, value, speed = 40) => {
    if (value === undefined || value === null) return;
    const stringValue = String(value);
    let current = "";
    for (let i = 0; i <= stringValue.length; i++) {
      current = stringValue.substring(0, i);
      if (field) {
        setter(prev => {
          const prevVal = prev[field];
          let typedVal = current;
          if (typeof prevVal === 'number') {
            typedVal = parseInt(current, 10) || 0;
          }
          return {
            ...prev,
            [field]: typedVal
          };
        });
      } else {
        setter(current);
      }
      await new Promise(resolve => setTimeout(resolve, speed));
    }
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
