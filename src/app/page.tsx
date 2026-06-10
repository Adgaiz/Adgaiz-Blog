import MainLayout from '@/components/MainLayout';
import PostCard from '@/components/PostCard';
import { getSortedPostsData } from '@/lib/posts';

export default function Home() {
  const allPostsData = getSortedPostsData().slice(0, 5); // Show latest 5 as per requirement

  return (
    <MainLayout>
      <section>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 800 }}>
          最新文章
        </h1>
        <div>
          {allPostsData.map((post) => (
            <PostCard
              key={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              readingTime={post.readingTime}
              slug={post.slug}
              category={post.category}
            />
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
