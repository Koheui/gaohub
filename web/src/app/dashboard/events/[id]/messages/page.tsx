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

  // リアルタイム通知設定状態
  const [emailAlert, setEmailAlert] = useState(true);
  const [browserAlert, setBrowserAlert] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

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
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/events/${eventId}`} className="text-xs font-bold text-zinc-500 hover:text-zinc-950">
              ← イベント詳細へ戻る
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            オファー ＆ リアルタイム通知コントロール
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            イベント開催中の「その瞬間」にユーザー・登壇者・出展者をつなぐ即時通知システム ＆ アフターキュレーション
          </p>
        </div>
      </div>

      {/* 🚨 イベント中：リアルタイム即時通知 ＆ Slack/LINE/メール連携パネル */}
      <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-500/5 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 className="text-base font-black text-zinc-950">
              ⚡ イベント当日・リアルタイム即時通知設定 (Live Instant Alerts)
            </h2>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
            リアルタイム配信中 🟢
          </span>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          イベント開催中はメッセージが届いた「その瞬間」に登壇者・出展者・スタッフの手元へ即時通知される必要があります。
          以下の通知チャネルを有効にすることで、現場でのコミュニケーションを逃さずスピード対応できます。
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
          {/* 即時メール通知 */}
          <div className="rounded-xl border border-zinc-300 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-950">📧 メール即時通知</span>
                <input
                  type="checkbox"
                  checked={emailAlert}
                  onChange={(e) => setEmailAlert(e.target.checked)}
                  className="h-4 w-4 rounded accent-zinc-950"
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 leading-normal">
                オファー受信時に登壇者・主催者の登録メールへ即時通知を送る
              </p>
            </div>
            <span className={`mt-3 text-[10px] font-bold ${emailAlert ? "text-emerald-600" : "text-zinc-400"}`}>
              {emailAlert ? "✓ 即時転送有効" : "無効"}
            </span>
          </div>

          {/* ブラウザ即時通知 */}
          <div className="rounded-xl border border-zinc-300 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-950">🔔 ブラウザ/PWA即時通知</span>
                <input
                  type="checkbox"
                  checked={browserAlert}
                  onChange={(e) => setBrowserAlert(e.target.checked)}
                  className="h-4 w-4 rounded accent-zinc-950"
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 leading-normal">
                ダッシュボードや現場スマホ画面上でポプアップ即時通知音を鳴らす
              </p>
            </div>
            <span className={`mt-3 text-[10px] font-bold ${browserAlert ? "text-emerald-600" : "text-zinc-400"}`}>
              {browserAlert ? "✓ 画面内ポップアップ有効" : "無効"}
            </span>
          </div>

          {/* 現場チャットラウンジ直通リンク */}
          <div className="rounded-xl border border-amber-300 bg-amber-100/60 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-amber-950">💬 現場リアルタイムラウンジ</span>
              <p className="mt-2 text-[11px] text-amber-900/80 leading-normal">
                イベント中に参加者と登壇者が直接チャット会話できるラウンジへ移動
              </p>
            </div>
            <Link
              href={`/t/${eventId}/lounge`}
              target="_blank"
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-black text-white hover:bg-zinc-800 transition-all shadow-sm"
            >
              ライブチャットラウンジを開く ↗
            </Link>
          </div>
        </div>

        {/* Webhook (Slack / LINE / Teams 連携) */}
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4">
          <label className="text-xs font-black text-zinc-950 block">
            ⚡ 現場連携 Webhook URL (Slack / LINE / Teams / 控室通知)
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setWebhookSaved(false);
              }}
              placeholder="例: https://hooks.slack.com/services/..."
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs font-mono"
            />
            <button
              onClick={() => {
                if (!webhookUrl) return;
                setWebhookSaved(true);
                setTimeout(() => setWebhookSaved(false), 3000);
              }}
              className="shrink-0 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black text-white hover:bg-zinc-800 transition-colors"
            >
              {webhookSaved ? "保存完了 ✓" : "連携保存"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Slack等のインジケーターURLを設定すると、オファー発生時に登壇者控室や現場スタッフグループへリアルタイム通知が飛ばせます。
          </p>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-zinc-500">未回答オファー</p>
          <p className="mt-1 text-3xl font-black text-zinc-950">{pendingCount} <span className="text-xs font-normal text-zinc-400">件</span></p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <p className="text-xs font-bold text-rose-800">🔥 AI優先・重要商談</p>
          <p className="mt-1 text-3xl font-black text-rose-600">{highCount} <span className="text-xs font-normal text-rose-400">件</span></p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-zinc-500">総受信用メッセージ</p>
          <p className="mt-1 text-3xl font-black text-zinc-950">{messages.length} <span className="text-xs font-normal text-zinc-400">件</span></p>
        </div>
      </div>

      {/* フィルタータブ ＆ キュレーション */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 transition-colors ${
                filter === "all" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              全件 ({messages.length})
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`rounded-xl px-4 py-2 transition-colors ${
                filter === "high" ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              🔥 重要商談・オファー ({highCount})
            </button>
            <button
              onClick={() => setFilter("medium")}
              className={`rounded-xl px-4 py-2 transition-colors ${
                filter === "medium" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              💬 問い合わせ ({messages.filter((m) => m.aiPriority === "medium").length})
            </button>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] font-bold text-zinc-400">
            AFTER-EVENT CURATION
          </span>
        </div>

        {/* メッセージ一覧 */}
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-zinc-400">メッセージを読み込み中...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : filteredMessages.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            <p className="text-base font-bold text-zinc-600">現在受信中のメッセージはありません</p>
            <p className="mt-1 text-xs text-zinc-400">
              イベント開催中、参加者がラウンジや名刺交換から送ったオファーがリアルタイム通知されるとともに、ここに集約されます。
            </p>
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
                  className={`rounded-2xl border p-6 shadow-md transition-all ${
                    msg.aiPriority === "high"
                      ? "border-rose-300 bg-white ring-2 ring-rose-500/10"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  {/* カード上部情報 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-black ${pBadge.cls}`}>
                        {pBadge.label}
                      </span>
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-black ${purposeBadge.cls}`}>
                        {purposeBadge.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-500">
                      宛先: {msg.recipientName} ({msg.recipientType === "speaker" ? "登壇者" : "参加者"})
                    </span>
                  </div>

                  {/* AI要約エリア */}
                  {msg.aiSummary && (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 text-xs">
                      <p className="font-black text-sky-900">🤖 AI要約:</p>
                      <p className="mt-0.5 font-bold text-sky-950">{msg.aiSummary}</p>
                    </div>
                  )}

                  {/* メッセージ本文・メリット要約 */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base font-black text-zinc-950">
                        {msg.senderCompany && <span className="text-zinc-500 font-bold mr-1.5">{msg.senderCompany}</span>}
                        {msg.senderName} <span className="text-xs font-normal text-zinc-400">({msg.senderRole || "参加者"})</span>
                      </h3>
                    </div>

                    <div className="rounded-xl bg-zinc-50 p-4 text-sm border border-zinc-200/80">
                      <p className="text-xs font-bold text-zinc-500">具体提案・メリット要約:</p>
                      <p className="mt-1 font-bold text-zinc-900">{msg.benefitSummary}</p>
                      {msg.details && (
                        <p className="mt-3 text-xs text-zinc-600 whitespace-pre-wrap border-t border-zinc-200 pt-3 leading-relaxed">
                          {msg.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
                      {msg.senderEmail && <span>📧 {msg.senderEmail}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            disabled={actionBusy === msg.id}
                            onClick={() => handleAction(msg.id, "accept")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-500 transition-colors"
                          >
                            受諾 ＆ 接続する ✓
                          </button>
                          <button
                            disabled={actionBusy === msg.id}
                            onClick={() => handleAction(msg.id, "decline")}
                            className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                          >
                            辞退する
                          </button>
                        </>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            msg.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {msg.status === "accepted" ? "✓ 受諾・商談接続済み" : "辞退済み"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
