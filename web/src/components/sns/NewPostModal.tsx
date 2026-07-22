"use client";

import { useState } from "react";

export type PostType = "text" | "article" | "product";

export interface CreatedProductItem {
  id: string;
  name: string;
  category: string;
  priceJpy: number;
  stock: number;
  description: string;
  imageUrls: string[];
  isDigital: boolean;
  createdAtText: string;
}

export function NewPostModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (product?: CreatedProductItem) => void;
}) {
  const [postType, setPostType] = useState<PostType>("product"); // デフォルト: EC商品出品
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ドリンク・フード");
  const [customCategory, setCustomCategory] = useState("");
  const [priceJpy, setPriceJpy] = useState<number | "">(2800);
  const [productStock, setProductStock] = useState<number | "">(20);
  const [isDigital, setIsDigital] = useState(false);
  
  // 写真・動画プレビュー用
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
      const finalCategory = category === "その他 (新規作成)" ? (customCategory || "一般商品") : category;
      
      const newProduct: CreatedProductItem = {
        id: `prod-${Date.now()}`,
        name: title || "新規商品",
        category: finalCategory,
        priceJpy: Number(priceJpy) || 1000,
        stock: Number(productStock) || 1,
        description: content,
        imageUrls: mediaFiles.map((m) => m.url).length > 0
          ? mediaFiles.map((m) => m.url)
          : ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80"],
        isDigital,
        createdAtText: "2026.07.22",
      };

      console.log("[NewPostModal] Created new EC product:", newProduct);

      alert(`✅ 出品完了: 「${newProduct.name}」(カテゴリ: ${newProduct.category}, ¥${newProduct.priceJpy.toLocaleString("ja-JP")}) を登録しました！`);
      
      if (onCreated) onCreated(newProduct);
      onClose();
    } catch (err) {
      alert("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-black tracking-tight">新規投稿 ＆ EC商品・マルチ出品</h2>
            <p className="mt-1 text-xs text-zinc-400">同じフォームから写真・記事・複数EC商品を出品できます。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 投稿タイプ切り替えタブ */}
        <div className="mt-5 flex gap-2 rounded-xl bg-zinc-900 p-1.5 border border-zinc-800">
          <button
            type="button"
            onClick={() => setPostType("product")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-black transition-colors ${
              postType === "product" ? "bg-emerald-500 text-white shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            🛍️ EC商品出品 (物販/デジタル)
          </button>
          <button
            type="button"
            onClick={() => setPostType("text")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-black transition-colors ${
              postType === "text" ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            📷 写真・動画投稿
          </button>
          <button
            type="button"
            onClick={() => setPostType("article")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-black transition-colors ${
              postType === "article" ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            📖 公式ジャーナル/記事
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {/* EC商品タイトル ＆ カテゴリ設定 */}
          {postType === "product" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-zinc-400">商品名 (例: 小倉コーラ 500mlパウチ)</label>
                <input
                  type="text"
                  required
                  placeholder="例: 小倉コーラ 原液シロップ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400">商品カテゴリ (分類)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white font-bold focus:border-emerald-400 focus:outline-none"
                >
                  <option value="ドリンク・フード">ドリンク・フード (小倉コーラ等)</option>
                  <option value="フィジカルグッズ">フィジカルグッズ (emolinkカード/Tシャツ)</option>
                  <option value="書籍・ZINE">書籍・ZINE・出版物</option>
                  <option value="デジタルコンテンツ">デジタルコンテンツ・教材</option>
                  <option value="その他 (新規作成)">その他 (カテゴリ新規作成)</option>
                </select>
              </div>

              {category === "その他 (新規作成)" && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400">新規カテゴリ名を入力</label>
                  <input
                    type="text"
                    required
                    placeholder="例: クラフトアパレル"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 記事タイトル (ジャーナルの場合) */}
          {postType === "article" && (
            <div>
              <label className="text-xs font-bold text-zinc-400">記事タイトル</label>
              <input
                type="text"
                required
                placeholder="例: イベント集客を成功させる5つの秘訣"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}

          {/* 本文 / 商品説明 */}
          <div>
            <label className="text-xs font-bold text-zinc-400">
              {postType === "product" ? "商品説明・こだわり・原材料" : postType === "text" ? "投稿本文" : "記事本文"}
            </label>
            <textarea
              required
              rows={4}
              placeholder={postType === "product" ? "例: スパイシーなハーブと柑橘が織りなす極上のクラフトコーラ原液。炭酸水で4倍に割ってお召し上がりください。" : "文章を入力してください…"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* 価格 ＆ 在庫 ＆ 配送形態 (EC商品の場合) */}
          {postType === "product" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">販売価格 (¥ JPY 税込)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    placeholder="2800"
                    value={priceJpy}
                    onChange={(e) => setPriceJpy(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-emerald-400 placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400">初期在庫数 (点)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="digitalCheck"
                  checked={isDigital}
                  onChange={(e) => setIsDigital(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="digitalCheck" className="text-xs font-bold text-zinc-300">
                  デジタルコンテンツ・ダウンロード販売 (物理配送不要)
                </label>
              </div>
            </div>
          )}

          {/* 写真 ＆ 動画アップローダー (複数枚対応) */}
          <div>
            <label className="text-xs font-bold text-zinc-400">
              {postType === "product" ? "商品写真 (複数枚追加可能)" : "添付メディア (写真/動画)"}
            </label>
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

              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 transition-colors hover:border-emerald-400 hover:bg-zinc-900 hover:text-white">
                <span className="text-2xl">➕</span>
                <span className="mt-1 text-[10px] font-bold">写真を選択</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
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
              className="rounded-xl bg-emerald-500 px-7 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "出品中…" : postType === "product" ? "商品を出品する 🛒" : "投稿・公開する 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
