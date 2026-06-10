import Image from 'next/image';
import Link from 'next/link';
import { Code, Globe, User, Mail } from 'lucide-react';
import styles from '@/styles/Sidebar.module.css';

interface SidebarProps {
  recentPosts: { title: string; slug: string }[];
  categories: string[];
  tags: string[];
}

export default function Sidebar({ recentPosts, categories, tags }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <div className={styles.author}>
          <div className={styles.avatar}>
            <Image 
              src="/Adgaiz.jpg" 
              alt="Adgaiz" 
              width={80} 
              height={80} 
              className={styles.avatarImage}
            />
          </div>
          <h3>Adgaiz</h3>

          <p>IT & 作者 分享一些碎碎念 </p>
          <div className={styles.socials}>
            <Link href="#" aria-label="GitHub 代码库"><Code size={18} /></Link>
            <Link href="#" aria-label="Twitter 社交媒体"><Globe size={18} /></Link>
            <Link href="#" aria-label="LinkedIn 职业档案"><User size={18} /></Link>
            <Link href="#" aria-label="发送邮件"><Mail size={18} /></Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h4>文章分类</h4>
        <ul className={styles.categoryList}>
          {categories.map((category) => (
            <li key={category}>
              <Link href={`/category/${category.toLowerCase()}`} className={styles.categoryLink}>
                <span>{category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h4>近期文章</h4>
        <ul className={styles.recentList}>
          {recentPosts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h4>标签云</h4>
        <div className={styles.tagCloud}>
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${tag.toLowerCase()}`} className={styles.tag}>
              {tag}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
