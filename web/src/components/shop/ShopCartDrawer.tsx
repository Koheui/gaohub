"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/types";

interface ShopCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: (couponCode: string, discountJpy: number) => void;
}

export function ShopCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}: ShopCartDrawerProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountJpy: number;
    label: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.priceJpy * item.quantity,
    0
  );

  function applyCoupon() {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "SPECIAL10") {
      const discount = Math.floor(subtotal * 0.1);
      setAppliedCoupon({
        code,
        discountJpy: discount,
        label: "10% OFF クーポン適用中 ✓",
      });
    } else if (code === "SUMMER500") {
      if (subtotal < 3000) {
        setCouponError("¥3,000以上のご購入で利用可能です");
        return;
      }
      setAppliedCoupon({
        code,
        discountJpy: 500,
        label: "¥500 引きクーポン適用中 ✓",
      });
    } else {
      setCouponError("無効なクーポンコードです (例: SPECIAL10, SUMMER500)");
    }
  }

  const discountJpy = appliedCoupon ? appliedCoupon.discountJpy : 0;
  const isFreeShipping = subtotal >= 5000;
  const shippingJpy = subtotal > 0 ? (isFreeShipping ? 0 : 500) : 0;
  const totalJpy = Math.max(0, subtotal - discountJpy + shippingJpy);
  const remainingForFreeShipping = Math.max(0, 5000 - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-lg font-black text-zinc-950">ショッピングカート</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* カートアイテム一覧 */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-zinc-400">
              <span className="text-4xl">🛍️</span>
              <p className="mt-3 text-xs font-bold">カートは空です</p>
              <p className="mt-1 text-[10px]">商品をカートに追加してください。</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3.5"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-zinc-900 line-clamp-1">{item.product.name}</h3>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-zinc-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-0.5 font-bold text-zinc-950">
                      ¥{item.product.priceJpy.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-2 py-0.5">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                        }
                        className="font-bold text-zinc-600 hover:text-zinc-950"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-zinc-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="font-bold text-zinc-600 hover:text-zinc-950"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono font-black text-zinc-950">
                      ¥{(item.product.priceJpy * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* クーポン入力 */}
        {cartItems.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
            <label className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1">
              <span>🎟️ 割引クーポンを適用</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="例: SPECIAL10"
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase focus:outline-none"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
              >
                適用
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-xs font-bold text-amber-900">{appliedCoupon.label}</p>
            )}
            {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
          </div>
        )}

        {/* 合計計算 ＆ レジへ進む */}
        {cartItems.length > 0 && (
          <div className="border-t border-zinc-200 pt-4 space-y-3">
            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>小計</span>
                <span className="font-bold font-mono">¥{subtotal.toLocaleString()}</span>
              </div>
              {discountJpy > 0 && (
                <div className="flex justify-between font-bold text-amber-700">
                  <span>クーポン割引</span>
                  <span className="font-mono">-¥{discountJpy.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>配送料</span>
                {isFreeShipping ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span>¥0</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                      送料無料適用 ✓
                    </span>
                  </span>
                ) : (
                  <span className="font-bold font-mono">¥{shippingJpy.toLocaleString()}</span>
                )}
              </div>
              {!isFreeShipping && subtotal > 0 && (
                <p className="text-[10px] text-zinc-400 text-right">
                  あと <span className="font-bold text-zinc-900 font-mono">¥{remainingForFreeShipping.toLocaleString()}</span> のご購入で送料無料
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-black text-zinc-950">
              <span>請求合計</span>
              <span className="font-mono text-xl">¥{totalJpy.toLocaleString()}</span>
            </div>

            <button
              onClick={() => onProceedCheckout(appliedCoupon?.code ?? "", discountJpy)}
              className="w-full rounded-2xl bg-zinc-950 py-3.5 text-sm font-black text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              購入手続きへ進む (配送先入力) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
