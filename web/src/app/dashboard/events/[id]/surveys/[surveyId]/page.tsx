"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { SurveyAudience, SurveyDoc, SurveyResponseDoc } from "@/lib/types";
import { ui, chip } from "@/lib/ui";

const AUDIENCE_LABELS: Record<SurveyAudience, string> = {
  all: "確定者全員",
  paid: "有料チケットのみ",
  checkedIn: "当日チェックイン済みのみ",
};

function Bars({ counts, total }: { counts: [string, number][]; total: number }) {
  const max = Math.max(...counts.map(([, c]) => c), 1);
  return (
    <ul className="mt-3 space-y-2">
      {counts.map(([labelText, c]) => (
        <li key={labelText}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-bold">{labelText}</span>
            <span className="shrink-0 tabular-nums text-zinc-500">
              {c}件 {total > 0 && <span className="text-zinc-400">({Math.round((c / total) * 100)}%)</span>}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(c / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string; surveyId: string }>;
}) {
  const { id, surveyId } = use(params);
  const [survey, setSurvey] = useState<SurveyDoc | null>(null);
  const [responses, setResponses] = useState<SurveyResponseDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "events", id, "surveys", surveyId), (snap) => {
      setSurvey(snap.exists() ? ({ id: snap.id, ...snap.data() } as SurveyDoc) : null);
    });
  }, [id, surveyId]);

  useEffect(() => {
    return onSnapshot(collection(db, "events", id, "surveys", surveyId, "responses"), (snap) => {
      setResponses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SurveyResponseDoc));
    });
  }, [id, surveyId]);

  async function sendNow() {
    if (!confirm("このアンケートを対象者に送信しますか?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/events/${id}/surveys/${surveyId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setMsg(`${data.count}名に送信しました`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (!survey) return <p className="text-sm text-zinc-400">読み込み中…</p>;

  return (
    <div>
      <Link href={`/dashboard/events/${id}/surveys`} className={ui.back}>
        ← アンケート一覧
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={ui.h1}>{survey.title}</h1>
            <span className={chip(survey.status === "sent" ? "ok" : survey.status === "scheduled" ? "warn" : "mute")}>
              [{survey.status === "sent" ? "送信済み" : survey.status === "scheduled" ? "送信予約" : "下書き"}]
            </span>
          </div>
          {survey.description && <p className="mt-2 text-sm text-zinc-600">{survey.description}</p>}
          <p className="mt-2 text-xs text-zinc-500">
            対象 {AUDIENCE_LABELS[survey.audience]}
            {survey.status === "sent" && ` ・ 送信 ${survey.sentCount}名 ・ 回答 ${responses.length}件`}
            {survey.status === "scheduled" &&
              survey.scheduledAt &&
              ` ・ ${survey.scheduledAt.toDate().toLocaleString("ja-JP")} に送信予定`}
          </p>
        </div>
        <button onClick={sendNow} disabled={busy} className={ui.btn}>
          {survey.status === "sent" ? "再送信する" : "今すぐ送信する"}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm font-bold text-emerald-700">{msg}</p>}

      {/* 回答集計 */}
      <div className="mt-8">
        <h2 className={ui.h2}>
          回答結果
          <span className="ml-2 text-base font-normal text-zinc-500">{responses.length}件</span>
        </h2>
        {responses.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            {survey.status === "sent" ? "まだ回答がありません。" : "送信するとここに集計が表示されます。"}
          </p>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {survey.questions.map((q) => {
              const answers = responses
                .map((r) => r.answers?.[q.id])
                .filter((v): v is string => v != null && v !== "");
              return (
                <section key={q.id} className={`p-6 ${ui.card}`}>
                  <p className="text-sm font-black">{q.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">回答 {answers.length}件</p>
                  {q.type === "select" ? (
                    <Bars
                      counts={q.options.map((o) => [o, answers.filter((a) => a === o).length])}
                      total={answers.length}
                    />
                  ) : q.type === "checkbox" ? (
                    <Bars
                      counts={[
                        ["はい", answers.filter((a) => a === "true").length],
                        ["いいえ", answers.filter((a) => a === "false").length],
                      ]}
                      total={answers.length}
                    />
                  ) : (
                    <ul className="mt-3 max-h-64 space-y-2 overflow-auto">
                      {answers.length === 0 ? (
                        <li className="text-sm text-zinc-400">自由記述の回答はありません</li>
                      ) : (
                        answers.map((a, i) => (
                          <li key={i} className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                            {a}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
