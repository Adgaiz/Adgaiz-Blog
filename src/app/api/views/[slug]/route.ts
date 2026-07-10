import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';
import { getPostViewCount, incrementPostView } from '@/lib/views';

export const dynamic = 'force-dynamic';

function getVisitorId(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const salt = process.env.VIEW_COUNT_SALT || process.env.JWT_SECRET || 'blog-view-counter';

  return createHash('sha256')
    .update(`${ip}|${userAgent}|${salt}`)
    .digest('hex')
    .slice(0, 24);
}

function isBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless/i.test(userAgent);
}

export async function POST(request: NextRequest, context: RouteContext<'/api/views/[slug]'>) {
  const { slug } = await context.params;
  const decodedSlug = decodeURIComponent(slug);
  const postExists = getSortedPostsData().some((post) => post.slug === decodedSlug);

  if (!postExists) {
    return NextResponse.json(
      { success: false, message: 'Post not found' },
      { status: 404 },
    );
  }

  try {
    if (isBot(request)) {
      return NextResponse.json({
        success: true,
        counted: false,
        views: await getPostViewCount(decodedSlug),
      });
    }

    const result = await incrementPostView(decodedSlug, getVisitorId(request));
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Increment view count error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record view' },
      { status: 500 },
    );
  }
}
