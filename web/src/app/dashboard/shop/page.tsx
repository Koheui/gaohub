"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  ShopProduct,
  ShopCategory,
  ShopCoupon,
  ShopOrder,
  OrderFulfillmentStatus,
} from "@/lib/types";
import { ui } from "@/lib/ui";

type TabType = "products" | "categories" | "stock" | "coupons" | "shipping" | "orders";

export default function ShopDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // 5. 送料・配送設定データ
  const [shippingConfig, setShippingConfig] = useState({
    flatShippingJpy: 500,
    freeShippingThresholdJpy: 5000,
    carrierName: "ヤマト運輸 / 宅急便・ネコポス",
    leadTimeText: "ご注文完了後 2〜3 営業日以内に発送いたします",
    isFreeShippingEnabled: true,
  });

  const [savedShippingNotice, setSavedShippingNotice] = useState(false);

  // 1. 初期アイテムデータ
  const [products, setProducts] = useState<ShopProduct[]>([
    {
      id: "prod-1",
      name: "小倉コーラ 原液シロップ (500ml)",
      categoryId: "cat-1",
      categoryName: "クラフトドリンク",
      priceJpy: 2800,
      stock: 45,
      imageUrl:
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      description: "山椒・レモングラス・地元ボタニカルを仕込んだ無添加クラフトコーラシロップ。",
      isPublished: true,
    },
    {
      id: "prod-2",
      name: "emolink 完成品物理NFCカード",
      categoryId: "cat-2",
      categoryName: "フィジカルNFC",
      priceJpy: 3080,
      stock: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      description: "高精細UVプリント仕上げ。スマホをかざすだけで想い出の動画・写真を即時再生。",
      isPublished: true,
    },
    {
      id: "prod-3",
      name: "WORK AND ROLE 公式限定Tシャツ",
      categoryId: "cat-3",
      categoryName: "アパレル",
      priceJpy: 4500,
      stock: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      description: "Rock 'n' Roll マインドを体現する特注厚手オーガニックコットンTシャツ。",
      isPublished: true,
    },
  ]);

  // 2. 初期カテゴリデータ
  const [categories, setCategories] = useState<ShopCategory[]>([
    { id: "cat-1", name: "クラフトドリンク", slug: "craft-drinks", itemCount: 1 },
    { id: "cat-2", name: "フィジカルNFC", slug: "nfc-cards", itemCount: 1 },
    { id: "cat-3", name: "アパレル", slug: "apparel", itemCount: 1 },
    { id: "cat-4", name: "デジタルコンテンツ", slug: "digital", itemCount: 0 },
  ]);

  // 3. 初期クーポンデータ
  const [coupons, setCoupons] = useState<ShopCoupon[]>([
    {
      id: "c-1",
      code: "SPECIAL10",
      type: "percent",
      discountValue: 10,
      minOrderJpy: 2000,
      isActive: true,
      expiresAtText: "2026.12.31",
    },
    {
      id: "c-2",
      code: "SUMMER500",
      type: "fixed",
      discountValue: 500,
      minOrderJpy: 3000,
      isActive: true,
      expiresAtText: "2026.08.31",
    },
  ]);

  // 4. 初期受注データ
  const [orders, setOrders] = useState<ShopOrder[]>([
    {
      id: "ord-1001",
      customerName: "山田 太郎",
      customerEmail: "yamada.t@example.com",
      customerPhone: "090-1234-5678",
      postalCode: "100-0001",
      prefecture: "東京都",
      cityAddress: "千代田区千代田1-1",
      buildingName: "丸の内ビル 501号室",
      items: [
        { productId: "prod-1", productName: "小倉コーラ 原液シロップ (500ml)", priceJpy: 2800, quantity: 2 },
      ],
      subtotalJpy: 5600,
      couponCode: "SPECIAL10",
      discountJpy: 560,
      shippingJpy: 500,
      totalJpy: 5540,
      fulfillmentStatus: "unfulfilled",
      createdAtIso: "2026-07-22 14:30",
    },
  ]);

  // モーダル状態
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percent" | "fixed">("percent");
  const [newCouponValue, setNewCouponValue] = useState("10");

  // --- アイテム追加/保存 ---
  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    const cat = categories.find((c) => c.id === editingProduct.categoryId);
    const itemToSave: ShopProduct = {
      ...editingProduct,
      categoryName: cat?.name ?? "未分類",
    };

    if (products.some((p) => p.id === itemToSave.id)) {
      setProducts(products.map((p) => (p.id === itemToSave.id ? itemToSave : p)));
    } else {
      setProducts([itemToSave, ...products]);
    }
    setShowItemModal(false);
    setEditingProduct(null);
  }

  // --- カテゴリ追加 ---
  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const item: ShopCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, "-"),
      itemCount: 0,
    };
    setCategories([...categories, item]);
    setNewCatName("");
    setShowCatModal(false);
  }

  // --- クーポン追加 ---
  function handleAddCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const item: ShopCoupon = {
      id: `c-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      type: newCouponType,
      discountValue: Number(newCouponValue) || 0,
      minOrderJpy: 0,
      isActive: true,
    };
    setCoupons([item, ...coupons]);
    setNewCouponCode("");
    setShowCouponModal(false);
  }

  // --- 発送ステータス切り替え ---
  function toggleFulfillment(orderId: string) {
    setOrders(
      orders.map((o) => {
        if (o.id !== orderId) return o;
        const next: OrderFulfillmentStatus =
          o.fulfillmentStatus === "unfulfilled" ? "fulfilled" : "unfulfilled";
        return { ...o, fulfillmentStatus: next };
      })
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* 画面ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>ネットショップダッシュボード 📦</h1>
          <p className="mt-1 text-sm text-zinc-500">
            STORES準拠。アイテム登録、カテゴリ、リアルタイム在庫、クーポン設定、受注配送管理を一元化します。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/u/oka"
            target="_blank"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-black text-zinc-900 shadow-sm transition-transform hover:scale-[1.02]"
          >
            ストア公開画面を確認 ↗️
          </Link>
        </div>
      </div>

      {/* 🏛️ STORES風 機能グリッド・ナビゲーションタブ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { id: "products", label: "アイテム", icon: "👕", count: products.length },
          { id: "categories", label: "カテゴリ", icon: "📖", count: categories.length },
          { id: "stock", label: "在庫", icon: "📦", count: products.reduce((acc, p) => acc + p.stock, 0) },
          { id: "coupons", label: "クーポン", icon: "🎟️", count: coupons.filter((c) => c.isActive).length },
          { id: "shipping", label: "送料・配送", icon: "🚚", count: `¥${shippingConfig.flatShippingJpy}` },
          { id: "orders", label: "オーダー", icon: "🛒", count: orders.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all ${
              activeTab === tab.id
                ? "border-zinc-950 bg-white shadow-md"
                : "border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-400"
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="mt-1.5 text-xs font-black text-zinc-950">{tab.label}</span>
            <span className="mt-0.5 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── 1. アイテムタブ ─── */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-zinc-950">登録アイテム一覧</h2>
            <button
              onClick={() => {
                setEditingProduct({
                  id: `prod-${Date.now()}`,
                  name: "",
                  categoryId: categories[0]?.id ?? "",
                  categoryName: categories[0]?.name ?? "",
                  priceJpy: 2800,
                  stock: 50,
                  imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
                  description: "",
                  isPublished: true,
                });
                setShowItemModal(true);
              }}
              className="rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-zinc-800"
            >
              ➕ アイテムを追加
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">
                      {p.categoryName}
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
                    <p className="text-[10px] font-bold text-zinc-400">価格 / 在庫</p>
                    <p className="text-base font-black text-zinc-950">
                      ¥{p.priceJpy.toLocaleString()} <span className="text-xs text-zinc-500 font-normal">({p.stock}個)</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setShowItemModal(true);
                    }}
                    className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100"
                  >
                    編集 ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2. カテゴリタブ ─── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-zinc-950">カテゴリ設定</h2>
            <button
              onClick={() => setShowCatModal(true)}
              className="rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-zinc-800"
            >
              ➕ カテゴリを追加
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase text-zinc-500">
                <tr>
                  <th className="p-4">カテゴリ名</th>
                  <th className="p-4">スラッグ</th>
                  <th className="p-4">登録アイテム数</th>
                  <th className="p-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-zinc-50/50">
                      <td className="p-4 font-bold text-zinc-950">{cat.name}</td>
                      <td className="p-4 font-mono text-zinc-500">{cat.slug}</td>
                      <td className="p-4 font-bold">{count} 個</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
                          className="text-rose-600 hover:underline"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 3. 在庫管理タブ ─── */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-zinc-950">リアルタイム在庫管理</h2>
          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold uppercase text-zinc-500">
                <tr>
                  <th className="p-4">アイテム名</th>
                  <th className="p-4">カテゴリ</th>
                  <th className="p-4">現在在庫数</th>
                  <th className="p-4">ステータス</th>
                  <th className="p-4 text-right">在庫数変更</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50">
                    <td className="p-4 font-bold text-zinc-950">{p.name}</td>
                    <td className="p-4 text-zinc-500">{p.categoryName}</td>
                    <td className="p-4 font-mono text-sm font-black">{p.stock}</td>
                    <td className="p-4">
                      {p.stock <= 0 ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-800">
                          売り切れ
                        </span>
                      ) : p.stock < 10 ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                          残りわずか
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                          在庫あり
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() =>
                            setProducts(
                              products.map((item) =>
                                item.id === p.id ? { ...item, stock: Math.max(0, item.stock - 5) } : item
                              )
                            )
                          }
                          className="rounded-lg border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
                        >
                          -5
                        </button>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProducts(
                              products.map((item) => (item.id === p.id ? { ...item, stock: val } : item))
                            );
                          }}
                          className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-center font-bold"
                        />
                        <button
                          onClick={() =>
                            setProducts(
                              products.map((item) =>
                                item.id === p.id ? { ...item, stock: item.stock + 10 } : item
                              )
                            )
                          }
                          className="rounded-lg border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 4. クーポンタブ ─── */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-zinc-950">割引クーポン設定</h2>
            <button
              onClick={() => setShowCouponModal(true)}
              className="rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-zinc-800"
            >
              ➕ クーポンを発行
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm"
              >
                <div>
                  <span className="rounded-md bg-amber-600 px-2.5 py-1 font-mono text-xs font-black text-white">
                    {c.code}
                  </span>
                  <p className="mt-3 text-lg font-black text-zinc-950">
                    {c.type === "percent" ? `${c.discountValue}% OFF` : `¥${c.discountValue.toLocaleString()} 引き`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {c.minOrderJpy > 0 ? `¥${c.minOrderJpy.toLocaleString()}以上の購入で適用` : "条件なし"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCoupons(coupons.map((item) => (item.id === c.id ? { ...item, isActive: !item.isActive } : item)))
                  }
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${
                    c.isActive ? "border-amber-600 bg-white text-amber-900" : "border-zinc-300 bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {c.isActive ? "有効中 ✓" : "無効"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. 送料・配送設定タブ ─── */}
      {activeTab === "shipping" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-zinc-950">🚚 送料・配送設定</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                全国一律の送料金額、条件付き送料無料ライン、配送手段と発送目安日数を指定します。
              </p>
            </div>
            {savedShippingNotice && (
              <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                ✓ 設定を保存しました
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSavedShippingNotice(true);
              setTimeout(() => setSavedShippingNotice(false), 3000);
            }}
            className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm space-y-6 text-xs"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-bold text-zinc-900">全国一律配送料 (税込)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-zinc-400">¥</span>
                  <input
                    type="number"
                    required
                    value={shippingConfig.flatShippingJpy}
                    onChange={(e) =>
                      setShippingConfig({
                        ...shippingConfig,
                        flatShippingJpy: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-300 pl-8 pr-3.5 py-2 font-mono font-bold text-zinc-900 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  通常配送の基本送料金額です。カートの合計計算に自動適用されます。
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-900">送料無料ライン (まとめ買い特典)</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-zinc-600">
                    <input
                      type="checkbox"
                      checked={shippingConfig.isFreeShippingEnabled}
                      onChange={(e) =>
                        setShippingConfig({
                          ...shippingConfig,
                          isFreeShippingEnabled: e.target.checked,
                        })
                      }
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>有効化</span>
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-zinc-400">¥</span>
                  <input
                    type="number"
                    disabled={!shippingConfig.isFreeShippingEnabled}
                    value={shippingConfig.freeShippingThresholdJpy}
                    onChange={(e) =>
                      setShippingConfig({
                        ...shippingConfig,
                        freeShippingThresholdJpy: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-300 pl-8 pr-3.5 py-2 font-mono font-bold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {shippingConfig.isFreeShippingEnabled
                    ? `小計が ¥${shippingConfig.freeShippingThresholdJpy.toLocaleString()} 以上で自動的に配送料が無料になります。`
                    : "まとめ買い送料無料ラインは無効です。"}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-bold text-zinc-900">配送業者・配送手段</label>
                <input
                  type="text"
                  required
                  value={shippingConfig.carrierName}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      carrierName: e.target.value,
                    })
                  }
                  placeholder="例: ヤマト運輸 / 宅急便・ネコポス"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold text-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-zinc-900">発送目安日数メッセージ</label>
                <input
                  type="text"
                  required
                  value={shippingConfig.leadTimeText}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      leadTimeText: e.target.value,
                    })
                  }
                  placeholder="例: ご注文完了後 2〜3 営業日以内に発送いたします"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold text-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-zinc-800"
              >
                送料設定を保存する 💾
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── 6. オーダー・受注管理タブ ─── */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-zinc-950">受注入荷・配送先一覧</h2>
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-zinc-950">#{o.id}</span>
                    <span className="text-xs font-bold text-zinc-400">{o.createdAtIso}</span>
                  </div>
                  <button
                    onClick={() => toggleFulfillment(o.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-black transition-transform hover:scale-[1.02] ${
                      o.fulfillmentStatus === "fulfilled"
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {o.fulfillmentStatus === "fulfilled" ? "✓ 発送完了" : "未発送 (発送する)"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <p className="font-bold text-zinc-400">購入者様情報</p>
                    <p className="mt-1 font-black text-zinc-900 text-sm">{o.customerName} 様</p>
                    <p className="text-zinc-600">{o.customerEmail}</p>
                    <p className="text-zinc-600">{o.customerPhone}</p>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-400">🚚 配送先住所</p>
                    <p className="mt-1 font-bold text-zinc-900">〒{o.postalCode}</p>
                    <p className="text-zinc-800">
                      {o.prefecture} {o.cityAddress} {o.buildingName}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 text-xs">
                  <p className="font-bold text-zinc-500">注文内容</p>
                  <ul className="mt-2 space-y-1">
                    {o.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between font-medium">
                        <span>
                          {it.productName} × {it.quantity}
                        </span>
                        <span className="font-bold">¥{(it.priceJpy * it.quantity).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-2 border-t border-zinc-200 flex justify-between font-black text-sm text-zinc-950">
                    <span>合計金額 (税込・送料込)</span>
                    <span>¥{o.totalJpy.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── モーダル: アイテム登録・編集 ─── */}
      {showItemModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-zinc-950">アイテムの編集 / 新規登録 👕</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-500">アイテム名 *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-500">価格 (円・税込)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.priceJpy}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priceJpy: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500">初期在庫数</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-500">カテゴリ</label>
                <select
                  value={editingProduct.categoryId}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 font-bold focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-500">商品説明文</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-medium focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  キャンセル
                </button>
                <button type="submit" className="rounded-xl bg-zinc-950 px-5 py-2 font-black text-white hover:bg-zinc-800">
                  保存を確定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── モーダル: カテゴリ追加 ─── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-zinc-950">新規カテゴリの追加 📖</h2>
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-500">カテゴリ名称 *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="例: デジタルコンテンツ"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  キャンセル
                </button>
                <button type="submit" className="rounded-xl bg-zinc-950 px-5 py-2 font-black text-white hover:bg-zinc-800">
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── モーダル: クーポン発行 ─── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-zinc-950">新規割引クーポンの発行 🎟️</h2>
            <form onSubmit={handleAddCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-500">クーポンコード (英数字) *</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="例: WELCOME10"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-mono font-bold uppercase focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-500">割引タイプ</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-bold focus:outline-none"
                  >
                    <option value="percent">% 割合割引</option>
                    <option value="fixed">¥ 定額値引き</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-500">割引値</label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder={newCouponType === "percent" ? "10" : "500"}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  キャンセル
                </button>
                <button type="submit" className="rounded-xl bg-zinc-950 px-5 py-2 font-black text-white hover:bg-zinc-800">
                  クーポンを発行
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
