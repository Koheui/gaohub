"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { EventDoc, Registration } from "@/lib/types";
import { EventForm, TEMPLATES, eventToFormValues, type EventFormValues } from "@/components/EventForm";
import { CoverImageUploader } from "@/components/CoverImageUploader";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";
import { formatDateRange } from "@/lib/format";
import { ui } from "@/lib/ui";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`flex flex-col items-center py-7 ${ui.card}`}>
      <span className="text-4xl font-black tabular-nums tracking-tighter">{value}</span>
      <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        [{label}]
      </span>
    </div>
  );
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const orgId = profile?.orgId ?? null;
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [editing, setEditing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    return onSnapshot(doc(db, "events", id), (snap) => {
      setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as EventDoc) : null);
    });
  }, [id]);

  useEffect(() => {
    const qFol = query(collection(db, "organizer_followers"));
    return onSnapshot(qFol, (snap) => {
      setFollowerCount(snap.size);
    });
  }, []);

  useEffect(() => {
    if (!orgId) return;
    // orgId 条件はセキュリティルール(orgメンバーのみ read 可)を list クエリで満たすために必須
    const q = query(
      collection(db, "registrations"),
      where("orgId", "==", orgId),
      where("eventId", "==", id)
    );
    return onSnapshot(q, (snap) => {
      setRegs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Registration));
    });
  }, [id, orgId]);

  if (!event) return <p className="text-sm text-zinc-400">読み込み中…</p>;

  const confirmed = regs.filter((r) => r.status === "confirmed");
  const checkedIn = confirmed.filter((r) => r.checkedInAt);
  const revenue = confirmed.reduce((sum, r) => sum + (r.amountJpy ?? 0), 0);

  async function togglePublish() {
    await updateDoc(doc(db, "events", id), {
      status: event!.status === "published" ? "draft" : "published",
    });
  }

  async function handleUpdate(values: EventFormValues) {
    await updateDoc(doc(db, "events", id), {
      title: values.title,
      tagline: values.tagline,
      description: values.description,
      themeColor: values.themeColor,
      template: values.template,
      ghostText: values.ghostText,
      showGhostText: values.showGhostText,
      showMarquee: values.showMarquee,
      statsStyle: values.statsStyle,
      loungeEnabled: values.loungeEnabled,
      loungeAccess: values.loungeAccess,
      loungeCategories: values.loungeCategories,
      venueName: values.venueName,
      venueAddress: values.venueAddress,
      startsAt: Timestamp.fromDate(new Date(values.startsAtLocal)),
      endsAt: Timestamp.fromDate(new Date(values.endsAtLocal)),
    });
    setEditing(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={ui.label}>
            {formatDateRange(event.startsAt.toDate(), event.endsAt.toDate())}
          </p>
          <h1 className={`mt-2 ${ui.h1}`}>{event.title}</h1>
          {event.status === "published" && (
            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
              /e/{event.slug}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={togglePublish}
            className={event.status === "published" ? ui.btnGhost : ui.btn}
          >
            {event.status === "published" ? "非公開にする" : "公開する (LPを一般閲覧可能にする) →"}
          </button>
        </div>
      </div>

      {event.status === "draft" && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 flex items-center justify-between">
          <span>⚠️ <strong>現在は「下書き」状態です。</strong> 外部一般からの閲覧用URL (<code>/e/{event.slug}</code>) を有効化するには、上の「公開する」ボタンを押してください。</span>
        </div>
      )}

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b-2 border-zinc-950">
        <span className="-mb-0.5 border-b-4 border-zinc-950 pb-2 text-[11px] font-black uppercase tracking-[0.2em]">
          概要
        </span>
        {[
          ["sessions", "コンテンツ"],
          ["speakers", "登壇者"],
          ["sponsors", "スポンサー"],
          ["messages", "オファー (AI)"],
          ["banner", "バナー"],
          ["tickets", "チケット"],
          ["attendees", "申込者"],
          ["report", "レポート"],
          ["surveys", "アンケート"],
          ["checkin", "受付 QR"],
        ].map(([path, label]) => (
          <Link
            key={path}
            href={`/dashboard/events/${id}/${path}`}
            className="pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-950"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Confirmed" value={confirmed.length} />
        <Stat label="Checked in" value={checkedIn.length} />
        <Stat label="Revenue" value={`¥${revenue.toLocaleString("ja-JP")}`} />
        <Stat label="Followers 🔔" value={followerCount} />
      </div>

      <div className={`mt-10 p-6 ${ui.card}`}>
        <CoverImageUploader eventId={id} coverImageUrl={event.coverImageUrl} />
      </div>

      {/* 🎨 LPデザインスタイル・テーマカラー選択セクション */}
      <div className={`mt-10 p-6 ${ui.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <h2 className={ui.h2}>🎨 LPデザインテンプレート ＆ スタイル</h2>
            <p className="mt-1 text-xs text-zinc-500">
              公開LP (`/e/{event.slug}`) の全体デザイン世界観を選択できます。ワンクリックで切り替えられます。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500">テーマカラー:</span>
            <input
              type="color"
              value={event.themeColor || "#18181b"}
              onChange={async (e) => {
                const color = e.target.value;
                await updateDoc(doc(db, "events", id), { themeColor: color });
              }}
              className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-300 shadow-sm"
              title="テーマカラーを変更"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => {
            const isSelected = (event.template || "kodak") === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={async () => {
                  await updateDoc(doc(db, "events", id), { template: t.id });
                }}
                className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-xl ring-2 ring-zinc-950/20"
                    : "border-zinc-200 bg-white text-zinc-900 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md"
                }`}
              >
                <div className="h-20 w-full" style={{ background: t.swatch }} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className={`text-base font-black ${isSelected ? "text-white" : "text-zinc-950"}`}>
                      {t.name}
                    </p>
                    {isSelected && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                        選択中 ✓
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-xs ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={ui.h2}>イベント基本情報</h2>
            <p className="mt-1 text-xs text-zinc-500">タイトル・会場・説明・日時・詳細設定を編集できます</p>
          </div>
          <button onClick={() => setEditing((v) => !v)} className={ui.btn}>
            {editing ? "編集を閉じる" : "基本情報を編集する ✏️"}
          </button>
        </div>
        {editing ? (
          <div className="mt-6 rounded-2xl border-2 border-zinc-950 bg-white p-6 shadow-xl">
            <EventForm
              initial={eventToFormValues(event)}
              submitLabel="保存して適用"
              onSubmit={handleUpdate}
              slugEditable={false}
            />
          </div>
        ) : (
          <dl className={`mt-4 space-y-4 p-6 ${ui.card}`}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-zinc-100 pb-3">
              <dt className="w-32 font-bold text-zinc-500 text-xs uppercase tracking-wider">会場・場所</dt>
              <dd className="font-medium text-sm text-zinc-900">{event.venueName || "未設定"} {event.venueAddress}</dd>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <dt className="w-32 font-bold text-zinc-500 text-xs uppercase tracking-wider">説明・概要</dt>
              <dd className="whitespace-pre-wrap text-sm text-zinc-800 leading-relaxed">{event.description || "未設定"}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
