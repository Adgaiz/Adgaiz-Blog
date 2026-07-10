import { NextRequest, NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';
import { getPostViewCounts, isViewStoreConfigured } from '@/lib/views';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestedSlugs = (request.nextUrl.searchParams.get('slugs') || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);

  const existingSlugs = new Set(getSortedPostsData().map((post) => post.slug));
  const slugs = [...new Set(requestedSlugs)].filter((slug) => existingSlugs.has(slug)).slice(0, 100);

  try {
    const views = await getPostViewCounts(slugs);

    return NextResponse.json(
      {
        success: true,
        configured: isViewStoreConfigured(),
        views,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Get view counts error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load view counts' },
      { status: 500 },
    );
  }
}
