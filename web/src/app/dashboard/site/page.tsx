"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EventDoc } from "@/lib/types";
import { ui } from "@/lib/ui";

export default function SiteCmsDashboardPage() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [slug, setSlug] = useState("oka");
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
      badgeText: "📦 公式ECストア",
      title: "Future Studio 公式ECストア",
      subtitle: "小倉コーラ原液シロップ、emolink完成品カード、イベント限定グッズ等の公式直販ストア。",
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
      href: "/u/oka",
    },
    {
      id: "p-3",
      type: "journal" as const,
      badgeText: "📖 公式ジャーナル",
      title: "【祝・採択】北九州市「販路拡大支援助成金」採択決定！",
      subtitle: "AIエージェントと2,929件のCRMが創り出す自動営業ファンネルの裏側。",
      imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
      href: "/j/hanro-subsidy-2026",
    },
  ]);
  const [aboutTitle, setAboutTitle] = useState("フィジカルとデジタルを繋ぎ、ビジネスの非連続な成長を実現する");
  const [aboutDescription, setAboutDescription] = useState(
    "Future Studio は、AIエージェントシステム「軍師」、実物IPプロダクト「emolink」、小倉の魅力を詰めた「小倉コーラ」などを展開するディープテック＆ブランドカンパニーです。"
  );
  const [aboutImageUrl, setAboutImageUrl] = useState("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc));
    });

    // ローカルストレージまたは初期設定から保存済みスラグを読み込む
    const savedSlug = localStorage.getItem("gaohub_user_slug") || "oka";
    setSlug(savedSlug);

    // 既存の保存済みサイト設定をロード
    fetch(`/api/site-config?username=${savedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          const cfg = data.config;
          if (cfg.slug) setSlug(cfg.slug);
          if (cfg.brandName) setBrandName(cfg.brandName);
          if (cfg.tagline) setTagline(cfg.tagline);
          if (cfg.heroImages) setHeroImages(cfg.heroImages);
          if (cfg.youtubeUrl) setYoutubeUrl(cfg.youtubeUrl);
          if (cfg.pickups) {
            const sanitized = cfg.pickups.map((p: any) =>
              p.href === "/dashboard/posts" ? { ...p, href: "/j/hanro-subsidy-2026" } : p
            );
            setPickups(sanitized);
          }
          if (cfg.aboutTitle) setAboutTitle(cfg.aboutTitle);
          if (cfg.aboutDescription) setAboutDescription(cfg.aboutDescription);
          if (cfg.aboutImageUrl) setAboutImageUrl(cfg.aboutImageUrl);
        }
      })
      .catch((err) => console.warn("Failed to load site config:", err));

    return () => unsubEvents();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9\-]/g, "");
    if (!formattedSlug) {
      alert("公開URLスラグを正しい形式で入力してください (半角英数字・ハイフン)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formattedSlug,
          slug: formattedSlug,
          brandName,
          tagline,
          heroImages,
          youtubeUrl,
          pickups,
          aboutTitle,
          aboutDescription,
          aboutImageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }
      localStorage.setItem("gaohub_user_slug", formattedSlug);
      setSlug(formattedSlug);
      alert(`公式Webサイトの設定と公開URL (/u/${formattedSlug}) を保存・更新しました！✨`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">ウェブページ CMS 🌐</h1>
          <p className="mt-1 text-xs text-zinc-500">
            公式ブランドポータル（<code>/u/{slug}</code>）の掲載コンテンツ・URL設定・デザインを自由に変更・即時反映できます。
          </p>
        </div>
        <Link
          href={`/u/${slug}`}
          target="_blank"
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-black text-white hover:bg-zinc-800 transition-transform hover:scale-105 shadow-md"
        >
          公開ページをプレビュー ↗
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 🔗 0. 公開URLスラグ（ユーザーネーム）設定 */}
        <div className="rounded-2xl border-2 border-zinc-950 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
            <span>🔗 公開ページURL（スラグ）の変更</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">自由変更可能</span>
          </h2>
          <p className="text-xs text-zinc-500">
            公開WebサイトのURL末尾（`/u/[username]`）を自由に変更できます。企業名やブランド名に合わせた英数字に設定できます。
          </p>
          <div className="flex items-center gap-2 max-w-lg">
            <span className="font-mono text-xs font-bold text-zinc-500">/u/</span>
            <input
              type="text"
              required
              pattern="[a-zA-Z0-9\-]+"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ""))}
              placeholder="例: future-studio や oka"
              className="w-full rounded-xl border-2 border-zinc-300 px-3.5 py-2.5 text-sm font-mono font-bold focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            現在の公開URL: <code className="font-bold text-zinc-800">https://web-rust-omega-87.vercel.app/u/{slug}</code>
          </p>
        </div>

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

        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-zinc-900">3. Pick Up グリッドコンテンツ (強調掲載・自由リンク)</h2>
              <p className="mt-1 text-xs text-zinc-500">
                トップページ中央に強調掲載するリンクカードを設定します。イベントやECを行わない場合でも、公式Webサイト・SNS・お問い合わせ・取材記事などに自由設定できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPickups([...pickups, { id: `p-${Date.now()}`, type: "custom" as any, badgeText: "🌐 公式サイト", title: "公式コーポレートサイト", subtitle: "最新情報や事業内容はこちらからご確認ください。", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", href: "https://example.com" }])}
                className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100"
              >
                ➕ カスタム枠を追加
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-zinc-50 p-3 border border-zinc-200">
            <span className="text-xs font-bold text-zinc-400 self-center">ワンタップで枠を追加:</span>
            <button
              type="button"
              onClick={() => setPickups([...pickups, { id: `p-${Date.now()}`, type: "custom" as any, badgeText: "🌐 公式サイト", title: "公式Webサイト・企業情報", subtitle: "Future Studio の企業理念、事業実績、最新情報はこちら。", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", href: "https://example.com" }])}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
            >
              🌐 公式Webサイト
            </button>
            <button
              type="button"
              onClick={() => setPickups([...pickups, { id: `p-${Date.now()}`, type: "custom" as any, badgeText: "📱 公式 X", title: "公式 X (旧Twitter) アカウント", subtitle: "日々の開発裏話や最新ニュースをリアルタイムで発信中！", imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80", href: "https://x.com" }])}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
            >
              📱 公式 X (旧Twitter)
            </button>
            <button
              type="button"
              onClick={() => setPickups([...pickups, { id: `p-${Date.now()}`, type: "custom" as any, badgeText: "✉️ お問い合わせ", title: "パートナーシップ・取材のお問い合わせ", subtitle: "コラボレーション、ご取材、お仕事のご相談はこちら。", imageUrl: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=800&q=80", href: "/#contact" }])}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
            >
              ✉️ お問い合わせ
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
                    <label className="text-[11px] font-bold text-zinc-500">コンテンツタイプ / テンプレート</label>
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        const updated = [...pickups];
                        updated[idx].type = newType;
                        if (newType === "shop") {
                          updated[idx].badgeText = "📦 公式ECストア";
                          updated[idx].title = "Future Studio 公式ECストア";
                          updated[idx].subtitle = "小倉コーラ原液シロップ、emolink完成品カード、イベント限定グッズ等の公式直販ストア。";
                          updated[idx].href = "/u/oka";
                        } else if (newType === "journal") {
                          updated[idx].badgeText = "📖 公式ジャーナル";
                          updated[idx].title = "【祝・採択】北九州市「販路拡大支援助成金」採択決定！";
                          updated[idx].subtitle = "AIエージェントと2,929件のCRMが創り出す自動営業ファンネルの裏側。";
                          updated[idx].href = "/j/hanro-subsidy-2026";
                        } else if (newType === "custom") {
                          updated[idx].badgeText = "🌐 自由リンク";
                        }
                        setPickups(updated);
                      }}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="custom">🔗 自由カスタム (SNS・公式サイト・お問い合わせ等)</option>
                      <option value="event">🎟️ イベント</option>
                      <option value="shop">📦 公式ECストア</option>
                      <option value="journal">📖 公式ジャーナル記事</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">バッジタグ表記 (自由設定)</label>
                    <input
                      type="text"
                      value={item.badgeText}
                      onChange={(e) => {
                        const updated = [...pickups];
                        updated[idx].badgeText = e.target.value;
                        setPickups(updated);
                      }}
                      placeholder="例: 🌐 OFFICIAL SITE, 📱 OFFICIAL X, ✉️ CONTACT"
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  {item.type === "event" && (
                    <div className="sm:col-span-2 rounded-xl border border-purple-200 bg-purple-50/80 p-3.5 shadow-sm">
                      <label className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <span>✨ 作成済みイベントから選択してワンクリック自動連動</span>
                      </label>
                      <select
                        onChange={(e) => {
                          const evId = e.target.value;
                          const targetEvent = events.find((ev) => ev.id === evId);
                          if (!targetEvent) return;
                          const updated = [...pickups];
                          updated[idx].title = targetEvent.title;
                          updated[idx].subtitle = targetEvent.tagline || targetEvent.description.slice(0, 80);
                          updated[idx].href = `/e/${targetEvent.slug}`;
                          if (targetEvent.coverImageUrl) {
                            updated[idx].imageUrl = targetEvent.coverImageUrl;
                          }
                          updated[idx].badgeText = "🎟️ 注目イベント";
                          setPickups(updated);
                        }}
                        defaultValue=""
                        className="mt-1.5 w-full rounded-lg border border-purple-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-900 focus:border-purple-600 focus:outline-none"
                      >
                        <option value="" disabled>
                          -- 作成済みのイベントを選択 --
                        </option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            🎟️ {ev.title} (URL: /e/{ev.slug})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-[10px] font-medium text-purple-700">
                        イベントを選択すると、タイトル・キャッチコピー・詳細ページURL (`/e/slug`)・カバー画像が一括で自動セットされます。
                      </p>
                    </div>
                  )}

                  {/* 📦 公式ECストアトップページ自動連動案内 */}
                  {item.type === "shop" && (
                    <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-emerald-950">📦 公式ECストアのトップページにリンク中</p>
                        <p className="text-[10px] text-emerald-700">
                          特定商品単品ではなく、全商品（小倉コーラ原液・emolink・限定グッズ等）が並ぶストアトップ (`/u/oka`) へ誘導します。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...pickups];
                          updated[idx].badgeText = "📦 公式ECストア";
                          updated[idx].title = "Future Studio 公式ECストア";
                          updated[idx].subtitle = "小倉コーラ原液シロップ、emolink完成品カード、イベント限定グッズ等の公式直販ストア。";
                          updated[idx].href = "/u/oka";
                          setPickups(updated);
                        }}
                        className="shrink-0 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
                      >
                        ストア情報を再一括リセット
                      </button>
                    </div>
                  )}

                  {/* 📖 公式ジャーナルトップページ自動連動案内 */}
                  {item.type === "journal" && (
                    <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-amber-950">📖 公式ジャーナル・記事一覧トップにリンク中</p>
                        <p className="text-[10px] text-amber-700">
                          単一の個別記事ではなく、最新取材記事やレポートが並ぶジャーナルトップ (`/dashboard/posts`) へ誘導します。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...pickups];
                          updated[idx].badgeText = "📖 公式ジャーナル";
                          updated[idx].title = "Future Studio 公式ジャーナル・マガジン";
                          updated[idx].subtitle = "ディープテック、プロダクト開発の裏側、取材記事、思考のプロセスを届ける公式メディア。";
                          updated[idx].href = "/dashboard/posts";
                          setPickups(updated);
                        }}
                        className="shrink-0 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-800"
                      >
                        ジャーナル情報を再一括リセット
                      </button>
                    </div>
                  )}

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
