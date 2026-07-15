"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { EventDoc } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const statusLabel: Record<EventDoc["status"], string> = {
  draft: "下書き",
  published: "公開中",
  ended: "終了",
};

function CreateOrgForm({ uid }: { uid: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const orgRef = doc(collection(db, "organizations"));
      const batch = writeBatch(db);
      batch.set(orgRef, {
        name,
        slug: orgRef.id,
        stripeAccountId: null,
        stripeOnboarded: false,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "organizations", orgRef.id, "members", uid), {
        role: "owner",
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", uid), { orgId: orgRef.id });
      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold">主催者情報の登録</h1>
      <p className="mt-2 text-sm text-zinc-600">
        イベントを開催する組織(会社・チーム)の名前を登録してください。
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          required
          placeholder="組織名(例: Future Studio)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          登録してはじめる
        </button>
      </form>
    </div>
  );
}

function EventList({ orgId }: { orgId: string }) {
  const [events, setEvents] = useState<EventDoc[] | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("orgId", "==", orgId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc));
    });
  }, [orgId]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">イベント</h1>
        <Link
          href="/dashboard/events/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + 新規イベント
        </Link>
      </div>

      {events === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500">まだイベントがありません。</p>
          <Link
            href="/dashboard/events/new"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            最初のイベントを作る
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/dashboard/events/${ev.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {ev.startsAt ? formatDateTime(ev.startsAt.toDate()) : "日時未定"} ・{" "}
                    {ev.venueName || "会場未定"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    ev.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : ev.status === "draft"
                        ? "bg-zinc-100 text-zinc-600"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {statusLabel[ev.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  if (!user) return null;
  if (!profile) return <p className="text-sm text-zinc-400">読み込み中…</p>;
  if (!profile.orgId) return <CreateOrgForm uid={user.uid} />;
  return <EventList orgId={profile.orgId} />;
}
