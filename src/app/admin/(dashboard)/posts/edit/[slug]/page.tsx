'use client';

import { useState, useEffect, use, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ImagePlus, Save, Loader2, Trash2 } from 'lucide-react';
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
  const [cover, setCover] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [originalSlug, setOriginalSlug] = useState('');

  // Use a generated slug if new, otherwise the current slug
  const [currentSlug, setCurrentSlug] = useState('');

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  useEffect(() => {
    if (isNew) return;

    let cancelled = false;

    const loadPost = async () => {
      try {
        const res = await fetch(`/api/admin/posts/detail?slug=${slug}`);
        if (!res.ok || cancelled) return;

        const data = await res.json();
        if (data.success && data.post && !cancelled) {
          const p = data.post;
          setTitle(p.title || '');
          setCategory(p.category || '未分类');
          setTags((p.tags || []).join(', '));
          setExcerpt(p.excerpt || '');
          setCover(p.cover || '');
          setCoverPreview(p.cover || '');
          setContent(p.content || '');
          setDate(p.date || new Date().toISOString().split('T')[0]);
          setCurrentSlug(p.slug);
          setOriginalSlug(p.slug);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching post:', error);
          alert('加载文章失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [slug, isNew]);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // Don't compress small files or non-jpegs/pngs if we want to keep it simple,
      // but compressing all images to a max width is generally good.
      if (!file.type.match(/image\/(jpeg|png|webp)/)) {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file); // Fallback
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob and then to file. Use JPEG for better compression of large photos.
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageUpload = async (rawFile: File) => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        // Compress the image before converting to base64
        const file = await compressImage(rawFile);
        
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            
            // Double check size after compression (Vercel limit is 4.5MB, base64 adds ~33%)
            // 4.5MB * 0.75 = ~3.3MB binary limit. Let's set a safe limit of 3MB.
            if (file.size > 3 * 1024 * 1024) {
              return reject(new Error('图片压缩后仍然过大 (超过 3MB)，请手动压缩或缩小尺寸。'));
            }

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
      } catch (err) {
         reject(err);
      }
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
      } catch {
        alert('图片上传失败');
      }
    }
  }

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      input.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    setCoverUploading(true);

    try {
      const url = await handleImageUpload(file);
      setCover(url);
    } catch (error) {
      setCoverPreview(cover);
      alert(error instanceof Error ? `封面上传失败：${error.message}` : '封面上传失败');
    } finally {
      setCoverUploading(false);
      input.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCover('');
    setCoverPreview('');
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
${cover ? `cover: "${cover.replace(/"/g, '\\"')}"\n` : ''}---

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
    } catch {
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
          disabled={saving || coverUploading}
        >
          {saving || coverUploading ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
          {saving ? '保存中...' : coverUploading ? '封面上传中...' : '发布保存'}
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

        <div className={styles.formGroup}>
          <label>封面图（可选）</label>
          <div className={styles.coverField}>
            <div
              className={`${styles.coverPreview} ${!coverPreview ? styles.coverPlaceholder : ''}`}
              style={coverPreview ? { backgroundImage: `url("${coverPreview.replace(/"/g, '%22')}")` } : undefined}
              role="img"
              aria-label={coverPreview ? '当前文章封面预览' : '默认 Adgaiz 占位封面预览'}
            >
              {!coverPreview && (
                <>
                  <span className={styles.coverOrb} />
                  <span className={styles.coverRing} />
                  <span className={styles.coverBrand}>Adgaiz</span>
                </>
              )}
            </div>
            <div className={styles.coverControls}>
              <div className={styles.coverActions}>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.fileInput}
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                />
                <label
                  htmlFor="cover-upload"
                  className={`${styles.uploadBtn} ${coverUploading ? styles.uploadBtnDisabled : ''}`}
                  aria-disabled={coverUploading}
                >
                  {coverUploading ? <Loader2 className={styles.spin} size={18} /> : <ImagePlus size={18} />}
                  {coverUploading ? '上传中...' : coverPreview ? '更换封面' : '上传封面'}
                </label>
                {(cover || coverPreview) && (
                  <button
                    type="button"
                    className={styles.removeCoverBtn}
                    onClick={handleRemoveCover}
                    disabled={coverUploading}
                  >
                    <Trash2 size={18} />
                    移除封面
                  </button>
                )}
              </div>
              <p className={styles.coverHelp}>
                推荐使用 4:3 横图；未设置时，文章卡片将显示统一的 Adgaiz 占位封面。
              </p>
            </div>
          </div>
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
