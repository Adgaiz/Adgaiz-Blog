import React from 'react';
import styles from '@/styles/AdminDashboard.module.css';
import { getSortedPostsData } from '@/lib/posts';

export default function AdminDashboardPage() {
  const posts = getSortedPostsData();
  const totalPosts = posts.length;
  const totalTags = new Set(posts.flatMap(p => p.tags || [])).size;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>仪表盘</h1>
      <div className={styles.welcomeCard}>
        <h2>欢迎回来，Adgaiz</h2>
        <p>这里是您的博客控制台。您可以在左侧菜单管理您的文章。</p>
      </div>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>总文章数</h3>
          <p className={styles.statValue}>{totalPosts}</p>
        </div>
        <div className={styles.statCard}>
          <h3>总标签数</h3>
          <p className={styles.statValue}>{totalTags}</p>
        </div>
      </div>
    </div>
  );
}
