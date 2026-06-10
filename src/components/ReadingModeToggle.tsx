'use client';

import { useReadingMode } from './ReadingModeProvider';
import { Maximize2, Minimize2 } from 'lucide-react';
import styles from '@/styles/BlogPost.module.css';

export default function ReadingModeToggle() {
  const { isFocusMode, toggleFocusMode } = useReadingMode();

  return (
    <button 
      onClick={toggleFocusMode} 
      className={styles.cleanToggle}
      title={isFocusMode ? "退出沉浸模式" : "开启沉浸模式"}
    >
      {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      <span>{isFocusMode ? "退出沉浸" : "沉浸模式"}</span>
    </button>
  );
}
