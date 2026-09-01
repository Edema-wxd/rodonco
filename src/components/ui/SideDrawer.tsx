"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  DRAWER_BACKDROP_CLASS,
  DRAWER_CLOSE_MS,
  DRAWER_ROOT_CLASS,
  DRAWER_WIDTH_CLASS,
  drawerPanelClass,
} from "@/components/ui/drawerPanel";

export type SideDrawerProps = {
  /** Accessible name for the dialog. */
  label: string;
  /** Called once the close transition has finished — unmount or navigate here. */
  onClose: () => void;
  /** A node, or a render function receiving the animated `close` handler. */
  children: ReactNode | ((close: () => void) => ReactNode);
  widthClass?: string;
  zIndexClass?: string;
  backdropLabel?: string;
  /** The panel is already on screen (a skeleton held its place) — don't re-slide. */
  skipEnterAnimation?: boolean;
  /** Mobile swipe-to-dismiss. */
  dismissible?: boolean;
};

// Body scroll is locked while any drawer is open; counted so a drawer closing
// over another one doesn't hand scrolling back early.
let scrollLocks = 0;
let scrollLockPrevious = "";

export function SideDrawer({
  label,
  onClose,
  children,
  widthClass = DRAWER_WIDTH_CLASS,
  zIndexClass = "z-[70]",
  backdropLabel = "Close",
  skipEnterAnimation = false,
  dismissible = true,
}: SideDrawerProps) {
  const [state, setState] = useState<"open" | "closed">("open");
  const panelRef = useRef<HTMLElement | null>(null);
  const dragOriginY = useRef<number | null>(null);
  const isClosing = useRef(false);

  const close = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    setState("closed");
    window.setTimeout(onClose, DRAWER_CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (scrollLocks === 0) {
      scrollLockPrevious = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    scrollLocks += 1;
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = scrollLockPrevious;
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }, []);

  // Swipe-to-dismiss, bottom-sheet only. The breakpoint is read at the moment
  // of the gesture rather than held in state, so it is always current.
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(min-width: 640px)").matches) return;
    dragOriginY.current = event.clientY;
    panelRef.current?.setAttribute("data-dragging", "true");
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOriginY.current === null) return;
    const offset = Math.max(0, event.clientY - dragOriginY.current);
    panelRef.current?.style.setProperty("--drawer-drag", `${offset}px`);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOriginY.current === null) return;
    const offset = Math.max(0, event.clientY - dragOriginY.current);
    dragOriginY.current = null;
    panelRef.current?.removeAttribute("data-dragging");
    panelRef.current?.style.removeProperty("--drawer-drag");
    if (offset > 120) close();
  };

  const enter = skipEnterAnimation ? "skip" : undefined;

  return (
    <div className={`${DRAWER_ROOT_CLASS} ${zIndexClass}`}>
      <button
        type="button"
        aria-label={backdropLabel}
        className={DRAWER_BACKDROP_CLASS}
        data-state={state}
        data-enter={enter}
        onClick={close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`${drawerPanelClass(widthClass)} outline-none`}
        data-state={state}
        data-enter={enter}
      >
        {dismissible ? (
          <div
            aria-hidden="true"
            className="flex shrink-0 cursor-grab touch-none items-center justify-center pb-1 pt-3 active:cursor-grabbing sm:hidden"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="h-1 w-10 rounded-full bg-stone-300" />
          </div>
        ) : null}

        {typeof children === "function" ? children(close) : children}
      </aside>
    </div>
  );
}
