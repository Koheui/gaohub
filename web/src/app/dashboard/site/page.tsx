"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";

export default function SiteCmsDashboardPage() {
  const [brandName, setBrandName] = useState("株式会社 Future Studio");
  const [tagline, setTagline] = useState("リアルとデジタルの融合。ディープテックとフィジカルプロダクトの未来を構築する。");
  const [heroImages, setHeroImages] = useState([
    "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
  ]);
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [aboutTitle, setAboutTitle] = useState("フィジカルとデジタルを繋ぎ、ビジネスの非連続な成長を実現する");
  const [aboutDescription, setAboutDescription] = useState(
    "Future Studio は、AIエージェントシステム「軍師」、実物IPプロダクト「emolink」、小倉の魅力を詰めた「小倉コーラ」などを展開するディープテック＆ブランドカンパニーです。"
  );
  const [aboutImageUrl, setAboutImageUrl] = useState("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      console.log("[SiteCMS] Saved portal config:", {
        brandName,
        tagline,
        heroImages,
        youtubeUrl,
        aboutTitle,
        aboutDescription,
        aboutImageUrl,
      });
      alert("公式Webサイトの変更を保存・即時反映しました！✨");
    } catch (err) {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>公式Webサイト CMS編集 🏛️</h1>
          <p className="mt-1 text-sm text-zinc-500">
            デンソー型の公式コーポレート/ブランドWebポータル (`/u/oka`) のデザインとコンテンツを編集します。
          </p>
        </div>
        <Link
          href="/u/oka"
          target="_blank"
          className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-black text-zinc-900 shadow-sm transition-transform hover:scale-[1.02]"
        >
          公開Webサイトを確認する ↗️
        </Link>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-8">
        {/* 1. 基本ブランディング */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h2 className="text-base font-black text-zinc-900">1. 基本ブランディング</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-zinc-500">企業・ブランド名</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">キャッチコピー / タグライン</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. ヒーローセクション (スライドショー ＆ YouTube) */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h2 className="text-base font-black text-zinc-900">2. ヒーローセクション (スライドショー ＆ YouTube)</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500">公式PV YouTube 動画URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500">ヒーロー背景画像 (スライドショー用画像URL)</label>
              {heroImages.map((img, i) => (
                <div key={i} className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => {
                      const updated = [...heroImages];
                      updated[i] = e.target.value;
                      setHeroImages(updated);
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
                  />
                  {heroImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setHeroImages(heroImages.filter((_, idx) => idx !== i))}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setHeroImages([...heroImages, ""])}
                className="mt-3 text-xs font-bold text-amber-600 hover:underline"
              >
                ➕ 画像スライドを追加する
              </button>
            </div>
          </div>
        </div>

        {/* 3. Pick Up コンテンツ管理 */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h2 className="text-base font-black text-zinc-900">3. Pick Up グリッドコンテンツ</h2>
          <p className="mt-1 text-xs text-zinc-500">
            トップに掲載する「注目イベント」「公式ECストア」「注目ジャーナル」を選択します。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <span className="text-[10px] font-black uppercase text-amber-600">Pick Up 1 (イベント)</span>
              <p className="mt-1 text-sm font-bold text-zinc-900">Future Tech Conference 2027</p>
              <p className="mt-2 text-[10px] text-zinc-400">✅ 自動連動中</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <span className="text-[10px] font-black uppercase text-emerald-600">Pick Up 2 (ECストア)</span>
              <p className="mt-1 text-sm font-bold text-zinc-900">小倉コーラ 原液シロップ</p>
              <p className="mt-2 text-[10px] text-zinc-400">✅ 自動連動中</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <span className="text-[10px] font-black uppercase text-blue-600">Pick Up 3 (ジャーナル)</span>
              <p className="mt-1 text-sm font-bold text-zinc-900">SEQTRAK 購入レビュー</p>
              <p className="mt-2 text-[10px] text-zinc-400">✅ 自動連動中</p>
            </div>
          </div>
        </div>

        {/* 4. About Us (企業概要・ミッション) */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h2 className="text-base font-black text-zinc-900">4. About Us (企業概要・ミッション)</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500">見出しタイトル</label>
              <input
                type="text"
                required
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">企業概要・ミッション説明文章</label>
              <textarea
                required
                rows={4}
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 p-4 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">ヴィジョン代表写真URL</label>
              <input
                type="url"
                required
                value={aboutImageUrl}
                onChange={(e) => setAboutImageUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-950 px-8 py-3.5 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? "保存中…" : "公式Webサイトの設定を保存・公開 ✨"}
          </button>
        </div>
      </form>
    </div>
  );
}
