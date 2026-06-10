'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import styles from '@/styles/BackToTop.module.css';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      className={styles.button}
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <ChevronUp size={24} />
    </button>
  );
}
