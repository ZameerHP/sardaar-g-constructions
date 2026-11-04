'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ensures any legacy [data-stair] elements remain unclipped so headings
 * and images are never half-cut on screen. Unified scroll reveals are
 * coordinated by MotionDirector using transform + opacity only.
 */
export function StairMotion() {
  const path = usePathname();
  useEffect(() => {
    const root = document.querySelector('.public-site');
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-stair]').forEach(el => {
      el.style.removeProperty('clip-path');
      delete el.dataset.stair;
    });
  }, [path]);
  return null;
}
