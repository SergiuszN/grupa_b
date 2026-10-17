"use client";

import { useCallback, useRef, useState } from "react";

export interface UseProgressiveListOptions {
  /** Initial number of items to display (default: 10) */
  initialCount?: number;
  /** Number of items to append on each scroll trigger (default: 10) */
  pageSize?: number;
  /** IntersectionObserver rootMargin (default: "50px") */
  rootMargin?: string;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number;
  /** Simulated / intentional loading delay in ms (default: 1000ms) */
  delayMs?: number;
}

export interface UseProgressiveListResult<T> {
  /** The currently visible slice of items */
  visibleItems: T[];
  /** Whether there are more items to display */
  hasMore: boolean;
  /** Function to manually trigger loading more items */
  loadMore: () => void;
  /** Callback ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: (node: HTMLDivElement | null) => void;
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
 */
export function useProgressiveList<T>(
  items: T[],
  options: UseProgressiveListOptions = {},
): UseProgressiveListResult<T> {
  const {
    initialCount = 10,
    pageSize = 10,
    rootMargin = "50px",
    threshold = 0,
    delayMs = 1000,
  } = options;

  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const currentKey = (items[0] as { id?: string | number } | undefined)?.id ?? items.length;
  const [prevKey, setPrevKey] = useState(currentKey);

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setVisibleCount(initialCount);
  }

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
      setIsLoadingMore(false);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [hasMore, isLoadingMore, items.length, pageSize, delayMs]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        {
          rootMargin,
          threshold,
        },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [hasMore, loadMore, rootMargin, threshold],
  );

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
