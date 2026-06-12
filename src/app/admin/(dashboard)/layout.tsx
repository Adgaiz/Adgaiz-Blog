'use client';

import React from 'react';
import styles from '@/styles/AdminLayout.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {}
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/admin">
            Admin<span>.</span>
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>仪表盘</Link>
          <Link href="/admin/posts" className={styles.navLink}>文章管理</Link>
          <Link href="/" className={styles.navLink} target="_blank">查看博客</Link>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className={styles.navLink} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
            退出登录
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
