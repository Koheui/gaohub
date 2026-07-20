import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedEventBySlug } from "@/lib/server/events";
import { formatDateRange } from "@/lib/format";
import { Grain } from "@/components/Grain";
import { ResendForm } from "./ResendForm";

export const dynamic = "force-dynamic";

/**
 * 参加者のマイページ入口。チケットページ(/t/…)がセッション予約の変更や
 * ラウンジ参加を担うため、申込完了メールを失っても戻れるようリンクを再送する。
 */
export default async function MyTicketPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  return (
    <main className="flex-1 bg-[#f6f5f2]">
      <div className="relative h-24 overflow-hidden border-b-2 border-zinc-950">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, #f6f5f2 0%, ${event.themeColor} 130%)`,
          }}
        />
        <Grain opacity={0.3} />
      </div>
      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {formatDateRange(event.startsAt, event.endsAt)}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter">{event.title}</h1>
        <h2 className="mt-10 text-lg font-black tracking-tight">マイチケット</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          申込時のメールアドレスを入力すると、チケットページへのリンクをお送りします。
          チケットページでは<span className="font-bold">セッションの予約・変更が開催当日までいつでも</span>行えます。
          申し込み時に決めきれなくても、あとから追加・変更できます。
        </p>
        <ResendForm eventId={event.id} themeColor={event.themeColor} />
        <p className="mt-8 text-sm text-zinc-500">
          まだお申し込みでない方は{" "}
          <Link href={`/e/${event.slug}/register`} className="font-bold underline">
            参加申し込み
          </Link>{" "}
          へ。
        </p>
      </div>
    </main>
  );
}
