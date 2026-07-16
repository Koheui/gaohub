"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchAdmin } from "@/lib/admin/fetchAdmin";
import type { AdminOverview, AdminOrgSummary } from "@/lib/admin/types";
import { formatJpy } from "@/lib/format";

type SortKey = "revenue" | "registrations" | "events" | "recent";

const SORTERS: Record<SortKey, (a: AdminOrgSummary, b: AdminOrgSummary) => number> = {
  revenue: (a, b) => b.revenueJpy - a.revenueJpy,
  registrations: (a, b) => b.confirmedRegistrations - a.confirmedRegistrations,
  events: (a, b) => b.eventCount - a.eventCount,
  recent: (a, b) => new Date(b.lastActivityAt ?? 0).getTime() - new Date(a.lastActivityAt ?? 0).getTime(),
};

export default function AdminOrganizationsPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  useEffect(() => {
    fetchAdmin<AdminOverview>("/api/admin/summary")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = q ? data.organizations.filter((o) => o.name.toLowerCase().includes(q)) : data.organizations;
    return [...list].sort(SORTERS[sortKey]);
  }, [data, query, sortKey]);

  if (error) return <p className="font-mono text-sm font-bold text-red-400">{error}</p>;
  if (!data) {
    return (
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
        Loading…
      </p>
    );
  }

  return (
    <div>
      <Link
        href="/admin"
        className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
      >
        ← サマリー
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
            Tenants
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">
            組織一覧
            <span className="ml-3 text-base font-normal text-zinc-500">{data.organizations.length}件</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="組織名で検索"
            className="border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-white/50"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="border border-white/20 bg-white/5 px-3 py-2 text-sm font-bold text-white outline-none focus:border-white/50"
          >
            <option value="revenue" className="text-zinc-950">売上順</option>
            <option value="registrations" className="text-zinc-950">申込数順</option>
            <option value="events" className="text-zinc-950">イベント数順</option>
            <option value="recent" className="text-zinc-950">直近の動き順</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm font-medium text-zinc-500">該当する組織がありません。</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-white/15">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">組織名</th>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">イベント</th>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">公開中</th>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">確定申込</th>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">売上</th>
                <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em]">直近の動き</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((org) => (
                <tr key={org.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/organizations/${org.id}`} className="font-black tracking-tight hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{org.eventCount}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{org.publishedEventCount}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{org.confirmedRegistrations}</td>
                  <td className="px-4 py-3 font-black tabular-nums">{formatJpy(org.revenueJpy)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {org.lastActivityAt
                      ? new Date(org.lastActivityAt).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
