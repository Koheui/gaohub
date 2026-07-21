"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { RegistrationFieldDef, SurveyAudience, SurveyDoc } from "@/lib/types";
import { ui, chip } from "@/lib/ui";
import { QuestionsEditor } from "@/components/QuestionsEditor";

const label = ui.label;
const input = ui.input;

const AUDIENCE_LABELS: Record<SurveyAudience, string> = {
  all: "確定者全員",
  paid: "有料チケットのみ",
  checkedIn: "当日チェックイン済みのみ",
};
const STATUS_LABEL: Record<SurveyDoc["status"], string> = {
  draft: "下書き",
  scheduled: "送信予約",
  sent: "送信済み",
};

export default function SurveysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [surveys, setSurveys] = useState<SurveyDoc[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<RegistrationFieldDef[]>([]);
  const [audience, setAudience] = useState<SurveyAudience>("all");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events", id, "surveys"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setSurveys(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SurveyDoc));
    });
  }, [id]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setQuestions([]);
    setAudience("all");
    setScheduledLocal("");
    setShowForm(false);
  }

  async function create(mode: "draft" | "sendNow" | "schedule") {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (questions.length === 0) {
      setError("質問を1つ以上追加してください");
      return;
    }
    if (mode === "schedule" && !scheduledLocal) {
      setError("送信日時を指定してください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const scheduledAt =
        mode === "schedule" ? Timestamp.fromDate(new Date(scheduledLocal)) : null;
      const ref = await addDoc(collection(db, "events", id, "surveys"), {
        title: title.trim(),
        description: description.trim(),
        questions,
        audience,
        status: mode === "schedule" ? "scheduled" : "draft",
        scheduledAt,
        sentAt: null,
        sentCount: 0,
        responseCount: 0,
        createdAt: serverTimestamp(),
      });
      if (mode === "sendNow") {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/events/${id}/surveys/${ref.id}/send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
        alert(`${data.count}名に送信しました`);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className={ui.h1}>アンケート</h1>
          <p className="mt-1 text-sm text-zinc-500">
            参加者にメールでアンケートを送付できます。送信タイミングは「今すぐ」か「日時指定」で選べます。
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className={ui.btn}>
          {showForm ? "閉じる" : "+ アンケートを作成"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 max-w-2xl space-y-5 border-2 border-zinc-950 bg-white p-6">
          <div>
            <label className={label}>タイトル *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
              placeholder="例: 参加後アンケート"
            />
          </div>
          <div>
            <label className={label}>説明(任意)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={input}
              placeholder="回答者への案内文"
            />
          </div>
          <div>
            <label className={label}>質問</label>
            <div className="mt-2">
              <QuestionsEditor value={questions} onChange={setQuestions} />
            </div>
          </div>
          <div>
            <label className={label}>送付対象</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as SurveyAudience)}
              className={input}
            >
              {(Object.keys(AUDIENCE_LABELS) as SurveyAudience[]).map((a) => (
                <option key={a} value={a}>
                  {AUDIENCE_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>送信日時(予約する場合)</label>
            <input
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              className={`${input} max-w-xs`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              指定した日時に自動送信されます(定期実行のcronが処理)。空欄なら「今すぐ送信」か「下書き保存」を選べます。
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => create("sendNow")} disabled={busy} className={ui.btn}>
              作成して今すぐ送信
            </button>
            <button onClick={() => create("schedule")} disabled={busy} className={ui.btnGhost}>
              日時を指定して予約
            </button>
            <button onClick={() => create("draft")} disabled={busy} className={ui.btnText}>
              下書き保存
            </button>
          </div>
        </div>
      )}

      {surveys === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : surveys.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">まだアンケートがありません。</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {surveys.map((s) => (
            <li key={s.id} className={`flex items-center justify-between px-5 py-4 ${ui.card}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{s.title}</p>
                  <span
                    className={chip(
                      s.status === "sent" ? "ok" : s.status === "scheduled" ? "warn" : "mute"
                    )}
                  >
                    [{STATUS_LABEL[s.status]}]
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  質問 {s.questions.length}問 ・ 対象 {AUDIENCE_LABELS[s.audience]}
                  {s.status === "sent" && ` ・ 送信 ${s.sentCount}名 ・ 回答 ${s.responseCount}件`}
                  {s.status === "scheduled" &&
                    s.scheduledAt &&
                    ` ・ ${s.scheduledAt.toDate().toLocaleString("ja-JP")} に送信予定`}
                </p>
              </div>
              <Link href={`/dashboard/events/${id}/surveys/${s.id}`} className={ui.btnText}>
                詳細・結果 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
