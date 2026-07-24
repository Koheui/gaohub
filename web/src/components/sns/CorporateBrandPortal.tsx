"use client";

import { useState } from "react";
import Link from "next/link";
import { Grain } from "@/components/Grain";
import { OrganizerFollowCard } from "@/components/lp/OrganizerFollowCard";
import { ShopCartDrawer } from "@/components/shop/ShopCartDrawer";
import { CheckoutModal } from "@/components/shop/CheckoutModal";
import type { CartItem, ShopProduct, ShopOrder } from "@/lib/types";

type HeroSlide = { kind: "image"; src: string } | { kind: "video"; id: string };

export interface CorporateProfileData {
  username: string;
  brandName: string;          // 例: 株式会社 Future Studio / DENSO JAPAN
  tagline: string;            // 例: Crafting the Core / リアルとデジタルの融合
  heroImages: string[];       // スライドショー用画像の配列
  youtubeUrl?: string;        // YouTube動画URL (例: https://www.youtube.com/watch?v=...)
  heroYoutubeAsSlide?: boolean; // YouTube動画をヒーロースライドショーの1枚として表示するか
  iconUrl?: string;           // 丸型プロフィールアイコン (ジャーナル著者アイコン等)
  aboutTitle: string;         // 例: 将来のビジョンと技術の社会実装
  aboutDescription: string;   // 企業概要・ミッション
  aboutImageUrl: string;      // 企業・現場の代表写真
  logoUrl?: string;
  pickups: {
    id: string;
    type: "event" | "shop" | "journal";
    badgeText: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    href: string;
  }[];
  journals: {
    id: string;
    title: string;
    publishedAtText: string;
    imageUrl: string;
    summary: string;
  }[];
  followerCount: number;
}

