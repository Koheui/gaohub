"use client";

import { useState } from "react";
import type { CartItem, ShopOrder } from "@/lib/types";
import { calculateSmartShippingFee } from "@/lib/shipping";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  appliedCouponCode?: string;
  discountJpy: number;
  onOrderCompleted: (order: ShopOrder) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  appliedCouponCode,
  discountJpy,
  onOrderCompleted,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("福岡県");
  const [cityAddress, setCityAddress] = useState("");
  const [buildingName, setBuildingName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<ShopOrder | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.priceJpy * item.quantity,
    0
  );

  // 都道府県 ✕ 最高梱包サイズに基づくマトリックス配送料算定
  const shippingInfo = calculateSmartShippingFee(cartItems, prefecture);
  const shippingJpy = shippingInfo.shippingFee;
  const totalJpy = Math.max(0, subtotal - discountJpy + shippingJpy);

  function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const order: ShopOrder = {
        id: `ord-${Date.now().toString().slice(-6)}`,
        customerName,
        customerEmail,
        customerPhone,
        postalCode,
        prefecture,
        cityAddress,
        buildingName,
        items: cartItems.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          priceJpy: c.product.priceJpy,
          quantity: c.quantity,
        })),
        subtotalJpy: subtotal,
        couponCode: appliedCouponCode,
        discountJpy,
        shippingJpy,
        totalJpy,
        fulfillmentStatus: "unfulfilled",
        createdAtIso: new Date().toISOString().replace("T", " ").slice(0, 16),
      };

      setCreatedOrder(order);
      setIsSubmitting(false);
      setIsCompleted(true);
      onOrderCompleted(order);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
        {!isCompleted ? (
          <>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h2 className="text-lg font-black text-zinc-950">ご購入手続き 🚚</h2>
                <p className="text-xs text-zinc-500">配送先情報とご連絡先をご入力ください。</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
              {/* 注文概要 */}
              <div className="rounded-2xl bg-zinc-50 p-4 space-y-2">
                <p className="font-bold text-zinc-500">ご注文内訳</p>

                {cartItems.map((it) => (
                  <div key={it.product.id} className="flex justify-between font-bold text-zinc-900">
                    <span>
                      {it.product.name} × {it.quantity}
                    </span>
                    <span className="font-mono">
                      ¥{(it.product.priceJpy * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}

                <div className="border-t border-zinc-200 pt-2 space-y-1 font-medium text-zinc-600">
                  <div className="flex justify-between">
                    <span>小計</span>
                    <span className="font-mono">¥{subtotal.toLocaleString()}</span>
                  </div>
                  {discountJpy > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>割引 ({appliedCouponCode})</span>
                      <span className="font-mono">-¥{discountJpy.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>
                      配送料 ({shippingInfo.regionName} / {shippingInfo.maxBoxSize}サイズ同梱)
                    </span>
                    {shippingInfo.isFreeShippingApplied ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <span>¥0</span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                          送料無料適用 ✓
                        </span>
                      </span>
                    ) : (
                      <span className="font-mono font-bold">¥{shippingJpy.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-2 flex justify-between font-black text-base text-zinc-950">
                  <span>お支払い合計金額</span>
                  <span className="font-mono text-xl">¥{totalJpy.toLocaleString()}</span>
                </div>
              </div>

              {/* 購入者氏名・連絡先 */}
              <div className="space-y-3 pt-2">
                <h3 className="font-black text-sm text-zinc-900 border-b border-zinc-100 pb-1">
                  1. お客様情報
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-bold text-zinc-500">お名前 (氏名) *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="例: 山田 太郎"
                      className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-500">電話番号 *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="例: 090-1234-5678"
                      className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-500">メールアドレス *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="例: taro@example.com"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* 配送先住所 */}
              <div className="space-y-3 pt-2">
                <h3 className="font-black text-sm text-zinc-900 border-b border-zinc-100 pb-1">
                  2. 🚚 商品お届け先住所
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-500">郵便番号 *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="例: 100-0001"
                      className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-500">都道府県 *</label>
                    <input
                      type="text"
                      required
                      value={prefecture}
                      onChange={(e) => setPrefecture(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-500">市区町村・町名・番地 *</label>
                  <input
                    type="text"
                    required
                    value={cityAddress}
                    onChange={(e) => setCityAddress(e.target.value)}
                    placeholder="例: 東京都千代田区千代田1-1"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-500">建物名・部屋番号 (任意)</label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="例: 丸の内ビル 501号室"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? "注文・決済処理中..." : `¥${totalJpy.toLocaleString()} の注文を確定する 💳`}
              </button>
            </form>
          </>
        ) : (
          /* 注文完了サンクス表示 */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h2 className="text-xl font-black text-zinc-950">ご注文ありがとうございました！</h2>
            <p className="text-xs text-zinc-600">
              注文番号: <span className="font-mono font-bold text-zinc-950">#{createdOrder?.id}</span>
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
              ご入力いただいたメールアドレス（{customerEmail}）へ注文確認メールを送信いたしました。発送準備が完了次第、追跡番号をご案内いたします。
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white hover:bg-zinc-800"
              >
                ショップへ戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
