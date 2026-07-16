import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
const postsDirectory = path.join(process.cwd(), 'src/content');

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 });

    let fullPath = path.join(postsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.md`);
    }

    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      
      const post = {
        slug,
        title: data.title || '',
        category: data.category || '未分类',
        tags: data.tags || [],
        date: data.date || '',
        excerpt: data.excerpt || '',
        cover: typeof data.cover === 'string' ? data.cover : '',
        content // Raw content needed for editor
      };

      return NextResponse.json({ success: true, post }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
  } catch (error: unknown) {
    console.error('Get Post Detail Error:', error);
    const message = error instanceof Error ? error.message : 'Fetch failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
