"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";

interface Product {
  id: string;
  name: string;
  category: string;
  priceJpy: number;
  stock: number;
  imageUrl: string;
  description: string;
  isPublished: boolean;
}

export default function ShopDashboardPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      name: "小倉コーラ 原液シロップ (500ml)",
      category: "クラフトドリンク",
      priceJpy: 2800,
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      description: "山椒・レモングラス・地元ボタニカルを仕込んだ無添加クラフトコーラシロップ。",
      isPublished: true,
    },
    {
      id: "prod-2",
      name: "emolink 完成品物理NFCカード",
      category: "フィジカルNFC",
      priceJpy: 3080,
      stock: 120,
      imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      description: "高精細UVプリント仕上げ。スマホをかざすだけで想い出の動画・写真を即時再生。",
      isPublished: true,
    },
    {
      id: "prod-3",
      name: "WORK AND ROLE 公式限定Tシャツ",
      category: "アパレル・限定グッズ",
      priceJpy: 4500,
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      description: "Rock 'n' Roll マインドを体現する特注厚手オーガニックコットンTシャツ。",
      isPublished: false,
    },
  ]);

  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("2800");
  const [newProdCategory, setNewProdCategory] = useState("クラフトプロダクト");
  const [showAddModal, setShowAddModal] = useState(false);

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProdName.trim()) return;
    const item: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory,
      priceJpy: Number(newProdPrice) || 0,
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      description: "新規商品の説明文が入ります。",
      isPublished: true,
    };
    setProducts([item, ...products]);
    setNewProdName("");
    setShowAddModal(false);
    alert("新しいEC商品を登録しました！✨");
  }

  function togglePublish(id: string) {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p))
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>ECサイト・商品物販管理 📦</h1>
          <p className="mt-1 text-sm text-zinc-500">
            自社商品（小倉コーラ原液、emolinkカード、イベント限定グッズ等）の出品・在庫・受注管理を行います。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/u/oka"
            target="_blank"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-black text-zinc-900 shadow-sm transition-transform hover:scale-[1.02]"
          >
            ショップ公開画面を確認 ↗️
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-black text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            ➕ 新規商品を登録
          </button>
        </div>
      </div>

      {/* モーダル: 新規商品登録 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl space-y-5">
            <h2 className="text-lg font-black text-zinc-950">新規EC商品の追加 📦</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500">商品名 *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="例: 小倉コーラ原液シロップ 500ml"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-bold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500">販売価格 (円・税込)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500">カテゴリ</label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-950 px-5 py-2 text-xs font-black text-white hover:bg-zinc-800"
                >
                  登録を確定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 商品一覧 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">
                  {p.category}
                </span>
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    p.isPublished ? "bg-emerald-500 text-white" : "bg-zinc-400 text-white"
                  }`}
                >
                  {p.isPublished ? "公開中" : "非公開"}
                </span>
              </div>

              <h3 className="mt-4 text-base font-black text-zinc-950">{p.name}</h3>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400">価格</p>
                <p className="text-lg font-black text-zinc-950">¥{p.priceJpy.toLocaleString()}</p>
              </div>
              <button
                onClick={() => togglePublish(p.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                  p.isPublished
                    ? "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                    : "border-emerald-600 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                }`}
              >
                {p.isPublished ? "非公開にする" : "公開する"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
