'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ReadingModeContextType {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | undefined>(undefined);

export const ReadingModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const pathname = usePathname();

  // Reset focus mode when navigation occurs
  useEffect(() => {
    setIsFocusMode(false);
  }, [pathname]);

  const toggleFocusMode = () => setIsFocusMode(!isFocusMode);

  return (
    <ReadingModeContext.Provider value={{ isFocusMode, toggleFocusMode }}>
      <div className={isFocusMode ? 'focus-mode' : ''}>
        {children}
      </div>
    </ReadingModeContext.Provider>
  );
};

export const useReadingMode = () => {
  const context = useContext(ReadingModeContext);
  if (context === undefined) {
    throw new Error('useReadingMode must be used within a ReadingModeProvider');
  }
  return context;
};
