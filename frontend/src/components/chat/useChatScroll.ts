"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 120;

/**
 * Message-list scrolling that behaves like a messaging app:
 *  - a conversation opens at the newest message,
 *  - new messages are followed only if you're already near the bottom (or you
 *    sent it) — otherwise you stay where you are and get "New messages ↓",
 *  - read receipts / polling refreshes never move the list,
 *  - only the list scrolls, never the whole page,
 *  - it stays pinned to the bottom while images in the chat finish loading.
 *
 * `listRef` is a callback ref, so it also works when the list appears later
 * (e.g. after loading, or when a conversation is picked).
 */
export function useChatScroll(threadKey: string, lastId: string | undefined, lastIsMine: boolean) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const listRef = useCallback((node: HTMLDivElement | null) => setEl(node), []);
  const elRef = useRef<HTMLDivElement | null>(null);
  elRef.current = el;
  const atBottom = useRef(true);
  const opened = useRef<{ el: HTMLDivElement; thread: string } | null>(null);
  const seenLast = useRef<string | undefined>(undefined);
  const [hasNew, setHasNew] = useState(false);

  const toBottom = useCallback((smooth = false) => {
    const node = elRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    atBottom.current = true;
    setHasNew(false);
  }, []);

  // Remember whether the reader is at the bottom; keep them there as content grows.
  useEffect(() => {
    if (!el) return;
    const onScroll = () => {
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      if (atBottom.current) setHasNew(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const resize = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    const watchChildren = () => {
      resize.disconnect();
      resize.observe(el);
      Array.from(el.children).forEach((child) => resize.observe(child));
    };
    watchChildren();
    const mutations = new MutationObserver(watchChildren);
    mutations.observe(el, { childList: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [el]);

  useLayoutEffect(() => {
    if (!el) return;
    if (opened.current?.el !== el || opened.current.thread !== threadKey) {
      // A conversation just appeared or was switched: start at the newest message.
      opened.current = { el, thread: threadKey };
      seenLast.current = lastId;
      toBottom(false);
      return;
    }
    if (!lastId || seenLast.current === lastId) return; // nothing new
    seenLast.current = lastId;
    if (atBottom.current || lastIsMine) toBottom(true);
    else setHasNew(true);
  }, [el, threadKey, lastId, lastIsMine, toBottom]);

  return { listRef, hasNew, toBottom };
}
