import React from 'react';
import Link from 'next/link';
import { CalendarDays, Eye, FileText, Tags } from 'lucide-react';
import styles from '@/styles/AdminDashboard.module.css';
import { getSortedPostsData } from '@/lib/posts';
import { getDashboardViewStats } from '@/lib/views';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const posts = getSortedPostsData();
  const totalPosts = posts.length;
  const totalTags = new Set(posts.flatMap(p => p.tags || [])).size;
  const viewStats = await getDashboardViewStats(posts.map((post) => post.slug));
  const topPosts = posts
    .map((post) => ({ ...post, views: viewStats.postViews[post.slug] ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const maxDailyViews = Math.max(...viewStats.dailyViews.map((day) => day.views), 1);

  const stats = [
    { label: '总文章数', value: totalPosts, icon: FileText },
    { label: '总标签数', value: totalTags, icon: Tags },
    { label: '总浏览量', value: viewStats.totalViews, icon: Eye },
    { label: '今日浏览量', value: viewStats.todayViews, icon: CalendarDays },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>仪表盘</h1>
      <div className={styles.welcomeCard}>
        <h2>欢迎回来，Adgaiz</h2>
        <p>查看博客运营概况，或从左侧菜单管理文章。</p>
      </div>

      {!viewStats.configured && (
        <div className={styles.setupNotice} role="status">
          浏览量存储尚未配置。添加 Upstash Redis 环境变量后，访问数据将自动开始统计。
        </div>
      )}
      
      <div className={styles.statsGrid}>
        {stats.map(({ label, value, icon: Icon }) => (
          <div className={styles.statCard} key={label}>
            <div className={styles.statLabel}>
              <Icon size={18} />
              <h3>{label}</h3>
            </div>
            <p className={styles.statValue}>{value.toLocaleString('zh-CN')}</p>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>最近 7 天</h2>
              <p>每日有效文章浏览量</p>
            </div>
          </div>
          <div className={styles.chart}>
            {viewStats.dailyViews.map((day) => (
              <div className={styles.chartColumn} key={day.date}>
                <span className={styles.chartValue}>{day.views}</span>
                <div className={styles.chartTrack}>
                  <div
                    className={styles.chartBar}
                    style={{
                      height: `${day.views === 0 ? 2 : Math.max((day.views / maxDailyViews) * 100, 8)}%`,
                    }}
                  />
                </div>
                <span className={styles.chartLabel}>{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>热门文章</h2>
              <p>按累计浏览量排序</p>
            </div>
          </div>
          <div className={styles.rankingList}>
            {topPosts.map((post, index) => (
              <Link href={`/blog/${post.slug}`} className={styles.rankingItem} key={post.slug}>
                <span className={styles.rank}>{index + 1}</span>
                <span className={styles.postTitle}>{post.title}</span>
                <span className={styles.postViews}>{post.views.toLocaleString('zh-CN')}</span>
              </Link>
            ))}
            {topPosts.length === 0 && <p className={styles.emptyState}>还没有文章</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
