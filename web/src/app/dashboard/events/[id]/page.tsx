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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDateRange(event.startsAt.toDate(), event.endsAt.toDate())}
          </p>
          {event.status === "published" && (
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              className="mt-1 inline-block text-sm text-blue-600 underline"
            >
              公開ページを見る → /e/{event.slug}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePublish}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              event.status === "published"
                ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {event.status === "published" ? "非公開にする" : "公開する"}
          </button>
        </div>
      </div>

      <nav className="mt-6 flex gap-4 border-b border-zinc-200 text-sm">
        <span className="border-b-2 border-zinc-900 pb-2 font-medium">概要</span>
        <Link href={`/dashboard/events/${id}/sessions`} className="pb-2 text-zinc-500 hover:text-zinc-900">
          コンテンツ
        </Link>
        <Link href={`/dashboard/events/${id}/speakers`} className="pb-2 text-zinc-500 hover:text-zinc-900">
          登壇者
        </Link>
        <Link href={`/dashboard/events/${id}/tickets`} className="pb-2 text-zinc-500 hover:text-zinc-900">
          チケット
        </Link>
        <Link href={`/dashboard/events/${id}/attendees`} className="pb-2 text-zinc-500 hover:text-zinc-900">
          申込者
        </Link>
        <Link href={`/dashboard/events/${id}/checkin`} className="pb-2 text-zinc-500 hover:text-zinc-900">
          受付(QRスキャン)
        </Link>
      </nav>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="申込数(確定)" value={confirmed.length} />
        <Stat label="チェックイン" value={checkedIn.length} />
        <Stat label="売上" value={`¥${revenue.toLocaleString("ja-JP")}`} />
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 p-6">
        <CoverImageUploader eventId={id} coverImageUrl={event.coverImageUrl} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">イベント情報</h2>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
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
