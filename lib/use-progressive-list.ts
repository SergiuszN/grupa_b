"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseProgressiveListOptions {
  /** Initial number of items to display (default: 10) */
  initialCount?: number;
  /** Number of items to append on each scroll trigger (default: 10) */
  pageSize?: number;
  /** IntersectionObserver rootMargin (default: "300px" to pre-load smoothly before reaching the bottom) */
  rootMargin?: string;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number;
}

export interface UseProgressiveListResult<T> {
  /** The currently visible slice of items */
  visibleItems: T[];
  /** Whether there are more items to display */
  hasMore: boolean;
  /** Function to manually trigger loading more items */
  loadMore: () => void;
  /** Ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Whether more items are currently being loaded */
  isLoadingMore: boolean;
  /** Total count of items in the source list */
  totalCount: number;
  /** Number of items currently shown */
  loadedCount: number;
  /** Progress percentage (0 - 100) */
  progressPercent: number;
  /** Reset visible count back to initialCount */
  reset: () => void;
}

/**
 * Reusable hook for progressive list rendering and infinite scroll with IntersectionObserver.
 *
 * @param items Array of all items (or filtered items) to progressively display
 * @param options Configuration options (initialCount, pageSize, rootMargin, threshold)
 */
export function useProgressiveList<T>(
  items: T[],
  options: UseProgressiveListOptions = {},
): UseProgressiveListResult<T> {
  const {
    initialCount = 10,
    pageSize = 10,
    rootMargin = "300px",
    threshold = 0,
  } = options;

  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset to initial count whenever the input list length or first item identity changes
  const firstItemKey = (items[0] as { id?: string | number } | undefined)?.id ?? items.length;
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items.length, firstItemKey, initialCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    // Micro-delay for fluid UI rendering and visual feedback
    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
      setIsLoadingMore(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [hasMore, isLoadingMore, items.length, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, rootMargin, threshold]);

  const loadedCount = Math.min(visibleCount, items.length);
  const progressPercent =
    items.length > 0 ? Math.round((loadedCount / items.length) * 100) : 100;

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore,
    loadMore,
    sentinelRef,
    isLoadingMore,
    totalCount: items.length,
    loadedCount,
    progressPercent,
    reset: () => setVisibleCount(initialCount),
  };
}
