import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';

export const DestructiveActionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Acción Peligrosa", 
  description = "¿Estás seguro de que deseas realizar esta acción? No se puede deshacer.",
  confirmText = "Sí, eliminar"
}) => {
  const [step, setStep] = useState(0); // 0 = initial, 1 = first click (are you sure?), 2 = confirmed

  const handleConfirm = () => {
    if (step === 0) {
      setStep(1);
    } else {
      setStep(2);
      onConfirm();
      setTimeout(() => {
        setStep(0);
        onClose();
      }, 500);
    }
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-carbon-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100 dark:border-red-900/30"
            >
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6"
                  animate={{ rotate: step === 1 ? [0, -10, 10, -10, 10, 0] : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertTriangle size={32} strokeWidth={2.5} />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-carbon-900 dark:text-white mb-2">
                  {title}
                </h3>
                
                <p className="text-carbon-500 dark:text-neutral-400 mb-8">
                  {description}
                </p>

                <div className="flex w-full gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-carbon-600 dark:text-neutral-300 bg-neutral-100 dark:bg-carbon-800 hover:bg-neutral-200 dark:hover:bg-carbon-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
                      step === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {step === 0 ? (
                      confirmText
                    ) : (
                      <>
                        <Check size={18} /> Confirmar
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Progress bar indication for double click */}
              <div className="h-1.5 w-full bg-neutral-100 dark:bg-carbon-800">
                <motion.div 
                  className="h-full bg-red-500"
                  initial={{ width: "0%" }}
                  animate={{ width: step === 1 ? "50%" : step === 2 ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DestructiveActionModal;
