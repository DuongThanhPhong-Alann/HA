"use client";

import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";

const motes = [
  [7, 18, 9, 0], [16, 72, 12, -4], [25, 43, 8, -7], [37, 86, 11, -2],
  [48, 12, 7, -9], [58, 62, 10, -5], [69, 30, 8, -1], [79, 79, 12, -8],
  [89, 48, 7, -3], [95, 15, 9, -6], [43, 54, 6, -10], [12, 93, 8, -11],
];

export function GlobalEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const updateScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available = document.documentElement.scrollHeight - window.innerHeight;
        root.style.setProperty("--scroll-progress", String(available > 0 ? window.scrollY / available : 0));
      });
    };

    const updatePointer = (event: PointerEvent) => {
      if (reduceMotion || event.pointerType === "touch") return;
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);

      const card = (event.target as Element | null)?.closest<HTMLElement>(".card:not(.auth-card)");
      document.querySelectorAll<HTMLElement>(".fx-tilt-active").forEach((item) => {
        if (item !== card) item.classList.remove("fx-tilt-active");
      });
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--tilt-x", `${(0.5 - y) * 4}deg`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
      card.style.setProperty("--shine-x", `${x * 100}%`);
      card.style.setProperty("--shine-y", `${y * 100}%`);
      card.classList.add("fx-tilt-active");
    };

    const clearTilt = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>(".card");
      if (card && !card.contains(event.relatedTarget as Node | null)) card.classList.remove("fx-tilt-active");
    };

    const addRipple = (event: PointerEvent) => {
      if (reduceMotion) return;
      const target = (event.target as Element | null)?.closest<HTMLElement>(".btn, .history-detail-link");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "fx-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerout", clearTilt, { passive: true });
    window.addEventListener("pointerdown", addRipple, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerout", clearTilt);
      window.removeEventListener("pointerdown", addRipple);
    };
  }, []);

  return <div className="global-effects" aria-hidden="true">
    <span key={pathname} className="route-progress" />
    <span className="scroll-progress" />
    <span className="pointer-aura" />
    <span className="ambient-aurora ambient-aurora--one" />
    <span className="ambient-aurora ambient-aurora--two" />
    <div className="ambient-motes">
      {motes.map(([x, y, size, delay], index) => <i key={index} style={{ "--mote-x": `${x}%`, "--mote-y": `${y}%`, "--mote-size": `${size}px`, "--mote-delay": `${delay}s` } as CSSProperties}/>) }
    </div>
  </div>;
}
