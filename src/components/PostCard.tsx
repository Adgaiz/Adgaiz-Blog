import Link from 'next/link';
import Image from 'next/image';
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
  cover?: string;
}

export default function PostCard({ title, excerpt, date, views, slug, category, cover }: PostCardProps) {
  return (
    <article className={styles.card}>
      <Link href={`/blog/${slug}`} className={styles.link}>
        <div className={styles.cover}>
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="(max-width: 720px) calc(100vw - 3rem), (max-width: 1024px) calc(50vw - 2.5rem), 470px"
              className={styles.coverImage}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span className={styles.placeholderOrb} />
              <span className={styles.placeholderRing} />
              <span className={styles.placeholderText}>Adgaiz</span>
            </div>
          )}
          {category && <span className={styles.category}>{category}</span>}
        </div>

        <div className={styles.content}>
          <header>
            <h2 className={styles.title}>{title}</h2>
          </header>
          <p className={styles.excerpt}>{excerpt}</p>
          <div className={styles.footer}>
            <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {date}
            </span>
            <span className={styles.metaItem}>
              <Eye size={14} />
              <ViewCount slug={slug} initialViews={views} />
            </span>
            </div>
            <span className={styles.readMore}>阅读全文 →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
