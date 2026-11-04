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
      const header = document.querySelector<HTMLElement>('.header');
      let frame = 0;

      const tick = () => {
        frame = 0;
        if (document.hidden || !hero) return;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          hero.style.removeProperty('--brand-rise');
          hero.style.removeProperty('--brand-scale');
          hero.style.removeProperty('--scene-scale');
          hero.style.removeProperty('--scene-drop');
          return;
        }
        const stage = hero.parentElement;
        if (!stage) return;
        const stageRect = stage.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const top = header?.getBoundingClientRect().height || 84;
        const maxTravel = Math.max(1, stageRect.height - heroRect.height);
        const progress = Math.min(1, Math.max(0, (top - stageRect.top) / maxTravel));
        const smooth = progress * progress * (3 - 2 * progress);

        hero.style.setProperty('--hero-scroll', String(progress));
        hero.style.setProperty('--brand-rise', `${smooth * -36}px`);
        hero.style.setProperty('--brand-scale', String(1 + smooth * 0.04));
        hero.style.setProperty('--scene-scale', String(1.06 - smooth * 0.06));
        hero.style.setProperty('--scene-drop', `${smooth * 16}px`);
        hero.style.setProperty('--meta-opacity', String(1 - Math.min(1, progress * 2.5)));
      };

      const schedule = () => {
        if (!frame && !document.hidden) {
          frame = requestAnimationFrame(tick);
        }
      };

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      document.addEventListener('visibilitychange', schedule);
      schedule();

      teardown = () => {
        cancelAnimationFrame(frame);
        revealObserver.disconnect();
        animations.forEach(a => a.cancel());
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        document.removeEventListener('visibilitychange', schedule);
        if (hero) {
          [
            '--hero-scroll',
            '--brand-scale',
            '--meta-opacity',
            '--brand-rise',
            '--scene-scale',
            '--scene-drop',
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
