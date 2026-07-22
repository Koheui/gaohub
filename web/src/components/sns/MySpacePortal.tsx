"use client";

import { useState } from "react";
import Link from "next/link";
import { Grain } from "@/components/Grain";
import { OrganizerFollowCard } from "@/components/lp/OrganizerFollowCard";

export interface UserProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  categories: string[];
  followerCount: number;
  links: { label: string; url: string }[];
  accentColor?: string; // アクセントカラー (例: #f97316, #3b82f6, #10b981)
}

export function MySpacePortal({ profile }: { profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<"feed" | "events" | "shop" | "articles">("feed");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark"); // デフォルト: リファレンス通りのミッドナイトダーク
  const [accent, setAccent] = useState(profile.accentColor || "#f97316"); // コーラルオレンジ/テーマカラー
  const [followed, setFollowed] = useState(false);

  // テーマに応じたスタイルクラス定義 (リファレンス準拠)
  const isDark = themeMode === "dark";
  const bgMain = isDark ? "bg-[#0b0f19]" : "bg-[#f8fafc]";
  const textMain = isDark ? "text-white" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-[#151c2c] border-zinc-800/80" : "bg-white border-zinc-200";
  const innerBg = isDark ? "bg-[#1e293b]" : "bg-zinc-100";

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} transition-colors duration-300`}>
      {/* ごく薄いフィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={isDark ? 0.18 : 0.12} />
      </div>

      {/* 浮遊カスタマイズコントロールバー (ダーク/ライト切替 ＆ アクセントカラー選択) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-6 py-3 backdrop-blur-md text-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black tracking-wider uppercase text-zinc-400">Theme:</span>
          <div className="flex rounded-full bg-zinc-900 p-1 border border-zinc-800">
            <button
              onClick={() => setThemeMode("dark")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                isDark ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setThemeMode("light")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                !isDark ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        {/* アクセントカラーピッカー */}
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-black tracking-wider uppercase text-zinc-400 sm:inline">Accent:</span>
          {[
            ["#f97316", "オレンジ"],
            ["#ef4444", "コーラル"],
            ["#3b82f6", "ブルー"],
            ["#10b981", "エメラルド"],
            ["#a855f7", "パープル"],
          ].map(([c, name]) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              title={name}
              className={`h-6 w-6 rounded-full transition-transform ${
                accent === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : "opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* 1. カバー画像ヘッダー (ウェブサイト型大判カバー) */}
      <div className="relative h-64 w-full overflow-hidden bg-zinc-900 sm:h-80 lg:h-96">
        {profile.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.coverImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-85"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-zinc-900 via-zinc-950 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent" />
      </div>

      {/* 2. プロフィール ＆ マイスペース情報 */}
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="relative -mt-20 flex flex-col items-start gap-6 sm:-mt-24 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            {/* アバター写真 (アクセントグラデーション枠付き) */}
            <div
              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl p-1 shadow-2xl sm:h-40 sm:w-40"
              style={{ background: `linear-gradient(135deg, ${accent}, #1e293b)` }}
            >
              <div className="h-full w-full overflow-hidden rounded-[22px] bg-zinc-900">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-black text-zinc-400">
                    {profile.displayName.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {profile.displayName}
              </h1>
              <p className={`font-mono text-xs font-bold ${textMuted}`}>@{profile.username}</p>
            </div>
          </div>

          {/* フォロー ＆ メアド通知ボタン */}
          <div className="mb-2 flex flex-wrap gap-3">
            <button
              onClick={() => setFollowed((v) => !v)}
              className="rounded-2xl px-7 py-3.5 text-sm font-black text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: followed ? "#10b981" : accent,
                boxShadow: `0 8px 30px ${accent}40`,
              }}
            >
              {followed ? "✓ フォロー中 🔔" : "フォローする 🔔 (新着通知)"}
            </button>
          </div>
        </div>

        {/* バイオ (概要文) ＆ カスタムリンク */}
        <div className="mt-6 max-w-3xl">
          <p className={`whitespace-pre-wrap text-base font-medium leading-relaxed ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
            {profile.bio}
          </p>

          {/* カテゴリタグ */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.categories.map((cat) => (
              <span
                key={cat}
                className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                  isDark ? "bg-zinc-800/80 text-zinc-300 border border-zinc-700" : "bg-white text-zinc-700 border border-zinc-300"
                }`}
              >
                #{cat}
              </span>
            ))}
            <span className={`ml-2 inline-flex items-center text-xs font-mono font-bold ${textMuted}`}>
              👥 フォロワー {profile.followerCount.toLocaleString("ja-JP")} 人
            </span>
          </div>

          {/* Webサイト・SNSカスタムリンク */}
          {profile.links.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {profile.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-transform hover:scale-[1.02] ${
                    isDark ? "bg-zinc-800/90 text-white border border-zinc-700" : "bg-white text-zinc-900 border border-zinc-300"
                  }`}
                >
                  <span>🔗 {link.label}</span>
                  <span className={textMuted}>→</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 🌟 ストーリーズ / アバター横スライドバー (リファレンス準拠) */}
        <div className="mt-10 overflow-x-auto py-2 no-scrollbar">
          <div className="flex gap-4">
            {[
              { name: "LIVE Broadcast", live: true, img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" },
              { name: "小倉コーラ", live: false, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80" },
              { name: "emolink", live: false, img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=200&q=80" },
              { name: "Future Tech", live: false, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=200&q=80" },
            ].map((st, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                  className={`relative h-16 w-16 overflow-hidden rounded-full p-0.5 ${
                    st.live ? "ring-2 ring-red-500 ring-offset-2 ring-offset-[#0b0f19]" : "ring-1 ring-zinc-700"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={st.img} alt="" className="h-full w-full rounded-full object-cover" />
                  {st.live && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase">
                      LIVE
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${textMuted}`}>{st.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. マイスペースコンテンツ切り替えタブ */}
        <div className={`mt-8 border-b-2 ${isDark ? "border-zinc-800" : "border-zinc-300"}`}>
          <nav className="-mb-0.5 flex gap-8">
            {[
              ["feed", "📱 マイスペースフィード"],
              ["events", "🎟️ イベント"],
              ["shop", "📦 ショップ・EC物販"],
              ["articles", "📖 ノウハウ記事"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`pb-3 text-xs font-black uppercase tracking-[0.15em] transition-colors ${
                  activeTab === id
                    ? "border-b-4 text-white"
                    : `${textMuted} hover:text-white`
                }`}
                style={{ borderColor: activeTab === id ? accent : "transparent", color: activeTab === id ? (isDark ? "#ffffff" : "#09090b") : undefined }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* 4. タブ内容エリア (リファレンス準拠の洗練カード) */}
        <div className="py-10">
          {activeTab === "feed" && (
            <div className="space-y-8">
              {/* イベント予告カード (リファレンスグラフィック調) */}
              <div className={`rounded-3xl border p-7 shadow-2xl backdrop-blur-md ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black text-white"
                    style={{ backgroundColor: accent }}
                  >
                    🎟️ Upcoming Event
                  </span>
                  <span className={`font-mono text-xs font-bold ${textMuted}`}>2027.03.03 (水)</span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                  Future Tech Conference 2027
                </h3>
                <p className={`mt-2 text-sm ${textMuted}`}>
                  AIエージェントと人間が織りなす次世代開発の最前線。福岡・小倉にてリアル＆オンライン開催。
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/60 pt-4">
                  <span className={`text-xs font-bold ${textMuted}`}>📍 北九州小倉メインホール / Online</span>
                  <Link
                    href="/e/future-tech-conference-2027"
                    className="rounded-xl px-6 py-2.5 text-xs font-black text-white transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: accent }}
                  >
                    イベント詳細・参加登録 →
                  </Link>
                </div>
              </div>

              {/* EC商品カード (小倉コーラ) */}
              <div className={`rounded-3xl border p-7 shadow-2xl ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                    📦 GAO HUB Direct EC
                  </span>
                  <span className="text-xs font-bold text-emerald-400">在庫あり (残12点)</span>
                </div>
                <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-zinc-700 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80"
                      alt="小倉コーラ"
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-black">小倉コーラ 原液シロップ (500mlパウチ)</h4>
                    <p className={`mt-1 text-xs leading-relaxed ${textMuted}`}>
                      スパイシーなハーブと柑橘が織りなす小倉発のクラフトコーラ。炭酸水やミルクで割って楽しめます。
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-2xl font-black">¥2,800 <span className={`text-xs font-normal ${textMuted}`}>(税込)</span></span>
                      <button
                        className="rounded-xl px-6 py-2.5 text-xs font-black text-white transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: accent }}
                      >
                        今すぐ購入する 🛒 (Stripeワンタップ)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 日常写真投稿 (リファレンスの4マルチ画像レイアウト表現) */}
              <div className={`rounded-3xl border p-7 shadow-2xl ${cardBg}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{profile.displayName}</p>
                    <p className={`text-[10px] ${textMuted}`}>2時間前</p>
                  </div>
                </div>
                <p className={`mt-4 text-sm font-medium leading-relaxed ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                  小倉の街で新しいプロジェクトの打ち合わせ。現地現物の熱量を大切に、リアルとデジタルの新しい体験を作っていきます！
                </p>
                
                {/* 4マルチ写真グリッド (リファレンス通り) */}
                <div className="mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" alt="" className="h-44 w-full object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80" alt="" className="h-44 w-full object-cover" />
                </div>

                {/* リアクションバー */}
                <div className={`mt-4 flex items-center gap-6 text-xs font-bold ${textMuted}`}>
                  <span>❤️ 1,125</span>
                  <span>💬 348</span>
                  <span>↗️ シェア</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-xl font-black">開催予定のイベント</h3>
              <p className={`mt-2 text-sm ${textMuted}`}>主催中のイベント一覧です。</p>
            </div>
          )}

          {activeTab === "shop" && (
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-xl font-black">EC物販ショップ</h3>
              <p className={`mt-2 text-sm ${textMuted}`}>オリジナル商品・クラフトグッズ一覧です。</p>
            </div>
          )}

          {activeTab === "articles" && (
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-xl font-black">有料・無料ノウハウ記事</h3>
              <p className={`mt-2 text-sm ${textMuted}`}>公開中のナレッジ記事一覧です。</p>
            </div>
          )}

          {/* フォロー案内 */}
          <OrganizerFollowCard organizerName={profile.displayName} />
        </div>
      </div>
    </div>
  );
}
