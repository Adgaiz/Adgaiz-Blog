'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import Fuse from 'fuse.js';
import Link from 'next/link';
import styles from '@/styles/SearchModal.module.css';

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: SearchResult[];
}

export default function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: ['title', 'excerpt'],
      threshold: 0.3,
    });
  }, [posts]);

  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query).map(r => r.item);
  }, [fuse, query]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onClose(); // This is a bit hacky, Navbar should handle it
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索文章..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
          />
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.results}>
          {query && results.length === 0 && (
            <div className={styles.noResults}>未找到关于 "{query}" 的文章</div>
          )}
          
          {results.map((result) => (
            <Link 
              key={result.slug} 
              href={`/blog/${result.slug}`} 
              className={styles.resultItem}
              onClick={onClose}
            >
              <h3 className={styles.resultTitle}>{result.title}</h3>
              <p className={styles.resultExcerpt}>{result.excerpt}</p>
            </Link>
          ))}
          
          {!query && (
            <div className={styles.emptyState}>输入关键词开始搜索...</div>
          )}
        </div>
      </div>
    </div>
  );
}
