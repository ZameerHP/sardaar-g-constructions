"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll() {
  const path = usePathname();

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let rafId = 0;
    let observer: MutationObserver | undefined;

    const updateNativeProgress = () => {
      const header = document.querySelector<HTMLElement>(".header");
      if (!header) return;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      header.style.setProperty("--page-progress", String(p));
    };

    const getHeaderOffset = () => {
      const header = document.querySelector<HTMLElement>(".header");
      return -(header?.getBoundingClientRect().height || 84);
    };

    const onAnchorClick = (e: MouseEvent) => {
      if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const rawHref = anchor.getAttribute("href") || "";
      if (rawHref.startsWith("#") && rawHref.length > 1) {
        const target = document.querySelector<HTMLElement>(rawHref);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: getHeaderOffset() });
        }
      }
    };

    const setup = () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      lenis?.destroy();
      lenis = undefined;
      window.removeEventListener("scroll", updateNativeProgress);
      document.removeEventListener("click", onAnchorClick);

      if (preference.matches) {
        updateNativeProgress();
        window.addEventListener("scroll", updateNativeProgress, { passive: true });
        return;
      }

      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.085,
        duration: 1.25,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
        syncTouch: false,
        prevent: (node: HTMLElement) =>
          !!node.closest(
            'textarea, [role="dialog"], [role="listbox"], [data-lenis-prevent]',
          ),
      });

      (window as any).__lenis = lenis;

      lenis.on("scroll", ({ progress }: { progress: number }) => {
        const header = document.querySelector<HTMLElement>(".header");
        if (header) {
          header.style.setProperty(
            "--page-progress",
            String(Math.min(1, Math.max(0, progress || 0))),
          );
        }
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      const syncLock = () => {
        const locked = !!document.querySelector(
          '[role="dialog"][data-state="open"], [data-scroll-locked]',
        );
        if (locked) lenis?.stop();
        else lenis?.start();
      };

      observer = new MutationObserver(syncLock);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state", "data-scroll-locked"],
      });

      document.addEventListener("click", onAnchorClick);
      syncLock();
      updateNativeProgress();
    };

    setup();
    preference.addEventListener("change", setup);

    return () => {
      preference.removeEventListener("change", setup);
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("scroll", updateNativeProgress);
      document.removeEventListener("click", onAnchorClick);
      lenis?.destroy();
      if ((window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
    };
  }, [path]);

  return null;
}
