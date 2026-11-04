'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DUR_BASE = 450;
const DUR_SLOW = 800;

/**
 * Unified motion coordinator:
 * - One easing curve: cubic-bezier(0.22, 1, 0.36, 1)
 * - Scroll reveals: fade + 20px translate-up, staggered 75ms for grids/cards, fired once via IntersectionObserver.
 * - Animates ONLY transform and opacity (no layout shifts, no stuck clip-paths).
 * - Subtle GPU-friendly hero parallax on desktop, disabled on mobile and prefers-reduced-motion.
 */
export function MotionDirector() {
  const path = usePathname();

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let teardown = () => {};

    const mount = () => {
      teardown();
      if (preference.matches) return;

      const animations: Animation[] = [];
      const selector = [
        '.scroll-reveal',
        '.trust-grid article',
        '.process-step',
        '.industry-grid article',
        '.manufacturer-card',
        '.area-list a',
        '.closing .section-head',
        '.service-row',
        '.positioning a',
        '.project-grid > div',
        '.warranty-card',
        '.footer-grid > div',
      ].join(', ');

      const reveals = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const seen = new WeakSet<Element>();

      const revealObserver = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting || seen.has(entry.target)) continue;
            seen.add(entry.target);
            const el = entry.target as HTMLElement;
            const siblings = Array.from(el.parentElement?.children || []);
            const idx = Math.max(0, siblings.indexOf(el));
            const stagger = Math.min(idx, 5) * 75;
            const isLarge =
              el.classList.contains('scroll-reveal') ||
              el.matches('.project-grid > div');

            const anim = el.animate(
              [
                { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
                { opacity: 1, transform: 'translate3d(0, 0, 0)' },
              ],
              {
                duration: isLarge ? DUR_SLOW : DUR_BASE,
                delay: stagger,
                easing: EASE_OUT,
                fill: 'both',
              },
            );
            animations.push(anim);
            revealObserver.unobserve(el);
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
      );

      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        // If already well within the initial viewport, don't flash-hide it
        if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0 && window.scrollY < 40) {
          seen.add(el);
          return;
        }
        revealObserver.observe(el);
      });

      const hero = document.querySelector<HTMLElement>('.cinema-hero');
      let frame = 0;
      let currentProgress = 0;
      let targetProgress = 0;
      let currentPointerX = 0;
      let currentPointerY = 0;
      let targetPointerX = 0;
      let targetPointerY = 0;

      const updateTargetScroll = () => {
        if (!hero) return;
        const heroHeight = Math.max(640, hero.offsetHeight || window.innerHeight);
        targetProgress = Math.min(1, Math.max(0, window.scrollY / (heroHeight * 0.92)));
      };

      const tick = () => {
        frame = 0;
        if (document.hidden || !hero) return;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          hero.style.removeProperty('--brand-rise');
          hero.style.removeProperty('--brand-scale');
          hero.style.removeProperty('--scene-scale');
          hero.style.removeProperty('--scene-drop');
          hero.style.removeProperty('--pointer-x');
          hero.style.removeProperty('--pointer-y');
          hero.style.removeProperty('--meta-opacity');
          return;
        }

        updateTargetScroll();

        // Silky damped interpolation (60fps+ inertia that settles cleanly to idle)
        currentProgress += (targetProgress - currentProgress) * 0.11;
        currentPointerX += (targetPointerX - currentPointerX) * 0.08;
        currentPointerY += (targetPointerY - currentPointerY) * 0.08;

        const smooth = currentProgress * currentProgress * (3 - 2 * currentProgress);

        hero.style.setProperty('--hero-scroll', currentProgress.toFixed(4));
        hero.style.setProperty('--brand-rise', `${(smooth * -42).toFixed(2)}px`);
        hero.style.setProperty('--brand-scale', (1 + smooth * 0.045).toFixed(4));
        hero.style.setProperty('--scene-scale', (1.065 - smooth * 0.065).toFixed(4));
        hero.style.setProperty('--scene-drop', `${(smooth * 22).toFixed(2)}px`);
        hero.style.setProperty('--pointer-x', `${currentPointerX.toFixed(2)}px`);
        hero.style.setProperty('--pointer-y', `${currentPointerY.toFixed(2)}px`);
        hero.style.setProperty(
          '--meta-opacity',
          Math.max(0, 1 - currentProgress * 2.1).toFixed(3),
        );

        const stillMoving =
          Math.abs(targetProgress - currentProgress) > 0.0006 ||
          Math.abs(targetPointerX - currentPointerX) > 0.04 ||
          Math.abs(targetPointerY - currentPointerY) > 0.04;

        if (stillMoving) {
          frame = requestAnimationFrame(tick);
        }
      };

      const schedule = () => {
        if (!frame && !document.hidden) {
          frame = requestAnimationFrame(tick);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (window.innerWidth <= 768) return;
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        targetPointerX = nx * 10;
        targetPointerY = ny * 6;
        schedule();
      };

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('visibilitychange', schedule);
      updateTargetScroll();
      currentProgress = targetProgress;
      schedule();

      teardown = () => {
        cancelAnimationFrame(frame);
        revealObserver.disconnect();
        animations.forEach(a => a.cancel());
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('visibilitychange', schedule);
        if (hero) {
          [
            '--hero-scroll',
            '--brand-scale',
            '--meta-opacity',
            '--brand-rise',
            '--scene-scale',
            '--scene-drop',
            '--pointer-x',
            '--pointer-y',
          ].forEach(p => hero.style.removeProperty(p));
        }
      };
    };

    mount();
    preference.addEventListener('change', mount);
    return () => {
      teardown();
      preference.removeEventListener('change', mount);
    };
  }, [path]);

  return null;
}
