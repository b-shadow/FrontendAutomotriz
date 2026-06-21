import { useState, useCallback, useEffect, useRef } from 'react';

export const useGhostAutomation = (config = null) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateDelay = useCallback((ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const simulateTyping = useCallback(async (setter, field, value) => {
    if (value === undefined || value === null || value === 'MANUAL') return;
    
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

  const simulateClick = useCallback(async (buttonOrId, highlightDuration = 800) => {
    const btn = typeof buttonOrId === 'string' ? document.getElementById(buttonOrId) : buttonOrId;
    if (!btn) return false;
    
    btn.classList.add('ring-4', 'ring-primary-400', 'scale-105', 'shadow-xl');
    await new Promise(resolve => setTimeout(resolve, highlightDuration));
    btn.classList.remove('ring-4', 'ring-primary-400', 'scale-105', 'shadow-xl');
    btn.click();
    return true;
  }, []);

  // Automatic Mode Support
  const lastPrefillTs = useRef(null);
  
  useEffect(() => {
    if (!config) return;
    const { aiPrefill, isModalOpen, setModalOpen, setForm, submitBtnRef, actionType, fieldMapping } = config;

    if (!aiPrefill || aiPrefill.type !== actionType) return;
    
    if (lastPrefillTs.current === aiPrefill._ts) return;
    lastPrefillTs.current = aiPrefill._ts;

    const runAutoGhost = async () => {
      setIsSimulating(true);

      // 1. Open Modal if not open
      if (!isModalOpen && setModalOpen) {
        setModalOpen(true);
        await simulateDelay(600); // Wait for modal animation
      }

      // 2. Fill fields based on mapping
      if (setForm && fieldMapping) {
        for (const [aiField, formField] of Object.entries(fieldMapping)) {
          if (aiPrefill[aiField] !== undefined && aiPrefill[aiField] !== null && aiPrefill[aiField] !== 'MANUAL') {
            await simulateTyping(setForm, formField, aiPrefill[aiField]);
          }
        }
      }

      // 3. If status is EJECUTADA, click the submit button
      if (aiPrefill.status === 'EJECUTADA' && submitBtnRef?.current) {
        await simulateDelay(600);
        await simulateClick(submitBtnRef.current);
      }

      setIsSimulating(false);
    };

    runAutoGhost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.aiPrefill, config?.isModalOpen, config?.actionType]);

  return {
    isSimulating,
    setIsSimulating,
    simulateTyping,
    simulateClick,
    simulateDelay
  };
};

export default useGhostAutomation;
