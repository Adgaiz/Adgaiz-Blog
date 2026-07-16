import MainLayout from '@/components/MainLayout';
import PostCard from '@/components/PostCard';
import { ViewCountsProvider } from '@/components/ViewCount';
import { getSortedPostsData } from '@/lib/posts';
import gridStyles from '@/styles/PostGrid.module.css';

export default function Home() {
  const allPostsData = getSortedPostsData().slice(0, 6);

  return (
    <MainLayout>
      <section>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 800 }}>
          最新文章
        </h1>
        <ViewCountsProvider slugs={allPostsData.map((post) => post.slug)}>
          <div className={gridStyles.grid}>
            {allPostsData.map((post) => (
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
