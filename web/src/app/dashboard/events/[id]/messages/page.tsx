"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { LoungeContactMessageDoc, LoungeContactPurpose, MessagePriority } from "@/lib/types";

const PURPOSE_BADGES: Record<LoungeContactPurpose, { label: string; cls: string }> = {
  funding: { label: "💰 資金調達・出資", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  partnership: { label: "🤝 事業提携・PoC", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  purchase: { label: "🛒 サービス導入・購入", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  inquiry: { label: "❓ 問い合わせ", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  greeting: { label: "💬 挨拶・情報交換", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const PRIORITY_BADGES: Record<MessagePriority, { label: string; cls: string }> = {
  high: { label: "🔥 重要商談・オファー", cls: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  medium: { label: "💬 問い合わせ", cls: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  low: { label: "挨拶", cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
};

export default function EventMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [messages, setMessages] = useState<LoungeContactMessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/events/${eventId}/messages`);
      if (!res.ok) throw new Error("メッセージ一覧の取得に失敗しました");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みエラー");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [eventId]);

  async function handleAction(messageId: string, action: string) {
    setActionBusy(messageId);
    try {
      const res = await fetch("/api/lounge/messages/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "処理に失敗しました");
      }
      await fetchMessages();
    } catch (err) {
      alert(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setActionBusy(null);
    }
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === "all") return true;
    return m.aiPriority === filter;
  });

  const highCount = messages.filter((m) => m.aiPriority === "high").length;
  const pendingCount = messages.filter((m) => m.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/events/${eventId}`} className="text-xs font-medium text-zinc-400 hover:text-white">
              ← イベント詳細へ戻る
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            オファー Inbox ＆ AIキュレーション
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            受信したオファーをAIが優先度分析。忙しいイベント当日もワンタップで重要商談に素早く対応できます。
          </p>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">未回答オファー</p>
          <p className="mt-1 text-2xl font-black text-white">{pendingCount} <span className="text-xs font-normal text-zinc-500">件</span></p>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
          <p className="text-xs font-medium text-rose-300">🔥 AI優先・重要商談</p>
          <p className="mt-1 text-2xl font-black text-rose-400">{highCount} <span className="text-xs font-normal text-rose-500/70">件</span></p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">総受信用メッセージ</p>
          <p className="mt-1 text-2xl font-black text-zinc-200">{messages.length} <span className="text-xs font-normal text-zinc-500">件</span></p>
        </div>
      </div>

      {/* フィルタータブ */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3 text-xs font-bold">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            filter === "all" ? "bg-white text-zinc-950" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          全件 ({messages.length})
        </button>
        <button
          onClick={() => setFilter("high")}
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            filter === "high" ? "bg-rose-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          🔥 重要商談・オファー ({highCount})
        </button>
        <button
          onClick={() => setFilter("medium")}
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            filter === "medium" ? "bg-sky-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          💬 問い合わせ ({messages.filter((m) => m.aiPriority === "medium").length})
        </button>
      </div>

      {/* メッセージ一覧 */}
      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500">メッセージを読み込み中...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">{error}</div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          該当するオファーメッセージはありません
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const pBadge = PRIORITY_BADGES[msg.aiPriority] ?? PRIORITY_BADGES.low;
            const purposeBadge = PURPOSE_BADGES[msg.purpose] ?? PURPOSE_BADGES.greeting;
            const isPending = msg.status === "pending";

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border p-5 transition-all ${
                  msg.aiPriority === "high"
                    ? "border-rose-900/50 bg-zinc-900/90 shadow-lg shadow-rose-950/20"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {/* カード上部情報 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pBadge.cls}`}>
                      {pBadge.label}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${purposeBadge.cls}`}>
                      {purposeBadge.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    宛先: {msg.recipientName} ({msg.recipientType === "speaker" ? "登壇者" : "参加者"})
                  </span>
                </div>

                {/* AI要約エリア */}
                {msg.aiSummary && (
                  <div className="mt-3 rounded-lg border border-sky-900/40 bg-sky-950/30 p-3 text-xs">
                    <p className="font-bold text-sky-400">🤖 AI要約:</p>
                    <p className="mt-0.5 font-semibold text-zinc-200">{msg.aiSummary}</p>
                  </div>
                )}

                {/* メッセージ本文・メリット要約 */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-white">
                      {msg.senderCompany && <span className="text-zinc-400 font-normal mr-1.5">{msg.senderCompany}</span>}
                      {msg.senderName} <span className="text-xs font-normal text-zinc-500">({msg.senderRole || "参加者"})</span>
                    </h3>
                  </div>

                  <div className="rounded-lg bg-zinc-950/70 p-3 text-sm">
                    <p className="text-[11px] font-bold text-zinc-400">具体提案・メリット要約:</p>
                    <p className="mt-0.5 font-semibold text-zinc-100">{msg.benefitSummary}</p>
                    {msg.details && (
                      <p className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap border-t border-zinc-800/60 pt-2">
                        {msg.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* アクションボタン・ステータス */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
                  <div className="text-xs">
                    {msg.status === "pending" ? (
                      <span className="font-bold text-amber-400">⏳ 返信待ち</span>
                    ) : msg.status === "responded" ? (
                      <span className="font-bold text-emerald-400">✅ 対応完了 ({msg.responseAction})</span>
                    ) : (
                      <span className="text-zinc-500">辞退済み</span>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        disabled={actionBusy === msg.id}
                        onClick={() => handleAction(msg.id, "schedule_meeting")}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 font-bold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                      >
                        📅 オンライン面談を予約
                      </button>
                      <button
                        disabled={actionBusy === msg.id}
                        onClick={() => handleAction(msg.id, "exchange_contacts")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        📇 名刺・連絡先を交換
                      </button>
                      <button
                        disabled={actionBusy === msg.id}
                        onClick={() => handleAction(msg.id, "decline")}
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                      >
                        辞退
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
