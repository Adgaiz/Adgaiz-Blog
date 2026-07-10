import { getPostData, getSortedPostsData } from '@/lib/posts';
import MainLayout from '@/components/MainLayout';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { Calendar, Eye, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/BlogPost.module.css';
import TableOfContents from '@/components/TableOfContents';
import { components } from '@/components/MDXComponents';
import ReadingModeToggle from '@/components/ReadingModeToggle';
import ViewCount from '@/components/ViewCount';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = getPostData(decodedSlug);

  if (!post) {
    notFound();
  }

  return (
    <MainLayout showSidebar={false}>
      <div className={styles.container}>
        <TableOfContents content={post.content} />
        <article className={styles.article}>
          <div className={styles.topActions}>
            <Link href="/" className={styles.backLink}>
              <ChevronLeft size={16} />
              返回首页
            </Link>
          </div>
          
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                {post.date}
              </span>
              <span className={styles.metaItem}>
                <Eye size={14} />
                <ViewCount slug={post.slug} initialViews={post.views} increment />
              </span>
            </div>
            <h1 className={styles.title}>{post.title}</h1>
          </header>

          <div className={styles.content}>
            <MDXRemote source={post.content} components={components} />
          </div>

          <footer className={styles.footer}>
            <div className={styles.tags}>
              {post.tags?.map(tag => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          </footer>
        </article>
      </div>
    </MainLayout>
  );
}
