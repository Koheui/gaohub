"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { INITIAL_JOURNAL_ARTICLES, type JournalArticleData } from "@/lib/journalData";

export interface JournalPostItem extends JournalArticleData {}

export default function PostsDashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");
  const [editingPost, setEditingPost] = useState<JournalPostItem | null>(null);

  // ジャーナル記事リスト State
  const [posts, setPosts] = useState<JournalPostItem[]>(INITIAL_JOURNAL_ARTICLES);

  // Firestore の posts コレクションからリアルタイム取得
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedPosts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as JournalPostItem[];
        setPosts(fetchedPosts);
      }
    });

    return () => unsubscribe();
  }, []);

  const categories = ["すべて", ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts =
    selectedCategory === "すべて" ? posts : posts.filter((p) => p.category === selectedCategory);

  async function handleSavePost(newPost: JournalPostItem) {
    try {
      // Local State 更新
      if (editingPost) {
        setPosts((prev) => prev.map((p) => (p.id === newPost.id ? newPost : p)));
      } else {
        setPosts((prev) => [newPost, ...prev]);
      }

      // Firestore に永続保存
      await setDoc(doc(db, "posts", newPost.id), newPost, { merge: true });
    } catch (err) {
      console.error("Failed to save post to Firestore:", err);
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
      authorName: post?.authorName ?? "岡 浩平 / Future Studio",
      authorUsername: post?.authorUsername ?? "oka",
      authorBio: post?.authorBio ?? "Future Studio 代表。ディープテック、フィジカルプロダクト(emolink)、小倉コーラ、AIエージェントの社会実装を推進中。",
      contentParagraphs: content ? content.split("\n\n") : [summary],
      imageUrls: post?.imageUrls ?? [],
      likeCount: post?.likeCount ?? 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 sm:p-6 backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white p-6 shadow-2xl sm:p-8 overflow-hidden border border-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <h2 className="text-xl font-black text-zinc-900">
            {post ? "ジャーナル記事の編集" : "新規ジャーナル記事の執筆 ✍️"}
          </h2>
          <span className="text-xs font-bold text-zinc-400">広大なフルビューエディタ</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex-1 overflow-y-auto pr-2 space-y-5 text-left">
          <div>
            <label className="text-xs font-bold text-zinc-500">記事タイトル *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 【祝・採択】北九州市「販路拡大支援助成金」採択決定！AIエージェントと2,929件のCRMが創り出す自動営業ファンネルの裏側"
              className="mt-1.5 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                placeholder="例: 6分"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
              />
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
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500">記事の要約・リード文 *</label>
            <textarea
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="記事の概要を2〜3文で記述してください"
              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-zinc-500">
                記事本文 (全体を見渡せる広大エリア・途中に写真挿入可能)
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("挿入する写真・画像のURLを入力してください:");
                    if (url) {
                      const caption = prompt("写真のキャプション（説明）を入力してください:") ?? "";
                      setContent((prev) => `${prev}\n\n![${caption}](${url})\n\n`);
                    }
                  }}
                  className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 border border-sky-200"
                >
                  📷 本文の途中に写真を挿入
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const presetUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";
                    setContent((prev) => `${prev}\n\n![会場全体の盛り上がりと熱気](${presetUrl})\n\n`);
                  }}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                >
                  + 🏛️ 会場風景
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const presetUrl = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
                    setContent((prev) => `${prev}\n\n![熱弁を振るう登壇ピッチセッション](${presetUrl})\n\n`);
                  }}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                >
                  + 🎤 登壇風景
                </button>
              </div>
            </div>
            <textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ここに本文を入力してください..."
              className="mt-2 min-h-[420px] w-full resize-y rounded-2xl border border-zinc-300 px-5 py-4 text-base font-normal text-zinc-900 focus:border-zinc-900 focus:outline-none leading-relaxed font-sans"
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              💡 本文中に <code>![写真のキャプション](画像のURL)</code> と書くと、記事の途中に美しく写真が差し込まれます。
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-6 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-8 py-3 text-sm font-black text-white hover:bg-zinc-800 shadow-lg shadow-zinc-950/20 transition-transform active:scale-[0.98]"
            >
              記事を保存して公開 ✨
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
