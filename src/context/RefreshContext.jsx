import React, { createContext, useContext, useState, useCallback } from 'react';

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshTick, setRefreshTick] = useState(0);

  // Incrementa el tick para notificar a los suscriptores que deben refrescarse
  const triggerRefresh = useCallback(() => {
    setRefreshTick(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTick, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh debe usarse dentro de un RefreshProvider');
  }
  return context;
};
