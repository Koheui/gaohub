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
}

export function MySpacePortal({ profile }: { profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<"feed" | "events" | "shop" | "articles">("feed");
  const [followed, setFollowed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      {/* フィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.14} />
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
      </div>

      {/* 2. プロフィール ＆ マイスペース情報 */}
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="relative -mt-20 flex flex-col items-start gap-6 sm:-mt-24 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            {/* アバター写真 */}
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-[#f6f5f2] bg-zinc-800 shadow-2xl sm:h-40 sm:w-40">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-black text-zinc-400">
                  {profile.displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                {profile.displayName}
              </h1>
              <p className="font-mono text-xs font-bold text-zinc-500">@{profile.username}</p>
            </div>
          </div>

          {/* フォロー ＆ メアド通知ボタン */}
          <div className="mb-2 flex flex-wrap gap-3">
            <button
              onClick={() => setFollowed((v) => !v)}
              className={`rounded-2xl px-6 py-3.5 text-sm font-black transition-all ${
                followed
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-950 text-white shadow-xl hover:bg-zinc-800"
              }`}
            >
              {followed ? "✓ フォロー中 🔔" : "フォローする 🔔 (新着通知)"}
            </button>
          </div>
        </div>

        {/* バイオ (概要文) ＆ カスタムリンク */}
        <div className="mt-6 max-w-3xl">
          <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-zinc-800">
            {profile.bio}
          </p>

          {/* カテゴリタグ */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-zinc-300 bg-white/80 px-3.5 py-1 text-xs font-bold text-zinc-700 shadow-sm"
              >
                #{cat}
              </span>
            ))}
            <span className="ml-2 inline-flex items-center text-xs font-mono font-bold text-zinc-500">
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-sm transition-transform hover:scale-[1.02] hover:bg-zinc-50"
                >
                  <span>🔗 {link.label}</span>
                  <span className="text-zinc-400">→</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 3. マイスペースコンテンツ切り替えタブ */}
        <div className="mt-12 border-b-2 border-zinc-950">
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
                    ? "border-b-4 border-zinc-950 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-950"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* 4. タブ内容エリア */}
        <div className="py-10">
          {activeTab === "feed" && (
            <div className="space-y-8">
              {/* イベント予告カード */}
              <div className="rounded-3xl border-2 border-zinc-900 bg-white p-7 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-zinc-950">
                    🎟️ Upcoming Event
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-500">2027.03.03 (水)</span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                  Future Tech Conference 2027
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  AIエージェントと人間が織りなす次世代開発の最前線。福岡・小倉にてリアル＆オンライン開催。
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">
                  <span className="text-xs font-bold text-zinc-500">📍 北九州小倉メインホール / Online</span>
                  <Link
                    href="/e/future-tech-conference-2027"
                    className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white transition-transform hover:scale-[1.02]"
                  >
                    イベント詳細・参加登録 →
                  </Link>
                </div>
              </div>

              {/* EC商品カード (小倉コーラ) */}
              <div className="rounded-3xl border-2 border-zinc-900 bg-gradient-to-br from-amber-50 to-orange-50 p-7 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white">
                    📦 GAO HUB Direct EC
                  </span>
                  <span className="text-xs font-bold text-emerald-600">在庫あり (残12点)</span>
                </div>
                <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80"
                      alt="小倉コーラ"
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-zinc-900">小倉コーラ 原液シロップ (500mlパウチ)</h4>
                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                      スパイシーなハーブと柑橘が織りなす小倉発のクラフトコーラ。炭酸水やミルクで割って楽しめます。
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-2xl font-black text-zinc-900">¥2,800 <span className="text-xs font-normal text-zinc-500">(税込)</span></span>
                      <button className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white transition-transform hover:scale-[1.02]">
                        今すぐ購入する 🛒 (Stripeワンタップ)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 日常写真投稿 */}
              <div className="rounded-3xl border-2 border-zinc-900 bg-white p-7 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{profile.displayName}</p>
                    <p className="text-[10px] text-zinc-400">2時間前</p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-800">
                  小倉の街で新しいプロジェクトの打ち合わせ。現地現物の熱量を大切に、リアルとデジタルの新しい体験を作っていきます！
                </p>
                <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-8">
              <h3 className="text-xl font-black text-zinc-900">開催予定のイベント</h3>
              <p className="mt-2 text-sm text-zinc-500">主催中のイベント一覧です。</p>
            </div>
          )}

          {activeTab === "shop" && (
            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-8">
              <h3 className="text-xl font-black text-zinc-900">EC物販ショップ</h3>
              <p className="mt-2 text-sm text-zinc-500">オリジナル商品・クラフトグッズ一覧です。</p>
            </div>
          )}

          {activeTab === "articles" && (
            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-8">
              <h3 className="text-xl font-black text-zinc-900">有料・無料ノウハウ記事</h3>
              <p className="mt-2 text-sm text-zinc-500">公開中のナレッジ記事一覧です。</p>
            </div>
          )}

          {/* フォロー案内 */}
          <OrganizerFollowCard organizerName={profile.displayName} />
        </div>
      </div>
    </div>
  );
}
