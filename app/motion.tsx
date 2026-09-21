'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** One motion coordinator. Native scrolling stays in control; no perpetual frame loop. */
export function MotionDirector() {
  const path = usePathname();
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let teardown = () => {};
    const mount = () => {
      teardown();
      if (preference.matches) return;
      const animations: Animation[] = [];
      const reveals = Array.from(document.querySelectorAll<HTMLElement>('.scroll-reveal, .industry-grid article, .materials, .area-list a, .closing h2, .footer-wordmark, .service-row, .positioning a, .project-info, .inner-hero .label, .inner-hero p, .footer-grid > div'));
      const seen = new WeakSet<Element>();
      const revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target)) continue;
          seen.add(entry.target);
          const el = entry.target as HTMLElement;
          const image = el.classList.contains('photo-frame');
          const stagger = Math.min(Array.from(el.parentElement?.children || []).indexOf(el), 4) * 45;
          animations.push(el.animate(image ? [
            {clipPath:'inset(10% 0 4% 0)', opacity:.5, transform:'translate3d(0,46px,0)'},
            {clipPath:'inset(0% 0 0% 0)', opacity:1, transform:'translate3d(0,0,0)'}
          ] : [
            {opacity:0, transform:'translate3d(0,32px,0)'},
            {opacity:1, transform:'translate3d(0,0,0)'}
          ], {duration:image?760:600, delay:stagger, easing:'cubic-bezier(.19,1,.22,1)', fill:'backwards'}));
          revealObserver.unobserve(el);
        }
      }, {threshold:.08, rootMargin:'0px 0px -28px 0px'});
      reveals.forEach(el => revealObserver.observe(el));
      const active = new Set<HTMLElement>();
      const media = Array.from(document.querySelectorAll<HTMLElement>('.photo-frame, .interlude, .cinema-hero, .intro-image-stack'));
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const hero = document.querySelector<HTMLElement>('.cinema-hero');
      const header = document.querySelector<HTMLElement>('.header');
      const tick = () => {
        frame = 0;
        if (document.hidden) return;
        const vh = innerHeight;
        header?.style.setProperty('--page-progress', String(Math.min(1,Math.max(0,scrollY / Math.max(1,document.documentElement.scrollHeight-vh)))));
        for (const el of active) {
          const rect = el.getBoundingClientRect();
          if (el.classList.contains('cinema-hero')) {
            const stage = el.parentElement!;
            const stageRect = stage.getBoundingClientRect();
            const top = header?.getBoundingClientRect().height || 0;
            const progress = Math.min(1, Math.max(0, (top-stageRect.top) / Math.max(1,stageRect.height-rect.height)));
            const smooth = progress*progress*(3-2*progress);
            const phone = innerWidth <= 640;
            el.style.setProperty('--hero-scroll', String(progress));
            el.style.setProperty('--brand-rise', `${smooth * (phone?-48:-64)}px`);
            el.style.setProperty('--brand-scale', String(1+smooth*(phone?.035:.07)));
            el.style.setProperty('--scene-scale', String((phone?1.18:1.26)-smooth*(phone?.18:.26)));
            el.style.setProperty('--scene-drop', `${smooth * 22}px`);
            el.style.setProperty('--pointer-x', `${pointerX}px`);
            el.style.setProperty('--pointer-y', `${pointerY}px`);
            el.style.setProperty('--meta-opacity', String(1-Math.min(1,progress*3)));

          } else {
            const progress = Math.min(1,Math.max(0,(vh-rect.top)/(vh+rect.height)));
            el.style.setProperty('--media-y', `${(progress-.5)*-Math.min(60,rect.height*.10)}px`);
            el.style.setProperty('--media-scale', String(1.18-progress*.06));
            el.style.setProperty('--card-turn', `${(progress-.5)*-8}deg`);
          }
        }
      };
      const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); };
      const mediaObserver = new IntersectionObserver(entries => {for(const e of entries){if(e.isIntersecting)active.add(e.target as HTMLElement);else active.delete(e.target as HTMLElement)}schedule()}, {rootMargin:'150px'});
      media.forEach(el => mediaObserver.observe(el));
      const pointer = (e:PointerEvent) => {if(e.pointerType!=='mouse')return;const r=hero?.getBoundingClientRect();if(!r)return;pointerX=((e.clientX-r.left)/r.width-.5)*10;pointerY=((e.clientY-r.top)/r.height-.5)*6;schedule()};
      const resetPointer = () => {pointerX=0;pointerY=0;schedule()};
      hero?.addEventListener('pointermove',pointer);
      hero?.addEventListener('pointerleave',resetPointer);
      addEventListener('scroll',schedule,{passive:true});
      addEventListener('resize',schedule,{passive:true});
      document.addEventListener('visibilitychange',schedule);
      schedule();
      teardown=()=>{header?.style.removeProperty('--page-progress');cancelAnimationFrame(frame);revealObserver.disconnect();mediaObserver.disconnect();animations.forEach(a=>a.cancel());removeEventListener('scroll',schedule);removeEventListener('resize',schedule);document.removeEventListener('visibilitychange',schedule);hero?.removeEventListener('pointermove',pointer);hero?.removeEventListener('pointerleave',resetPointer);media.forEach(el=>['--hero-scroll','--brand-scale','--meta-opacity','--brand-rise','--scene-scale','--scene-drop','--pointer-x','--pointer-y','--frame-inset','--media-y','--media-scale','--card-turn'].forEach(p=>el.style.removeProperty(p)))};
    };
    mount();preference.addEventListener('change',mount);
    return()=>{teardown();preference.removeEventListener('change',mount)};
  },[path]);
  return null;
}
