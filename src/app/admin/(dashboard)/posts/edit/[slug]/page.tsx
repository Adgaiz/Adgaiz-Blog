'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from '@/styles/AdminEditor.module.css';

// Import markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const isNew = slug === 'new';
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('未分类');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [originalSlug, setOriginalSlug] = useState('');

  // Use a generated slug if new, otherwise the current slug
  const [currentSlug, setCurrentSlug] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchPost(slug);
    }
  }, [slug, isNew]);

  const fetchPost = async (postSlug: string) => {
    try {
      // In a real app we might want to fetch directly via API, 
      // but we can just use the public API or create a specific admin GET API.
      // Since all posts are fetched in /api/posts, we can get it from there for simplicity.
      // A better way is a specific API, let's just create /api/admin/posts?slug=...
      const res = await fetch(`/api/admin/posts/detail?slug=${postSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.post) {
          const p = data.post;
          setTitle(p.title || '');
          setCategory(p.category || '未分类');
          setTags((p.tags || []).join(', '));
          setExcerpt(p.excerpt || '');
          setContent(p.content || '');
          setDate(p.date || new Date().toISOString().split('T')[0]);
          setCurrentSlug(p.slug);
          setOriginalSlug(p.slug);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, base64 }),
          });
          const data = await res.json();
          if (data.success) {
            resolve(data.url);
          } else {
            reject(new Error(data.message));
          }
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const onImagePasted = async (dataTransfer: DataTransfer, setMarkdownInsert: (str: string) => void) => {
    const files = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    for (const file of files) {
      try {
        const url = await handleImageUpload(file);
        setMarkdownInsert(`![${file.name}](${url})`);
      } catch (err) {
        alert('图片上传失败');
      }
    }
  };

  const handleSave = async () => {
    if (!title) return alert('标题不能为空');
    if (!content) return alert('正文不能为空');

    setSaving(true);
    
    // Auto-generate slug from title if new and no slug provided
    const finalSlug = isNew ? (currentSlug || title.toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '')) : originalSlug;

    // Assemble Frontmatter
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
excerpt: "${excerpt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
category: "${category.replace(/"/g, '\\"')}"
tags: ${JSON.stringify(tagArray)}
---

`;

    const fullContent = frontmatter + content;

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: finalSlug,
          content: fullContent,
          isUpdate: !isNew
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('保存成功！稍后 Vercel 会自动重新构建网站。');
        router.push('/admin/posts');
        router.refresh();
      } else {
        alert('保存失败: ' + data.message);
      }
    } catch (err) {
      alert('网络错误，保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/posts" className={styles.backBtn}>
            <ChevronLeft size={20} />
          </Link>
          <h1 className={styles.pageTitle}>{isNew ? '新建文章' : '编辑文章'}</h1>
        </div>
        <button 
          className={styles.saveBtn} 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
          {saving ? '保存中...' : '发布保存'}
        </button>
      </div>

      <div className={styles.metaForm}>
        <div className={styles.formGroup}>
          <label>文章标题 *</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="请输入标题"
            className={styles.input}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>分类</label>
            <input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              placeholder="如：技术分享"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>发布日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>标签 (逗号分隔)</label>
          <input 
            type="text" 
            value={tags} 
            onChange={e => setTags(e.target.value)} 
            placeholder="如：React, Node.js"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>摘要</label>
          <textarea 
            value={excerpt} 
            onChange={e => setExcerpt(e.target.value)} 
            placeholder="简短的几句话介绍文章内容..."
            className={styles.textarea}
            rows={2}
          />
        </div>
      </div>

      <div className={styles.editorContainer}>
        <div 
          data-color-mode="light"
          onPaste={(e) => {
            const items = Array.from(e.clipboardData?.items || []);
            const hasImage = items.some(item => item.type.indexOf('image') !== -1);
            if (hasImage) {
              e.preventDefault();
              onImagePasted(e.clipboardData, (str) => setContent(content + '\n' + str));
            }
          }}
        >
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height={600}
            onDrop={(e) => {
              e.preventDefault();
              onImagePasted(e.dataTransfer, (str) => setContent(content + '\n' + str));
            }}
          />
        </div>
        <p className={styles.helpText}>支持拖拽或粘贴图片直接上传至 GitHub 仓库。</p>
      </div>
    </div>
  );
}
