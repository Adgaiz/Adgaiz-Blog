import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import styles from '@/styles/PostCard.module.css';
import ViewCount from '@/components/ViewCount';

interface PostCardProps {
  title: string;
  excerpt: string;
  date: string;
  views: number;
  slug: string;
  category?: string;
}

export default function PostCard({ title, excerpt, date, views, slug, category }: PostCardProps) {
  return (
    <article className={styles.card}>
      <Link href={`/blog/${slug}`} className={styles.link}>
        <header>
          <div className={styles.meta}>
            {category && <span className={styles.category}>{category}</span>}
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {date}
            </span>
            <span className={styles.metaItem}>
              <Eye size={14} />
              <ViewCount slug={slug} initialViews={views} />
            </span>
          </div>
          <h2 className={styles.title}>{title}</h2>
        </header>
        <p className={styles.excerpt}>{excerpt}</p>
        <div className={styles.footer}>
          <span className={styles.readMore}>阅读全文 →</span>
        </div>
      </Link>
    </article>
  );
}
