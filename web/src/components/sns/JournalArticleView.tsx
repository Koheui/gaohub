"use client";

import { useState } from "react";
import Link from "next/link";
import { Grain } from "@/components/Grain";
import { OrganizerFollowCard } from "@/components/lp/OrganizerFollowCard";

export interface JournalArticleData {
  id: string;
  title: string;
  coverImageUrl?: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  authorBio: string;
  publishedAtText: string;
  contentParagraphs: string[];
  imageUrls: string[];
  linkedEvent?: {
    id: string;
    slug: string;
    title: string;
    dateText: string;
    venueText: string;
  };
  linkedProduct?: {
    id: string;
    name: string;
    priceJpy: number;
    imageUrl: string;
  };
  likeCount: number;
}

export function JournalArticleView({ article }: { article: JournalArticleData }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(article.likeCount);

  function toggleLike() {
    setLiked((v) => !v);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  }

  return (
    <article className="min-h-screen bg-[#f8fafc] text-zinc-900">
      {/* フィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.12} />
      </div>

      {/* ヘッダーナビゲーション (note風) */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href={`/u/${article.authorUsername}`} className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300">
              {article.authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-zinc-600">
                  {article.authorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-black text-zinc-900">{article.authorName}</p>
              <p className="font-mono text-[10px] text-zinc-400">@{article.authorUsername}</p>
            </div>
          </Link>

          <Link
            href={`/u/${article.authorUsername}`}
            className="rounded-full bg-zinc-950 px-4 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.02]"
          >
            フォローする 🔔
          </Link>
        </div>
      </header>

      {/* 記事メインコンテンツ容器 */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* 大判カバー画像 */}
        {article.coverImageUrl && (
          <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
          </div>
        )}

        {/* タイトル */}
        <h1 className="mt-8 text-3xl font-black leading-tight tracking-tight text-zinc-900 sm:text-4xl">
          {article.title}
        </h1>

        {/* 著者メタ情報 */}
        <div className="mt-6 flex items-center justify-between border-b border-zinc-200 pb-6 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span>{article.publishedAtText}</span>
            <span>・</span>
            <span>GAO HUB Journal</span>
          </div>
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
              liked ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likes}</span>
          </button>
        </div>

        {/* 本文段落 */}
        <div className="mt-8 space-y-6 text-base font-medium leading-relaxed text-zinc-800">
          {article.contentParagraphs.map((paragraph, idx) => (
            <p key={idx} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}

          {/* 記事挿入写真 */}
          {article.imageUrls.length > 0 && (
            <div className="my-8 space-y-4">
              {article.imageUrls.map((url, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* 🎟️ 連動イベントカード (ジャーナルから直接イベント登録へ) */}
          {article.linkedEvent && (
            <div className="my-10 rounded-3xl border-2 border-zinc-900 bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-transparent p-7 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-400 px-3.5 py-1 text-xs font-black text-zinc-950">
                  🎟️ 連動イベント
                </span>
                <span className="font-mono text-xs font-bold text-zinc-500">{article.linkedEvent.dateText}</span>
              </div>
              <h3 className="mt-3 text-2xl font-black text-zinc-900">
                {article.linkedEvent.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 font-bold">📍 {article.linkedEvent.venueText}</p>
              <div className="mt-6 flex justify-end">
                <Link
                  href={`/e/${article.linkedEvent.slug}`}
                  className="rounded-xl bg-zinc-950 px-6 py-3 text-xs font-black text-white transition-transform hover:scale-[1.02]"
                >
                  イベントの詳細・参加登録へ →
                </Link>
              </div>
            </div>
          )}

          {/* 📦 連動EC物販カード (ジャーナルから直接購入へ) */}
          {article.linkedProduct && (
            <div className="my-10 rounded-3xl border-2 border-zinc-900 bg-white p-7 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-black text-white">
                  📦 連動ECプロダクト
                </span>
                <span className="text-xs font-bold text-emerald-600">公式ストックあり</span>
              </div>
              <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
                <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.linkedProduct.imageUrl} alt="" className="h-full w-full object-cover rounded-xl" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-zinc-900">{article.linkedProduct.name}</h4>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-2xl font-black text-zinc-900">¥{article.linkedProduct.priceJpy.toLocaleString("ja-JP")} <span className="text-xs font-normal text-zinc-500">(税込)</span></span>
                    <button className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white transition-transform hover:scale-[1.02]">
                      今すぐ購入する 🛒 (Stripeワンタップ)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 著者カード ＆ フォロー */}
        <div className="mt-16 border-t-2 border-zinc-900 pt-10">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-300">
              {article.authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-zinc-600">
                  {article.authorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-black text-zinc-900">{article.authorName}</p>
              <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{article.authorBio}</p>
            </div>
          </div>

          <div className="mt-8">
            <OrganizerFollowCard organizerName={article.authorName} />
          </div>
        </div>
      </main>
    </article>
  );
}
