import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src/content');

export interface PostData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readingTime: string;
  content: string;
  category?: string;
  tags?: string[];
}

export function getSortedPostsData(): PostData[] {
  // Ensure directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.(mdx|md)$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Smart title extraction: Frontmatter > First H1 > Slug
      let title = data.title;
      if (!title) {
        const h1Match = content.match(/^#\s+(.+)$/m);
        title = h1Match ? h1Match[1] : slug;
      }

      // Default date to file creation date if missing in frontmatter
      let date = data.date;
      if (!date) {
        const stats = fs.statSync(fullPath);
        date = stats.birthtime.toISOString().split('T')[0];
      }

      // Sanitize style strings that break MDX (e.g., style="zoom:150%")
      const sanitizedContent = content.replace(/style="([^"]*)"/g, (match, p1) => {
        // Simple conversion or removal. For now, let's remove to be safe, 
        // or convert to JSX if it's simple.
        return ''; 
      });

      return {
        slug,
        title,
        date,
        excerpt: data.excerpt || content.replace(/#+\s+.+$/gm, '').trim().slice(0, 150).replace(/\r?\n/g, ' ') + '...',
        readingTime: calculateReadingTime(content),
        content: sanitizedContent,
        category: data.category || '未分类',
        tags: data.tags || [],
      };
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostData(slug: string): PostData | null {
  let fullPath = path.join(postsDirectory, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(postsDirectory, `${slug}.md`);
  }
  
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Smart title extraction: Frontmatter > First H1 > Slug
  let title = data.title;
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    title = h1Match ? h1Match[1] : slug;
  }

  // Default date to file creation date if missing in frontmatter
  let date = data.date;
  if (!date) {
    const stats = fs.statSync(fullPath);
    date = stats.birthtime.toISOString().split('T')[0];
  }

  // Sanitize style strings that break MDX (e.g., style="zoom:150%")
  const sanitizedContent = content.replace(/style="([^"]*)"/g, (match, p1) => {
    return ''; 
  });

  return {
    slug,
    title,
    date,
    excerpt: data.excerpt || content.replace(/#+\s+.+$/gm, '').trim().slice(0, 150).replace(/\r?\n/g, ' ') + '...',
    readingTime: calculateReadingTime(content),
    content: sanitizedContent,
    category: data.category || '未分类',
    tags: data.tags || [],
  };
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `阅读时间 ${minutes} 分钟`;
}
