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
import { EventForm, eventToFormValues, type EventFormValues } from "@/components/EventForm";
import { CoverImageUploader } from "@/components/CoverImageUploader";
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

  useEffect(() => {
    return onSnapshot(doc(db, "events", id), (snap) => {
      setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as EventDoc) : null);
    });
  }, [id]);

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
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              className="mt-2 inline-block font-mono text-[11px] font-bold uppercase tracking-[0.15em] underline underline-offset-4 hover:opacity-60"
            >
              公開ページ → /e/{event.slug} ↗
            </a>
          )}
        </div>
        <button
          onClick={togglePublish}
          className={event.status === "published" ? ui.btnGhost : ui.btn}
        >
          {event.status === "published" ? "非公開にする" : "公開する →"}
        </button>
      </div>

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b-2 border-zinc-950">
        <span className="-mb-0.5 border-b-4 border-zinc-950 pb-2 text-[11px] font-black uppercase tracking-[0.2em]">
          概要
        </span>
        {[
          ["sessions", "コンテンツ"],
          ["speakers", "登壇者"],
          ["tickets", "チケット"],
          ["attendees", "申込者"],
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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Confirmed" value={confirmed.length} />
        <Stat label="Checked in" value={checkedIn.length} />
        <Stat label="Revenue" value={`¥${revenue.toLocaleString("ja-JP")}`} />
      </div>

      <div className={`mt-10 p-6 ${ui.card}`}>
        <CoverImageUploader eventId={id} coverImageUrl={event.coverImageUrl} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className={ui.h2}>イベント情報</h2>
          <button onClick={() => setEditing((v) => !v)} className={ui.btnText}>
            {editing ? "閉じる" : "編集する"}
          </button>
        </div>
        {editing ? (
          <div className="mt-4">
            <EventForm
              initial={eventToFormValues(event)}
              submitLabel="保存"
              onSubmit={handleUpdate}
              slugEditable={false}
            />
          </div>
        ) : (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 text-zinc-500">会場</dt>
              <dd>{event.venueName || "未設定"} {event.venueAddress}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-zinc-500">説明</dt>
              <dd className="whitespace-pre-wrap">{event.description || "未設定"}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
