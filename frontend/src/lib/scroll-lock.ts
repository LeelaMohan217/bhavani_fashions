"use client";

// Stops the page behind an open sheet, popup or menu from scrolling. Counted, so two overlays open at
// once (a popup over a sheet) keep the page locked until both close. Pads the page by the scrollbar's
// width so content doesn't shift sideways when the scrollbar disappears.

/** The nearest scroll area inside `root` that can still move in this direction (down when dy > 0) */
function canScrollWithin(target: EventTarget | null, root: HTMLElement, dy: number) {
  for (let n = target as HTMLElement | null; n && n !== root.parentElement; n = n.parentElement) {
    const style = getComputedStyle(n);
    if (/(auto|scroll)/.test(style.overflowY) && n.scrollHeight > n.clientHeight + 1) {
      return dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0;
    }
    if (n === root) break;
  }
  return false;
}

/**
 * For fixed panels (sidebars, sheets): wheel and touch scrolling over the panel scroll the panel's
 * own list when it has room, and never the page behind it. Returns a cleanup function.
 */
export function keepScrollInside(root: HTMLElement): () => void {
  let lastY = 0;
  const onWheel = (e: WheelEvent) => {
    if (!canScrollWithin(e.target, root, e.deltaY)) e.preventDefault();
  };
  const onTouchStart = (e: TouchEvent) => {
    lastY = e.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    const y = e.touches[0]?.clientY ?? 0;
    const dy = lastY - y; // finger moving up scrolls down
    lastY = y;
    if (dy !== 0 && !canScrollWithin(e.target, root, dy)) e.preventDefault();
  };
  root.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("touchstart", onTouchStart, { passive: true });
  root.addEventListener("touchmove", onTouchMove, { passive: false });
  return () => {
    root.removeEventListener("wheel", onWheel);
    root.removeEventListener("touchstart", onTouchStart);
    root.removeEventListener("touchmove", onTouchMove);
  };
}

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

export function lockPageScroll(): () => void {
  const html = document.documentElement;
  if (locks === 0) {
    const scrollbar = window.innerWidth - html.clientWidth;
    saved = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
  }
  locks++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks--;
    if (locks === 0 && saved) {
      html.style.overflow = saved.overflow;
      html.style.paddingRight = saved.paddingRight;
      saved = null;
    }
  };
}
