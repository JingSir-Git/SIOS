"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Initial position from bottom-right corner */
  initialOffset?: { bottom: number; right: number };
  /** Storage key for persisting position */
  storageKey?: string;
}

/**
 * Hook to make an element freely draggable.
 * Returns position style and event handlers to attach to the element.
 */
export function useDraggable(options: UseDraggableOptions = {}) {
  const { initialOffset = { bottom: 80, right: 16 }, storageKey } = options;

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Load persisted position
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.x !== undefined && parsed.y !== undefined) {
            setPosition(parsed);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    // Default: convert bottom/right offset to top/left
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - initialOffset.right - 48,
        y: window.innerHeight - initialOffset.bottom - 48,
      });
    }
  }, [storageKey, initialOffset.bottom, initialOffset.right]);

  // Save position on change
  useEffect(() => {
    if (storageKey && position && !isDragging) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch { /* ignore */ }
    }
  }, [position, isDragging, storageKey]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!position) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStartRef.current.posX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStartRef.current.posY + dy));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Detect if this was a click (minimal movement) vs drag
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      dragStartRef.current = null;
      // If moved more than 5px, it was a drag — suppress click
      return dx > 5 || dy > 5;
    }
    dragStartRef.current = null;
    return false;
  }, [isDragging]);

  const positionStyle: React.CSSProperties = position
    ? { position: "fixed", left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : { position: "fixed", bottom: initialOffset.bottom, right: initialOffset.right };

  return {
    position,
    isDragging,
    positionStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    elementRef,
  };
}
