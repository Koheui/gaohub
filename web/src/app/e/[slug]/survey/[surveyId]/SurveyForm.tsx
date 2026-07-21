"use client";

import { useState } from "react";
import type { RegistrationFieldDef } from "@/lib/types";

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

export function SurveyForm({
  eventId,
  surveyId,
  registrationId,
  qrToken,
  questions,
  themeColor,
  initialAnswers,
  alreadyAnswered,
}: {
  eventId: string;
  surveyId: string;
  registrationId: string;
  qrToken: string;
  questions: RegistrationFieldDef[];
  themeColor: string;
  initialAnswers: Record<string, string>;
  alreadyAnswered: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const q of questions) {
      if (q.required && !answers[q.id]) {
        setError(`「${q.label}」を入力してください`);
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/surveys/${surveyId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, k: qrToken, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <p className="font-bold">ご回答ありがとうございました。</p>
        <p className="mt-2 text-sm text-zinc-600">回答は主催者に共有されます。この画面は閉じていただいて構いません。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {alreadyAnswered && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          すでに回答済みです。内容を修正して再送信できます。
        </p>
      )}
      {questions.map((q) => (
        <div key={q.id}>
          {q.type === "checkbox" ? (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={answers[q.id] === "true"}
                onChange={(e) => set(q.id, e.target.checked ? "true" : "false")}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-zinc-700">
                {q.label}
                {q.required && " *"}
              </span>
            </label>
          ) : (
            <>
              <label className={label}>
                {q.label}
                {q.required && " *"}
              </label>
              {q.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  className={input}
                />
              ) : q.type === "select" ? (
                <select
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  className={input}
                >
                  <option value="">選択してください</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  className={input}
                />
              )}
            </>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: themeColor }}
      >
        {busy ? "送信中…" : "回答を送信する"}
      </button>
    </form>
  );
}
