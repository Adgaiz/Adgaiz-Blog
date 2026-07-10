'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface ViewCountContextValue {
  views: Record<string, number>;
}

const ViewCountContext = createContext<ViewCountContextValue>({ views: {} });

export function ViewCountsProvider({
  slugs,
  children,
}: {
  slugs: string[];
  children: React.ReactNode;
}) {
  const [views, setViews] = useState<Record<string, number>>({});
  const stableSlugs = useMemo(() => [...new Set(slugs)], [slugs]);
  const slugQuery = stableSlugs.join('\u0000');

  useEffect(() => {
    if (stableSlugs.length === 0) return;

    const controller = new AbortController();
    const params = new URLSearchParams({ slugs: stableSlugs.join(',') });

    fetch(`/api/views?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.success && data.views) {
          setViews(data.views);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to load view counts:', error);
        }
      });

    return () => controller.abort();
  }, [slugQuery, stableSlugs]);

  return (
    <ViewCountContext.Provider value={{ views }}>
      {children}
    </ViewCountContext.Provider>
  );
}

export default function ViewCount({
  slug,
  initialViews = 0,
  increment = false,
}: {
  slug: string;
  initialViews?: number;
  increment?: boolean;
}) {
  const { views: listViews } = useContext(ViewCountContext);
  const [detailViews, setDetailViews] = useState(initialViews);

  useEffect(() => {
    if (!increment) return;

    const controller = new AbortController();

    fetch(`/api/views/${encodeURIComponent(slug)}`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.success && typeof data.views === 'number') {
          setDetailViews(data.views);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to record view:', error);
        }
      });

    return () => controller.abort();
  }, [increment, slug]);

  const count = increment ? detailViews : (listViews[slug] ?? initialViews);
  return <>浏览量 {count.toLocaleString('zh-CN')}</>;
}
