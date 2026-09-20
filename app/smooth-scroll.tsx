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
    let observer: MutationObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      lenis?.destroy();
      if (preference.matches) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -100 },
        prevent: (node) =>
          !!node.closest(
            '[role="dialog"],[role="listbox"],[data-lenis-prevent]',
          ),
      });
      const sync = () => {
        if (
          document.querySelector(
            '[role="dialog"][data-state="open"],[data-scroll-locked]',
          )
        )
          lenis?.stop();
        else lenis?.start();
      };
      observer = new MutationObserver(sync);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state", "data-scroll-locked"],
      });
      sync();
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      preference.removeEventListener("change", setup);
      observer?.disconnect();
      lenis?.destroy();
    };
  }, [path]);
  return null;
}
