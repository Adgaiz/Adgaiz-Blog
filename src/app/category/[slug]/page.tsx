import { getSortedPostsData } from '@/lib/posts';
import MainLayout from '@/components/MainLayout';
import PostCard from '@/components/PostCard';
import { ViewCountsProvider } from '@/components/ViewCount';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import gridStyles from '@/styles/PostGrid.module.css';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  const categories = Array.from(new Set(posts.map(p => p.category || '未分类')));
  
  return categories.map((category) => ({
    slug: category.toLowerCase(),
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const allPosts = getSortedPostsData();
  const filteredPosts = allPosts.filter(
    post => (post.category || '未分类').toLowerCase() === decodedSlug.toLowerCase()
  );

  if (filteredPosts.length === 0) {
    notFound();
  }

  const categoryName = filteredPosts[0].category || decodedSlug;

  return (
    <MainLayout>
      <section>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
          <ChevronLeft size={16} />
          返回首页
        </Link>
        
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 800 }}>
          分类：{categoryName}
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
