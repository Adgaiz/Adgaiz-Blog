import SearchManager from './SearchManager';
import Sidebar from './Sidebar';
import BackToTop from './BackToTop';
import styles from '@/styles/MainLayout.module.css';
import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const allPosts = getSortedPostsData();
  const searchPosts = allPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt
  }));

  const recentPosts = allPosts.slice(0, 3).map(p => ({
    title: p.title,
    slug: p.slug
  }));

  const categories = Array.from(new Set(allPosts.map(p => p.category || '未分类')));
  const tags = Array.from(new Set(allPosts.flatMap(p => p.tags || [])));

  return (
    <div className={styles.wrapper}>
      <SearchManager posts={searchPosts} />
      <div className={styles.container}>
        <main className={`${styles.main} ${!showSidebar ? styles.fullWidth : ''}`}>
          {children}
        </main>
        {showSidebar && <Sidebar recentPosts={recentPosts} categories={categories} tags={tags} />}
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© {new Date().getFullYear()} By Adgaiz <Link href="/admin/login" style={{ opacity: 0, cursor: 'default' }}>Admin</Link></p>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
