"use client";

import { useState } from "react";
import { NewPostModal, type CreatedProductItem } from "@/components/sns/NewPostModal";
import { ui } from "@/lib/ui";

export default function PostsDashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");

  // 初期ダミー出品商品リスト (複数商品 ＆ カテゴリ分類)
  const [products, setProducts] = useState<CreatedProductItem[]>([
    {
      id: "prod-1",
      name: "小倉コーラ 原液シロップ (500mlパウチ)",
      category: "ドリンク・フード",
      priceJpy: 2800,
      stock: 12,
      description: "スパイシーなハーブと柑橘が織りなす小倉発のクラフトコーラ原液。",
      imageUrls: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80"],
      isDigital: false,
      createdAtText: "2026.07.22",
    },
    {
      id: "prod-2",
      name: "emolink 音楽想い出カード (5枚パック)",
      category: "フィジカルグッズ",
      priceJpy: 3500,
      stock: 45,
      description: "スマホをかざすだけで想い出の音楽や写真が蘇るNFC搭載コレクタブルカード。",
      imageUrls: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80"],
      isDigital: false,
      createdAtText: "2026.07.20",
    },
    {
      id: "prod-3",
      name: "Future Studio 公式オリジナルTシャツ (L)",
      category: "フィジカルグッズ",
      priceJpy: 4800,
      stock: 8,
      description: "ヘビーウェイトコットン100%のブラックロゴTシャツ。",
      imageUrls: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"],
      isDigital: false,
      createdAtText: "2026.07.18",
    },
  ]);

  const categories = ["すべて", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = selectedCategory === "すべて"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-6xl">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>EC商品出品 ＆ コミュニティ投稿管理</h1>
          <p className="mt-1 text-sm text-zinc-500">
            同一フォームから複数のEC商品出品（物販/デジタル）、写真・動画投稿、公式記事を登録・一覧管理します。
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          新規商品出品・投稿 🛍️➕
        </button>
      </div>

      {/* カテゴリフィルタ切り替えタブ */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs font-bold text-zinc-400">
          全 {filteredProducts.length} アイテム
        </span>
      </div>

      {/* 出品商品・アイテムグリッド一覧 */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrls[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-zinc-950/80 px-3 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                  {item.category}
                </span>
                {item.isDigital && (
                  <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2.5 py-0.5 font-mono text-[9px] font-bold text-white">
                    デジタル
                  </span>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-base font-black text-zinc-900 leading-snug">{item.name}</h3>
                <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-zinc-900">¥{item.priceJpy.toLocaleString("ja-JP")}</span>
                <span className="ml-1 text-[10px] text-zinc-400">(税込)</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                在庫 {item.stock} 点
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 新規投稿・マルチ出品モーダル */}
      <NewPostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(newProduct) => {
          if (newProduct) {
            setProducts((prev) => [newProduct, ...prev]);
          }
        }}
      />
    </div>
  );
}
