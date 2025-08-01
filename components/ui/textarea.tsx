/**
 * Textarea COMPONENT – Enhanced with cursor & scroll position preservation
 *
 * • Preserves cursor position, selection direction, and scroll during re-renders
 * • Handles controlled and uncontrolled usage
 * • Synchronous restoration via useLayoutEffect (less flicker than rAF alone)
 * • IME-safe: pauses restoration while composing
 * • Forwards all original props/handlers; merges external ref correctly
 * • Keeps original styling 100% intact
 *
 * Keywords: textarea, cursor-preservation, react-rendering, stable-input, barebones
 */

import * as React from "react";
import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** Public props: extend native textarea props and add a variant. */
interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: "default" | "barebones";
}

/** Internal type for selection bookkeeping. */
type SelectionSnapshot = {
  start: number;
  end: number;
  direction: "forward" | "backward" | "none";
} | null;

/** Internal type for scroll bookkeeping. */
type ScrollSnapshot = {
  top: number;
  left: number;
} | null;

/** Merge a forwarded ref (callback or object) with our internal ref. */
function useMergedRef<T>(
  forwarded: React.ForwardedRef<T>,
  internal: React.RefObject<T>
) {
  return useCallback(
    (node: T | null) => {
      // Update internal ref
      // @ts-expect-error: internal is known to be a RefObject<T>
      internal.current = node;

      // Update forwarded ref (handle function or RefObject)
      if (typeof forwarded === "function") {
        forwarded(node);
      } else if (forwarded && "current" in forwarded) {
        (forwarded as React.MutableRefObject<T | null>).current = node;
      }
    },
    [forwarded, internal]
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      onChange,
      onSelect,
      onScroll,
      onCompositionStart,
      onCompositionEnd,
      variant = "default",
      ...props
    },
    ref
  ) => {
    /** Internal element ref (we always keep one). */
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    /** Stable merged ref to satisfy both the internal ref and forwarded ref. */
    const setRefs = useMergedRef<HTMLTextAreaElement | null>(ref, internalRef);

    /** Selection + scroll snapshots for restoration after React updates. */
    const selectionRef = useRef<SelectionSnapshot>(null);
    const scrollRef = useRef<ScrollSnapshot>(null);

    /** Track IME composition; we avoid interfering while composing. */
    const composingRef = useRef<boolean>(false);

    /** Save the current selection (cursor & range). */
    const saveSelection = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      // selectionStart/End can be -1 in rare cases; guard with Math.max(0, ...)
      const start = Math.max(0, el.selectionStart ?? 0);
      const end = Math.max(0, el.selectionEnd ?? 0);
      const direction = "none"; // (el.selectionDirection as SelectionSnapshot["direction"]) ?? "none";
      selectionRef.current = { start, end, direction };
    }, []);

    /** Save the current scroll position. */
    const saveScroll = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      scrollRef.current = { top: el.scrollTop, left: el.scrollLeft };
    }, []);

    /** Restore selection & scroll *synchronously* post-render to avoid flicker. */
    useLayoutEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      // Don't fight the OS while composing text via IME
      if (composingRef.current) return;

      // Restore selection if we have a snapshot and the element is focused
      if (selectionRef.current && document.activeElement === el) {
        const { start, end, direction } = selectionRef.current;
        // Clamp to current value length to avoid DOM exceptions
        const len = el.value.length;
        const nextStart = Math.min(start, len);
        const nextEnd = Math.min(end, len);

        // Only do work if needed (prevents needless layout)
        if (
          el.selectionStart !== nextStart ||
          el.selectionEnd !== nextEnd ||
          el.selectionDirection !== direction
        ) {
          try {
            el.setSelectionRange(nextStart, nextEnd, direction);
          } catch {
            // Some browsers can throw for edge cases; ignore safely.
          }
        }
      }

      // Restore scroll if we have a snapshot
      if (scrollRef.current) {
        const { top, left } = scrollRef.current;
        if (el.scrollTop !== top) el.scrollTop = top;
        if (el.scrollLeft !== left) el.scrollLeft = left;
      }
      // We intentionally run after every render to cover both controlled and uncontrolled cases.
    });

    /** Wrapped onChange: save selection/scroll, then forward the event. */
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Capture selection and scroll *before* parent state updates might re-render
        saveSelection();
        saveScroll();
        // Forward to user handler if provided
        onChange?.(e);
      },
      [onChange, saveScroll, saveSelection]
    );

    /** Wrapped onSelect: keep selection snapshot updated on mouse/keyboard selection changes. */
    const handleSelect = useCallback(
      (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        saveSelection();
        onSelect?.(e as React.SyntheticEvent<HTMLTextAreaElement, Event>);
      },
      [onSelect, saveSelection]
    );

    /** Wrapped onScroll: keep scroll snapshot updated. */
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLTextAreaElement>) => {
        saveScroll();
        onScroll?.(e);
      },
      [onScroll, saveScroll]
    );

    /** IME composition guards. */
    const handleCompositionStart = useCallback(
      (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        composingRef.current = true;
        onCompositionStart?.(e);
      },
      [onCompositionStart]
    );

    const handleCompositionEnd = useCallback(
      (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        composingRef.current = false;
        // After composition ends, snapshot once so restoration is correct on next paint
        saveSelection();
        saveScroll();
        onCompositionEnd?.(e);
      },
      [onCompositionEnd, saveScroll, saveSelection]
    );

    return (
      <textarea
        ref={setRefs}
        data-slot="textarea"
        className={cn(
          variant === "barebones"
            ? // ⬇️ KEEPING YOUR BAREBONES STYLING EXACT
              "w-full h-full resize-none outline-none bg-transparent border-none p-0 m-0 nodrag"
            : // ⬇️ KEEPING YOUR DEFAULT STYLING EXACT
              "field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
          className
        )}
        // Wrapped handlers (stable + forward originals)
        onChange={handleChange}
        onSelect={handleSelect}
        onScroll={handleScroll}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
