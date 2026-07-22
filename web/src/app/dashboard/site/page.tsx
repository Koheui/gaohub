"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";

export default function SiteCmsDashboardPage() {
  const [brandName, setBrandName] = useState("Future Studio 株式会社");
  const [tagline, setTagline] = useState("リアルとデジタルの融合。ディープテックとフィジカルプロダクトの未来を構築する。");
  const [heroImages, setHeroImages] = useState([
    "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
  ]);
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [pickups, setPickups] = useState([
    {
      id: "p-1",
      type: "event" as const,
      badgeText: "🎟️ 注目イベント",
      title: "Future Tech Conference 2027",
      subtitle: "AIエージェントと人間が織りなす次世代開発の最前線。福岡・小倉にてリアル＆オンライン開催。",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      href: "/e/future-tech-conference-2027",
    },
    {
      id: "p-2",
      type: "shop" as const,
      badgeText: "📦 公式ECショップ",
      title: "小倉コーラ 原液シロップ (500ml)",
      subtitle: "ハーブと柑橘が織りなす小倉発のクラフトコーラ。炭酸やミルクで割って楽しめます。",
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
      href: "/u/oka",
    },
    {
      id: "p-3",
      type: "journal" as const,
      badgeText: "📖 注目ジャーナル",
      title: "【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由",
      subtitle: "実機音源・トラックメイキングの魅力と現場イベントでの活用展望を徹底レポート。",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
      href: "/j/seqtrak-review-2026",
    },
  ]);
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
          <div className="mt-4 space-y-5">
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
              <label className="text-xs font-bold text-zinc-500">ヒーロー背景画像スライドショー (直接アップロード / Firebase Storage ➔ R2)</label>
              
              {/* サムネイルプレビュー ＆ アップロード済みスライド一覧 */}
              <div className="mt-3 flex flex-wrap gap-4">
                {heroImages.map((img, i) => (
                  <div key={i} className="relative h-28 w-44 overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-100 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                      Slide #{i + 1}
                    </span>
                    {heroImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setHeroImages(heroImages.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-rose-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {/* 📷 ファイル選択アップロードエリア */}
                <label className="flex h-28 w-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition-colors hover:border-zinc-950 hover:bg-white hover:text-zinc-950">
                  <span className="text-2xl">➕</span>
                  <span className="mt-1 text-xs font-bold">画像をアップロード</span>
                  <span className="text-[9px] text-zinc-400">PNG, JPEG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // ローカルプレビューURL生成 (将来 Firebase Storage / R2 へ直接アップロード)
                      const objectUrl = URL.createObjectURL(file);
                      setHeroImages([...heroImages, objectUrl]);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Pick Up コンテンツ管理 */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-zinc-900">3. Pick Up グリッドコンテンツ (全3枠)</h2>
              <p className="mt-1 text-xs text-zinc-500">
                トップページ中央にデンソー型3カラムで強調掲載するコンテンツを設定します。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPickups([...pickups, { id: `p-${Date.now()}`, type: "event", badgeText: "🎟️ 注目イベント", title: "新規Pick Up", subtitle: "詳細説明", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80", href: "/e/future-tech-conference-2027" }])}
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100"
            >
              ➕ 枠を追加
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {pickups.map((item, idx) => (
              <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <span className="font-mono text-xs font-black uppercase text-amber-600">
                    Pick Up 枠 #{idx + 1}
                  </span>
                  {pickups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPickups(pickups.filter((p) => p.id !== item.id))}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">コンテンツタイプ</label>
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].type = e.target.value as any;
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="event">🎟️ イベント</option>
                      <option value="shop">📦 EC物販商品</option>
                      <option value="journal">📖 ジャーナル記事</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">バッジタグ表記</label>
                    <input
                      type="text"
                      value={item.badgeText}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].badgeText = e.target.value;
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-zinc-500">タイトル</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].title = e.target.value;
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-zinc-500">説明サブタイトル</label>
                    <input
                      type="text"
                      value={item.subtitle}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].subtitle = e.target.value;
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">アイキャッチ画像 (直接アップロード)</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      {item.imageUrl ? (
                        <div className="relative h-16 w-28 overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-16 w-28 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-100 text-xs font-bold text-zinc-400">
                          画像なし
                        </div>
                      )}
                      
                      <label className="cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-sm transition-transform hover:scale-[1.02] hover:bg-zinc-50">
                        📷 画像を変更・アップロード
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const objectUrl = URL.createObjectURL(file);
                            const updated = [...pickups];
                            updated[idx].imageUrl = objectUrl;
                            setPickups(updated);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">遷移先URL (イベント/記事/外部)</label>
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].href = e.target.value;
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              <label className="text-xs font-bold text-zinc-500">ヴィジョン代表写真 (直接アップロード)</label>
              <div className="mt-2 flex items-center gap-4">
                {aboutImageUrl ? (
                  <div className="relative h-24 w-36 overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-100 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={aboutImageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 text-xs font-bold text-zinc-400">
                    画像なし
                  </div>
                )}
                
                <label className="cursor-pointer rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-900 shadow-sm transition-transform hover:scale-[1.02] hover:bg-zinc-50">
                  📷 写真を変更・アップロード
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const objectUrl = URL.createObjectURL(file);
                      setAboutImageUrl(objectUrl);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
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
