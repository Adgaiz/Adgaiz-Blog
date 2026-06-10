'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import styles from '@/styles/Navbar.module.css';

export default function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Blog<span>.</span>
        </Link>
        
        <div className={styles.actions}>
          <button 
            className={styles.searchButton} 
            aria-label="搜索"
            onClick={onSearchOpen}
          >
            <Search size={20} />
            <span className={styles.searchText}>搜索...</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
