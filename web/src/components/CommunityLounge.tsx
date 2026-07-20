"use client";

import Link from "next/link";

export interface LoungeDirectoryEntry {
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  category: string;
  bio: string;
}

/**
 * チケットページに置くコミュニティラウンジへの入口。
 * 参加・プロフィール編集・交流はすべて専用ラウンジページ側で行う。
 */
export function CommunityLounge({
  selfProfile,
  loungeUrl,
}: {
  selfProfile: LoungeDirectoryEntry | null;
  loungeUrl: string;
}) {
  return (
    <div className="mt-8 border-t border-dashed border-zinc-200 pt-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
        コミュニティラウンジ
      </p>
      {selfProfile ? (
        <>
          <p className="mt-3 text-sm">
            <span className="font-bold">{selfProfile.name}</span>
            <span className="text-zinc-500"> として参加中</span>
          </p>
          <Link
            href={loungeUrl}
            className="mt-4 block rounded-full bg-zinc-950 py-3 text-center text-sm font-black text-white hover:bg-zinc-700"
          >
            ラウンジへ入る →
          </Link>
          <p className="mt-2 text-xs text-zinc-400">
            登壇者・参加者の一覧とメッセージ送信、プロフィールの編集・退出はラウンジページで行えます
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-xs text-zinc-500">
            登壇者や参加者同士で交流できるラウンジです。任意参加・いつでも退出できます。
          </p>
          <Link
            href={loungeUrl}
            className="mt-4 block rounded-full border-2 border-zinc-950 py-3 text-center text-sm font-black hover:bg-zinc-950 hover:text-white"
          >
            ラウンジに参加する →
          </Link>
        </>
      )}
    </div>
  );
}
