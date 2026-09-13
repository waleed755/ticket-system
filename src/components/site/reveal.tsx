"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Lightweight scroll-reveal: fades/slides children in once they enter the
// viewport. IntersectionObserver handles the common smooth-scroll case, but
// a fast flick, an anchor-link jump, or scroll restoration can skip an
// element's viewport-crossing frame entirely and leave it permanently
// opacity:0 — so a throttled scroll/resize listener acts as a safety net,
// directly checking geometry rather than relying on intersection events.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "150px 0px -5% 0px" }
    );
    observer.observe(el);

    let ticking = false;
    const checkGeometry = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) reveal();
    };
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(checkGeometry);
    };

    checkGeometry();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible]);

  return (
    <div ref={ref} data-reveal data-visible={visible} style={{ transitionDelay: `${delay}ms` }} className={className}>
      {children}
    </div>
  );
}
