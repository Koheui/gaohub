"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";

export function CoverImageUploader({
  eventId,
  coverImageUrl,
}: {
  eventId: string;
  coverImageUrl: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadEventImage(eventId, file, "cover");
      await updateDoc(doc(db, "events", eventId), { coverImageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    await updateDoc(doc(db, "events", eventId), { coverImageUrl: null });
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">カバー画像(LPのヒーロー背景)</p>
      <p className="mt-0.5 text-xs text-zinc-400">
        推奨: 1920×1080以上の横長画像。未設定の場合はテーマカラーのデザイン背景を自動生成します
      </p>
      <div className="mt-3 flex items-center gap-4">
        <label className="relative block h-24 w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:border-zinc-400">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="カバー画像" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              {busy ? "アップロード中…" : "クリックして画像を選択"}
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {coverImageUrl && (
          <button
            onClick={handleRemove}
            className="text-sm text-zinc-500 underline hover:text-red-600"
          >
            削除
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
