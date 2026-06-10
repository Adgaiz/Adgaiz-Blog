'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import styles from '@/styles/ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className={styles.toggle}
      aria-label="切换主题"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
