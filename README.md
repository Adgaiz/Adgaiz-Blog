# 现代个人博客网站 (Modern Personal Blog)

这是一个基于 Next.js 16 构建的极简、现代且响应式的个人博客系统。它旨在提供优雅的阅读体验，支持深色模式、全文搜索、浏览量统计以及 MDX 内容管理。

## 🚀 核心特性

- **极简现代风**：专注于内容可读性，采用无衬线字体和充足的留白。
- **MDX 支持**：文章使用 MDX 撰写，支持在 Markdown 中嵌入 React 组件。
- **沉浸式阅读模式**：一键切换沉浸模式，隐藏侧边栏，专注于文字阅读。
- **全文模糊搜索**：集成 `fuse.js` 实现高性能的实时搜索。
- **响应式设计**：完美适配手机、平板和桌面端。
- **深色/浅色模式**：支持手动切换及系统偏好自动切换。
- **自动目录 (TOC)**：文章详情页根据标题自动生成可跳转的目录。
- **SEO 优化**：基于 Next.js App Router 的原生 SEO 支持。
- **访问统计**：展示文章浏览量，并在管理后台汇总今日、累计、7 日趋势和热门文章数据。

## 🛠️ 技术栈

- **框架**：[Next.js 16 (App Router)](https://nextjs.org/)
- **样式**：Vanilla CSS (CSS Modules)
- **内容**：[MDX](https://mdxjs.com/)
- **图标**：[Lucide React](https://lucide-dev.pages.dev/)
- **搜索**：[Fuse.js](https://www.fusejs.io/)
- **类型安全**：TypeScript

## 📂 目录结构

```text
src/
├── app/          # 页面路由与布局
├── components/   # 可复用 React 组件
├── content/      # 博客文章 (MDX 文件)
├── lib/          # 工具函数与数据解析
└── styles/       # CSS 模块
public/           # 静态资源 (头像、图标等)
```

## 🛠️ 开始使用

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```
打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 3. 配置浏览量统计

在 [Upstash Console](https://console.upstash.com/) 创建 Redis 数据库，然后将 REST 凭据写入 `.env.local`：

```bash
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
VIEW_COUNT_SALT="your-random-secret"
```

部署到 Vercel 时，需要在项目环境变量中添加相同配置。也兼容 Vercel KV 使用的 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 变量名。

文章详情在浏览器加载后记录访问。同一 IP 与浏览器对同一文章 30 分钟内只计算一次，搜索引擎爬虫不会计入统计。未配置 Redis 时页面仍可正常运行，但浏览量保持为 `0`，后台会显示配置提示。

### 4. 构建生产版本
```bash
npm run build
npm start
```

## ✍️ 撰写文章

在 `src/content/` 目录下创建 `.mdx` 文件。确保包含以下 Frontmatter 元数据：

```markdown
---
title: "文章标题"
date: "2024-03-20"
excerpt: "文章摘要..."
tags: ["标签1", "标签2"]
---
```

## 📜 许可证

MIT
