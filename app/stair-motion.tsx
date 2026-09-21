'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Scroll-scrubbed horizontal bands: one mask per element, no duplicate images,
 * hidden copies of text, scroll interception, or perpetual animation loop. */
export function StairMotion() {
  const path = usePathname();
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};
    function mount() {
      dispose();
      if (preference.matches) return;
      const root = document.querySelector('.public-site');
      if (!root || !CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)')) return;
      const items = new Set<HTMLElement>();
      const active = new Set<HTMLElement>();
      let frame = 0;
      const clamp = (v: number) => Math.max(0, Math.min(1, v));
      const mask = (enter: number, leave: number, bands: number) => {
        const edges = Array.from({length: bands}, (_, i) => {
          const delay = i / Math.max(1,bands - 1) * .32;
          const right = clamp((enter * 1.32 - delay));
          const left = clamp((leave * 1.32 - delay));
          return [Math.min(left,right) * 100, right * 100];
        });
        const points: string[] = [];
        edges.forEach(([left],i) => { points.push(`${left}% ${i/bands*100}%`,`${left}% ${(i+1)/bands*100}%`); });
        for(let i=bands-1;i>=0;i--) points.push(`${edges[i][1]}% ${(i+1)/bands*100}%`,`${edges[i][1]}% ${i/bands*100}%`);
        return `polygon(${points.join(',')})`;
      };
      const tick = () => {
        frame = 0;
        const vh = innerHeight;
        const phone = innerWidth <= 640;
        for(const el of active) {
          const r = el.getBoundingClientRect();
          // Phone content reaches full visibility sooner and never wipes out on exit.
          const distance = Math.min(vh * (phone ? .36 : .58), r.height * .65 + (phone ? 70 : 150));
          const enter = clamp((vh - r.top - 18) / Math.max(1,distance));
          const leave = phone ? 0 : clamp((130 - r.bottom) / Math.max(1,Math.min(r.height,180)));
          el.style.clipPath = enter === 1 && leave === 0 ? 'none' : mask(enter,leave,phone ? 4 : 6);
        }
      };
      const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); };
      const observer = new IntersectionObserver(entries => {
        for(const entry of entries) {
          if(entry.isIntersecting) active.add(entry.target as HTMLElement);
          else active.delete(entry.target as HTMLElement);
        }
        schedule();
      }, {rootMargin:'200px 0px'});
      const scan = () => {
        root.querySelectorAll<HTMLElement>('.photo-frame, .industry-photo, .gallery-grid button, .section h2, .inner-hero h1').forEach(el => {
          if(items.has(el) || el.closest('.hero-scroll-stage,[role="dialog"]')) return;
          items.add(el); el.dataset.stair = ''; observer.observe(el);
        });
      };
      scan();
      // New project results and service images receive the same treatment.
      const mutation = new MutationObserver(() => {
        for(const el of items) if(!el.isConnected) {observer.unobserve(el);items.delete(el);active.delete(el);}
        scan();schedule();
      });
      mutation.observe(root,{childList:true,subtree:true});
      const focus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        for(const el of items) if(el.contains(target)) {el.style.clipPath='none';active.delete(el);}
      };
      root.addEventListener('focusin',focus as EventListener);
      addEventListener('scroll',schedule,{passive:true});
      addEventListener('resize',schedule,{passive:true});
      document.addEventListener('visibilitychange',schedule);
      dispose = () => {
        cancelAnimationFrame(frame);observer.disconnect();mutation.disconnect();
        removeEventListener('scroll',schedule);removeEventListener('resize',schedule);
        document.removeEventListener('visibilitychange',schedule);
        root.removeEventListener('focusin',focus as EventListener);
        items.forEach(el=>{el.style.removeProperty('clip-path');delete el.dataset.stair;});
      };
    }
    mount();preference.addEventListener('change',mount);
    return () => {dispose();preference.removeEventListener('change',mount);};
  },[path]);
  return null;
}
