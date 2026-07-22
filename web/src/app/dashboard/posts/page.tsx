"use client";

import { useState } from "react";
import { NewPostModal } from "@/components/sns/NewPostModal";
import { ui } from "@/lib/ui";

export default function PostsDashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className={ui.h1}>コミュニティ投稿 ＆ EC物販管理</h1>
          <p className="mt-1 text-sm text-zinc-500">
            写真・動画付き日常投稿、有料ノウハウ記事、自社商品ECの投稿・出品を管理します。
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-zinc-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          新規投稿・EC出品 ➕
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 p-12 text-center">
        <span className="text-4xl">📸</span>
        <h3 className="mt-4 text-lg font-black text-zinc-900">日常の写真や動画、EC物販商品を投稿しましょう</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          主催アカウントからの日々の投稿がフォロワーのタイムラインに届き、次回イベントへの関心や物販購入を生み出します。
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
        >
          写真・動画を選んで投稿する 🚀
        </button>
      </div>

      {/* 新規投稿モーダル (ガワ先行実装) */}
      <NewPostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          console.log("Post created!");
        }}
      />
    </div>
  );
}
