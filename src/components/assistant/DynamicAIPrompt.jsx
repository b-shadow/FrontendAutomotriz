import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, CheckCircle2 } from 'lucide-react';

export const DynamicAIPrompt = ({ 
  type = "select_list", // "select_list" or "checkboxes"
  options = [], 
  onSelect,
  disabled = false
}) => {
  const [selected, setSelected] = useState(type === 'checkboxes' ? [] : null);

  const handleSelect = (option) => {
    if (disabled) return;
    
    if (type === 'checkboxes') {
      const newSelected = selected.includes(option)
        ? selected.filter(item => item !== option)
        : [...selected, option];
      setSelected(newSelected);
      // Wait for user to explicitly click a 'Confirm' button outside if multiple? 
      // Or pass array immediately
    } else {
      setSelected(option);
      onSelect(option); // Auto confirm for single select
    }
  };

  const confirmMultiple = () => {
    if (selected.length > 0) {
      onSelect(selected.join(", "));
    }
  };

  if (!options || options.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-2 mt-2"
    >
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          const isSelected = type === 'checkboxes' ? selected.includes(opt) : selected === opt;
          
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => handleSelect(opt)}
              className={`text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
                isSelected 
                  ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-300' 
                  : 'bg-white border-neutral-200 text-carbon-700 hover:border-primary-300 hover:bg-neutral-50 dark:bg-carbon-900 dark:border-white/[0.06] dark:text-neutral-300 dark:hover:border-white/[0.12] dark:hover:bg-carbon-800'
              } ${disabled && 'opacity-60 cursor-not-allowed hover:border-neutral-200 dark:hover:border-white/[0.06] hover:bg-white dark:hover:bg-carbon-900'}`}
            >
              <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${
                isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-neutral-300 dark:border-carbon-600 text-transparent'
              }`}>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
              <span className="text-sm font-medium leading-tight">{opt}</span>
            </button>
          );
        })}
      </div>

      {type === 'checkboxes' && !disabled && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: selected.length > 0 ? 1 : 0 }}
          disabled={selected.length === 0}
          onClick={confirmMultiple}
          className="mt-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-0"
        >
          Confirmar Selección ({selected.length})
        </motion.button>
      )}
    </motion.div>
  );
};

export default DynamicAIPrompt;