export function CorporateBrandPortal({ profile }: { profile: CorporateProfileData }) {
  const [followed, setFollowed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // ─── ECカート ＆ チェックアウト状態 ───
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>("");
  const [discountJpy, setDiscountJpy] = useState<number>(0);

  // 公開商品サンプル
  const shopProducts: ShopProduct[] = [
    {
      id: "prod-1",
      name: "小倉コーラ 原液シロップ (500ml)",
      categoryId: "cat-1",
      categoryName: "クラフトドリンク",
      priceJpy: 2800,
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      description: "山椒・レモングラス・地元ボタニカルを仕込んだ無添加クラフトコーラシロップ。",
      boxSize: "80",
      isPublished: true,
    },
    {
      id: "prod-2",
      name: "emolink 完成品物理NFCカード",
      categoryId: "cat-2",
      categoryName: "フィジカルNFC",
      priceJpy: 3080,
      stock: 120,
      imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      description: "高精細UVプリント仕上げ。スマホをかざすだけで想い出の動画・写真を即時再生。",
      boxSize: "60",
      isPublished: true,
    },
    {
      id: "prod-3",
      name: "WORK AND ROLE 公式限定Tシャツ",
      categoryId: "cat-3",
      categoryName: "アパレル",
      priceJpy: 4500,
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      description: "Rock 'n' Roll マインドを体現する特注厚手オーガニックコットンTシャツ。",
      boxSize: "80",
      isPublished: true,
    },
  ];

  function addToCart(product: ShopProduct) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }

  function updateQuantity(productId: string, quantity: number) {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  }

  function removeFromCart(productId: string) {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function handleProceedCheckout(couponCode: string, discount: number) {
    setAppliedCouponCode(couponCode);
    setDiscountJpy(discount);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  function handleOrderCompleted(order: ShopOrder) {
    setCartItems([]);
  }

  // YouTube ID 抽出ヘルパー (shorts, embed, live, direct ID, watch?v= 全形式に対応)
  function getYoutubeId(url?: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }

  const youtubeId = getYoutubeId(profile.youtubeUrl);

  const heroImages =
    profile.heroImages && profile.heroImages.length > 0
      ? profile.heroImages
      : [
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
        ];

  // ヒーロースライド: YouTube動画を「1枚目のスライド」として混ぜられる
  const slides: HeroSlide[] = [
    ...(profile.heroYoutubeAsSlide && youtubeId ? [{ kind: "video" as const, id: youtubeId }] : []),
    ...heroImages.map((src) => ({ kind: "image" as const, src })),
  ];

  function nextSlide() {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }

  function prevSlide() {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* ごく薄いフィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.1} />
      </div>

      {/* 🏛️ 1. グローバルヘッダー (コーレパートサイト風洗練バー) */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              {profile.logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.logoUrl}
                    alt={profile.brandName}
                    className="h-8 w-auto max-w-[200px] object-contain"
                  />
                  <span className="sr-only">{profile.brandName}</span>
                </>
              ) : (
                <span className="text-xl font-black tracking-tighter text-zinc-950">
                  {profile.brandName}
                </span>
              )}
            </Link>
            <span className="hidden font-mono text-xs text-zinc-400 md:inline">
              | {profile.tagline}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 text-xs font-bold tracking-wider text-zinc-600 md:flex">
              <a href="#pickups" className="hover:text-zinc-950">PICK UP</a>
              <a href="#shop" className="hover:text-zinc-950">OFFICIAL STORE 📦</a>
              <a href="#about" className="hover:text-zinc-950">ABOUT</a>
              <a href="#journals" className="hover:text-zinc-950">JOURNAL</a>
            </nav>
            <Link
              href="/dashboard"
              className="hidden font-mono text-xs font-bold text-zinc-500 hover:text-zinc-950 sm:inline"
            >
              ダッシュボード ⚙️
            </Link>
            <button
              onClick={() => setFollowed((v) => !v)}
              className={`rounded-full px-5 py-2 text-xs font-black transition-transform hover:scale-[1.02] ${
                followed ? "bg-emerald-600 text-white" : "bg-zinc-950 text-white"
              }`}
            >
              {followed ? "✓ フォロー中 🔔" : "フォロー 🔔"}
            </button>
          </div>
        </div>
      </header>

      {/* 🏛️ 2. フルサイズ・スライドショー ＆ YouTube動画 ヒーローセクション */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-zinc-950">
        {/* スライドショー: 画像スライド ＆ YouTube動画スライド */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {slide.kind === "video" ? (
              // 背景として無音ループ再生するYouTube動画スライド。
              // 16:9動画を画面いっぱいにトリミング表示 (object-cover相当) する。
              <div className="absolute inset-0 overflow-hidden">
                <iframe
                  src={
                    index === currentSlide
                      ? `https://www.youtube-nocookie.com/embed/${slide.id}?autoplay=1&mute=1&loop=1&playlist=${slide.id}&controls=0&modestbranding=1&playsinline=1&rel=0`
                      : "about:blank"
                  }
                  title="Hero Video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 brightness-90"
                />
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={profile.brandName}
                  className="h-full w-full object-cover brightness-90"
                />
              </>
            )}
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />

        {/* スライド操作矢印ボタン ＆ インジケーター (デンソー風) */}
        {slides.length > 1 && (
          <div className="absolute left-8 top-12 z-20 flex items-center gap-3">
            <button
              onClick={prevSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
            >
              ›
            </button>
            <div className="ml-2 flex gap-1.5">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 cursor-pointer rounded-full transition-all ${
                    i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40"
                  } ${slide.kind === "video" ? "ring-1 ring-red-400" : ""}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* ヒーローテキスト ＆ YouTube再生ボタン */}
        <div className="absolute bottom-16 left-0 right-0 z-10 mx-auto max-w-7xl px-8 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              Official Brand Portal
            </span>
            {profile.youtubeUrl && (
              <button
                onClick={() => {
                  if (youtubeId) {
                    setShowVideoModal(true);
                  } else if (profile.youtubeUrl) {
                    window.open(profile.youtubeUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-black text-white shadow-lg transition-transform hover:scale-[1.05]"
              >
                <span>▶️</span>
                <span>公式PV・YouTube動画を再生</span>
              </button>
            )}
          </div>
          
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {profile.brandName}
          </h1>
          <p className="mt-3 max-w-xl text-base font-medium text-zinc-300 sm:text-lg">
            {profile.tagline}
          </p>
        </div>
      </section>

      {/* 🎬 YouTube動画モーダルモーダル */}
      {showVideoModal && youtubeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600"
            >
              ✕
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ 3. Pick Up セクション (デンソー型 3〜4カラムグリッド) */}
      <section id="pickups" className="relative z-20 -mt-16 mx-auto max-w-7xl px-8 pb-20">
        <h2 className="mb-6 text-2xl font-black tracking-tight text-white drop-shadow-md">
          Pick up
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.pickups.map((item) => {
            const isExternal = item.href?.startsWith("http");
            return (
              <Link
                key={item.id}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-zinc-950/80 px-3 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                  {item.badgeText}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-zinc-900 group-hover:text-amber-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs font-medium text-zinc-500 line-clamp-2">
                  {item.subtitle}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-black text-zinc-950">
                  <span>詳細を見る</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {/* 📦 OFFICIAL STORE / 直営ECストアセクション */}
      <section id="shop" className="border-t border-zinc-100 bg-zinc-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-wrap items-end justify-between border-b border-zinc-800 pb-6">
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-amber-500 uppercase">
                Official Direct Store
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                公式直営ECストア 📦
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-medium max-w-md">
              クラフトドリンク「小倉コーラ」、想い出を奏でる「emolink物理カード」、限定グッズを直接ご購入いただけます。
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {shopProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-transform hover:-translate-y-1"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-amber-600 px-3 py-1 font-mono text-[10px] font-black text-white shadow-md">
                      {p.categoryName}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black text-white">{p.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-zinc-800 pt-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">価格 (税込)</span>
                    <p className="text-2xl font-black font-mono text-amber-400">
                      ¥{p.priceJpy.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="rounded-full bg-white px-5 py-2.5 text-xs font-black text-zinc-950 shadow-lg transition-transform hover:scale-[1.05] active:scale-[0.98]"
                  >
                    カートに追加 🛒
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🏛️ 4. ABOUT / ページ概要セクション (写真 ＋ ヴィジョン文章) */}
      <section id="about" className="border-t border-zinc-100 bg-zinc-50/80 py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
                About Us / Brand Mission
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                {profile.aboutTitle}
              </h2>
              <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-600 font-medium">
                {profile.aboutDescription}
              </p>
              
              <div className="mt-8 flex items-center gap-6 border-t border-zinc-200 pt-6">
                <div>
                  <p className="text-2xl font-black text-zinc-900">{profile.followerCount.toLocaleString("ja-JP")}</p>
                  <p className="font-mono text-xs font-bold text-zinc-400">Official Followers</p>
                </div>
                <div className="h-8 w-px bg-zinc-200" />
                <div>
                  <p className="text-2xl font-black text-zinc-900">100%</p>
                  <p className="font-mono text-xs font-bold text-zinc-400">Official Authenticated</p>
                </div>
              </div>
            </div>

            {/* 大判ヴィジョン写真 */}
            <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.aboutImageUrl}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 🏛️ 5. JOURNAL 最新公式記事セクション (note/ニュース一覧) */}
      <section id="journals" className="py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Official Journal & News
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">
                最新ジャーナル・記事一覧
              </h2>
            </div>
            <a href="#journals" className="hidden font-mono text-xs font-bold text-zinc-500 hover:text-zinc-950 sm:block">
              すべての記事を見る →
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {profile.journals.map((j) => (
              <Link
                key={j.id}
                href={`/j/${j.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <div className="aspect-[16/9] overflow-hidden rounded-xl bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={j.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-4 font-mono text-[10px] font-bold text-zinc-400">{j.publishedAtText}</p>
                  <h3 className="mt-2 text-base font-black text-zinc-900 group-hover:text-amber-600 transition-colors leading-snug">
                    {j.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {j.summary}
                  </p>
                </div>
                <div className="mt-6 border-t border-zinc-100 pt-4 flex items-center justify-between text-xs font-bold text-zinc-950">
                  <span>記事を読む</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16">
            <OrganizerFollowCard organizerName={profile.brandName} />
          </div>
        </div>
      </section>

      {/* 🛒 画面右下の常駐フローティングカートボタン */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-zinc-950 px-5 py-3.5 text-xs font-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
      >
        <span className="text-base">🛒</span>
        <span>カート</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 font-mono text-[10px] font-bold text-zinc-950">
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        </span>
      </button>

      {/* 🛒 カートドロワー ＆ チェックアウトモーダル */}
      <ShopCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onProceedCheckout={handleProceedCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        appliedCouponCode={appliedCouponCode}
        discountJpy={discountJpy}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* フッター */}
      <footer className="border-t border-zinc-200 bg-zinc-950 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 sm:flex-row">
          <p className="text-sm font-black">{profile.brandName} Official Web Media Portal</p>
          <p className="font-mono text-xs text-zinc-500">Powered by GAO HUB Engine © 2026</p>
        </div>
      </footer>
    </div>
  );
}
