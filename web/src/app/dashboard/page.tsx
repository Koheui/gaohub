"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ui, chip } from "@/lib/ui";

const statusLabel: Record<EventDoc["status"], { text: string; tone: "ok" | "warn" | "mute" }> = {
  draft: { text: "Draft", tone: "mute" },
  published: { text: "Live", tone: "ok" },
  ended: { text: "Ended", tone: "warn" },
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
      <p className={ui.label}>Setup</p>
      <h1 className={`mt-2 ${ui.h1}`}>主催者情報の登録</h1>
      <p className="mt-3 text-sm font-medium text-zinc-600">
        イベントを開催する組織(会社・チーム)の名前を登録してください。
      </p>
      <form onSubmit={handleSubmit} className={`mt-8 space-y-5 p-6 ${ui.card}`}>
        <div>
          <label className={ui.label}>組織名</label>
          <input
            required
            placeholder="例: Future Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ui.input}
          />
        </div>
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={ui.btn}>
          登録してはじめる →
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
      <div className="flex items-end justify-between">
        <div>
          <p className={ui.label}>Events</p>
          <h1 className={`mt-2 ${ui.h1}`}>イベント</h1>
        </div>
        <Link href="/dashboard/events/new" className={ui.btn}>
          + 新規イベント
        </Link>
      </div>

      {events === null ? (
        <p className="mt-10 font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
          Loading…
        </p>
      ) : events.length === 0 ? (
        <div className={`mt-10 ${ui.empty}`}>
          <p className="font-medium text-zinc-500">まだイベントがありません。</p>
          <Link href="/dashboard/events/new" className={`mt-6 ${ui.btn}`}>
            最初のイベントを作る →
          </Link>
        </div>
      ) : (
        <ul className={`mt-8 divide-y-2 divide-zinc-950 ${ui.card}`}>
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/dashboard/events/${ev.id}`}
                className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-zinc-950 hover:text-white"
              >
                <div>
                  <p className="text-lg font-black tracking-tight">{ev.title}</p>
                  <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 group-hover:text-zinc-400">
                    {ev.startsAt ? formatDateTime(ev.startsAt.toDate()) : "日時未定"} ・{" "}
                    {ev.venueName || "会場未定"} ・ /e/{ev.slug}
                  </p>
                </div>
                <span className={chip(statusLabel[ev.status].tone)}>
                  [{statusLabel[ev.status].text}]
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
  const router = useRouter();

  useEffect(() => {
    if (profile?.orgId) {
      router.replace("/dashboard/site");
    }
  }, [profile, router]);

  if (!user) return null;
  if (!profile)
    return (
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
        Loading…
      </p>
    );
  if (!profile.orgId) return <CreateOrgForm uid={user.uid} />;
  return (
    <div className="py-8 text-center text-xs font-mono text-zinc-400">
      Webページダッシュボードへ移動中...
    </div>
  );
}
