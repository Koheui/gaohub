"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";

export interface JournalPostItem {
  id: string;
  title: string;
  category: string;
  publishedAtText: string;
  summary: string;
  content: string;
  imageUrl: string;
  readTime: string;
  isPublished: boolean;
}

export default function PostsDashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");
  const [editingPost, setEditingPost] = useState<JournalPostItem | null>(null);

  // 初期ジャーナル記事リスト
  const [posts, setPosts] = useState<JournalPostItem[]>([
    {
      id: "seqtrak-review-2026",
      title: "【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由",
      category: "製品レビュー",
      publishedAtText: "2026.07.15",
      summary: "YAMAHAがリリースしたオールインワングルーヴボックス「SEQTRAK」を購入。現場イベントやワークショップでの活用展望をレポート。",
      content: `YAMAHA SEQTRAK を導入し、イベントやライブパフォーマンスでの音響演出に活用し始めました。\n\n1. トラックメイキングの圧倒的スピード感\n2. サンプラーとFM音源のハイブリッド表現\n3. 軽量かつバッテリー駆動で現場持ち込みが容易`,
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
      readTime: "5分",
      isPublished: true,
    },
    {
      id: "j-2",
      title: "emolinkが創り出す『物理思い出カード』の体験設計",
      category: "プロダクト思考",
      publishedAtText: "2026.07.10",
      summary: "スマホをかざすだけで想い出の音楽や写真が蘇るフィジカルプロダクトの裏側と、世間感覚の調和について。",
      content: `デジタルデータの氾濫に対する一つの回答として、手に触れられる物理カードに体験を閉じ込めるプロジェクト「emolink」の思想をまとめました。`,
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
      readTime: "7分",
      isPublished: true,
    },
    {
      id: "j-3",
      title: "地方創生とクラフトコーラ：小倉コーラ誕生秘話",
      category: "地方創生・ストーリー",
      publishedAtText: "2026.07.01",
      summary: "北九州・小倉のスパイスと物語を詰め込んだクラフトコーラの開発ストーリーと直営EC展開への挑戦。",
      content: `地場の素材とカルチャーを掛け合わせた新しいクラフトドリンクの立ち上げ経緯。`,
      imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
      readTime: "6分",
      isPublished: true,
    },
  ]);

  const categories = ["すべて", ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts =
    selectedCategory === "すべて" ? posts : posts.filter((p) => p.category === selectedCategory);

  function handleSavePost(newPost: JournalPostItem) {
    if (editingPost) {
      setPosts((prev) => prev.map((p) => (p.id === newPost.id ? newPost : p)));
    } else {
      setPosts((prev) => [newPost, ...prev]);
    }
    setModalOpen(false);
    setEditingPost(null);
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>ジャーナル・記事管理 📖</h1>
          <p className="mt-1 text-sm text-zinc-500">
            公式メディアポータル（`/u/oka`）や単体記事ページ（`/j/[id]`）に掲載される公式ジャーナル・取材記事・ナレッジを投稿・編集します。
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPost(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-zinc-950/20"
        >
          + 新規ジャーナル記事を執筆 ✍️
        </button>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs font-bold text-zinc-400">
          全 {filteredPosts.length} 件の記事
        </span>
      </div>

      {/* 記事一覧グリッド */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-zinc-950/80 px-3 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                  {post.category}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  {post.isPublished ? "公開中" : "下書き"}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                  <span>{post.publishedAtText}</span>
                  <span>•</span>
                  <span>読了時間 {post.readTime}</span>
                </div>
                <h3 className="mt-1 text-base font-black text-zinc-900 leading-snug">{post.title}</h3>
                <p className="mt-2 text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                  {post.summary}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
              <Link
                href={`/j/${post.id}`}
                target="_blank"
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                記事ページを表示 ↗
              </Link>
              <button
                onClick={() => {
                  setEditingPost(post);
                  setModalOpen(true);
                }}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
              >
                編集
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 執筆・編集モーダル */}
      {modalOpen && (
        <JournalEditModal
          post={editingPost}
          onClose={() => setModalOpen(false)}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}

function JournalEditModal({
  post,
  onClose,
  onSave,
}: {
  post: JournalPostItem | null;
  onClose: () => void;
  onSave: (p: JournalPostItem) => void;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState(post?.category ?? "取材記事");
  const [summary, setSummary] = useState(post?.summary ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [imageUrl, setImageUrl] = useState(
    post?.imageUrl ?? "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
  );
  const [readTime, setReadTime] = useState(post?.readTime ?? "5分");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: post?.id ?? `j-${Date.now()}`,
      title,
      category,
      publishedAtText: new Date().toLocaleDateString("ja-JP").replaceAll("/", "."),
      summary,
      content,
      imageUrl,
      readTime,
      isPublished: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-xl font-black text-zinc-900">
          {post ? "ジャーナル記事の編集" : "新規ジャーナル記事の執筆 ✍️"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-zinc-500">記事タイトル *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 【取材レポート】北九州発スタートアップの挑戦"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500">カテゴリ</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例: 取材記事, 製品レビュー, 思考・ナレッジ"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">想定読了時間</label>
              <input
                required
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="例: 5分"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500">アイキャッチ画像URL</label>
            <input
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500">記事の要約・リード文 *</label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="記事の概要を2〜3文で記述してください"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500">記事本文 (Markdown可)</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ここに本文を入力してください..."
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-black text-white hover:bg-zinc-800"
            >
              記事を保存して公開 ✨
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
