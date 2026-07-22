"use client";

import { useState } from "react";
import { ui } from "@/lib/ui";

export type PostType = "text" | "article" | "product";

export function NewPostModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [priceJpy, setPriceJpy] = useState<number | "">("");
  const [productStock, setProductStock] = useState<number | "">(10);
  
  // 写真・動画ローカルプレビュー用
  const [mediaFiles, setMediaFiles] = useState<{ file: File; url: string; type: "image" | "video" }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedia = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
    }));

    setMediaFiles((prev) => [...prev, ...newMedia]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 現段階ではガワ先行のため、ダミー作成またはローカル保存
      // 将来的に Cloudflare R2 / API / Firestore へ保存
      console.log("[NewPost] Created dummy post:", {
        type: postType,
        title,
        content,
        priceJpy,
        productStock,
        mediaCount: mediaFiles.length,
      });

      alert("投稿を作成しました！（現在はUI先行プレビューモードです）");
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-zinc-900 bg-zinc-950 p-6 text-white shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-black tracking-tight">新規SNS投稿・EC出品</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 投稿タイプ切り替えタブ */}
        <div className="mt-4 flex gap-2 rounded-xl bg-zinc-900 p-1.5">
          <button
            type="button"
            onClick={() => setPostType("text")}
            className={`flex-1 rounded-lg py-2 text-xs font-black transition-colors ${
              postType === "text" ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            📷 写真・動画投稿
          </button>
          <button
            type="button"
            onClick={() => setPostType("article")}
            className={`flex-1 rounded-lg py-2 text-xs font-black transition-colors ${
              postType === "article" ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            📖 有料ノウハウ記事
          </button>
          <button
            type="button"
            onClick={() => setPostType("product")}
            className={`flex-1 rounded-lg py-2 text-xs font-black transition-colors ${
              postType === "product" ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            🛍️ EC物販アイテム
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* タイトル (記事または商品の場合) */}
          {postType !== "text" && (
            <div>
              <label className="text-xs font-bold text-zinc-400">
                {postType === "article" ? "記事タイトル" : "商品名 (小倉コーラ / 限定グッズ等)"}
              </label>
              <input
                type="text"
                required
                placeholder={postType === "article" ? "例: イベント集客を成功させる5つの秘訣" : "例: 小倉コーラ原液 500mlパウチ"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          {/* 本文 / 説明 */}
          <div>
            <label className="text-xs font-bold text-zinc-400">
              {postType === "text" ? "投稿本文 (写真や動画を添えて投稿)" : "説明・詳細文章"}
            </label>
            <textarea
              required
              rows={4}
              placeholder="何をお考えですか？日常の思考や現場の写真、動画を共有しましょう…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* 価格 ＆ 在庫 (有料記事またはEC商品の場合) */}
          {postType !== "text" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400">販売価格 (¥ JPY)</label>
                <input
                  type="number"
                  required
                  min={100}
                  placeholder="300"
                  value={priceJpy}
                  onChange={(e) => setPriceJpy(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
              {postType === "product" && (
                <div>
                  <label className="text-xs font-bold text-zinc-400">初期在庫数</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 写真 ＆ 動画アップローダー (ガワ・プレビューエリア) */}
          <div>
            <label className="text-xs font-bold text-zinc-400">写真・動画メディア (R2接続予定)</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {mediaFiles.map((m, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
                  {m.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={m.url} className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 transition-colors hover:border-amber-400 hover:bg-zinc-900 hover:text-white">
                <span className="text-2xl">➕</span>
                <span className="mt-1 text-[10px] font-bold">写真 / 動画</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              ※ MP4, WebM, PNG, JPEG, WebP 画像および動画に対応（プレビュー機能）
            </p>
          </div>

          {/* 送信ボタン */}
          <div className="mt-4 flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-bold text-zinc-400 hover:bg-zinc-900"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-zinc-950 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "投稿中…" : "投稿・出品する 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
