import { getSortedPostsData } from '@/lib/posts';
import MainLayout from '@/components/MainLayout';
import PostCard from '@/components/PostCard';
import { ViewCountsProvider } from '@/components/ViewCount';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import gridStyles from '@/styles/PostGrid.module.css';

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  const tags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  
  return tags.map((tag) => ({
    tag: tag.toLowerCase(),
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  const allPosts = getSortedPostsData();
  const filteredPosts = allPosts.filter(
    post => post.tags?.some(t => t.toLowerCase() === decodedTag.toLowerCase())
  );

  if (filteredPosts.length === 0) {
    notFound();
  }

  return (
    <MainLayout>
      <section>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
          <ChevronLeft size={16} />
          返回首页
        </Link>
        
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 800 }}>
          标签：#{decodedTag}
        </h1>
        
        <ViewCountsProvider slugs={filteredPosts.map((post) => post.slug)}>
          <div className={gridStyles.grid}>
            {filteredPosts.map((post) => (
              <PostCard
                key={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                date={post.date}
                views={post.views}
                slug={post.slug}
                category={post.category}
                cover={post.cover}
              />
            ))}
          </div>
        </ViewCountsProvider>
      </section>
    </MainLayout>
  );
}
