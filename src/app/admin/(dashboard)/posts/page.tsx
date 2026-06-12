'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styles from '@/styles/AdminPosts.module.css';

interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts'); // Need to create this API to list posts
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`确定要删除文章 "${slug}" 吗？此操作不可恢复。`)) return;

    try {
      const res = await fetch(`/api/admin/posts?slug=${slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter(p => p.slug !== slug));
      } else {
        alert('删除失败: ' + data.message);
      }
    } catch (error) {
      alert('网络错误，删除失败');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>文章管理</h1>
        <Link href="/admin/posts/edit/new" className={styles.createBtn}>
          <Plus size={18} /> 新建文章
        </Link>
      </div>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>标题</th>
                <th>别名 (Slug)</th>
                <th>分类</th>
                <th>日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.slug}>
                  <td className={styles.postTitle}>{post.title}</td>
                  <td>{post.slug}</td>
                  <td><span className={styles.categoryBadge}>{post.category}</span></td>
                  <td>{post.date}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/posts/edit/${post.slug}`} className={styles.actionBtn} title="编辑">
                        <Edit size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.slug)} 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>暂无文章</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
