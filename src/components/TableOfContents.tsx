'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/TOC.module.css';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headingLines = content.split('\n').filter(line => line.match(/^#{2,3}\s/));
    const items = headingLines.map(line => {
      const level = line.split(' ')[0].length;
      const text = line.replace(/^#{2,3}\s/, '');
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return { id, text, level };
    });
    setToc(items);
  }, [content]);

  if (toc.length === 0) return null;

  return (
    <nav className={styles.toc}>
      <h4 className={styles.title}>本文目录</h4>
      <ul className={styles.list}>
        {toc.map(item => (
          <li key={item.id} className={`${styles.item} ${item.level === 3 ? styles.subItem : ''}`}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
