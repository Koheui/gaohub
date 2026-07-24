"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

/**
 * ダッシュボードヘッダー等から公開LPを新規タブで開くボタン。
 * 下書き中はプレビューできない旨を示す(公開LPは published のみ表示されるため)。
 */
export function ViewPublicPageButton({ eventId }: { eventId: string }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "events", eventId), (snap) => {
      setSlug(snap.get("slug") ?? null);
      setStatus(snap.get("status") ?? null);
    });
  }, [eventId]);

  if (!slug) return null;

  if (status !== "published") {
    return (
      <span
        className="inline-flex cursor-not-allowed items-center justify-center rounded-full border-2 border-zinc-300 px-3.5 py-1.5 text-[11px] font-black text-zinc-400"
        title="イベントを公開すると確認できます"
      >
        公開ページ(未公開)
      </span>
    );
  }

  return (
    <a
      href={`/e/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-zinc-950 px-3.5 py-1.5 text-[11px] font-black tracking-tight text-zinc-950 whitespace-nowrap transition-colors hover:bg-zinc-950 hover:text-white shadow-sm"
    >
      公開ページを見る ↗
    </a>
  );
}
