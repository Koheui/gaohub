import Link from "next/link";

const features = [
  {
    title: "デザインされたLPを自動生成",
    body: "セッションや登壇者を登録するだけで、カンファレンス級のランディングページが完成。別途Web制作を発注する必要はありません。",
  },
  {
    title: "チケット決済込み",
    body: "Stripe連携で有料チケットをそのまま販売。売上は主催者のアカウントへ直接入金されます。",
  },
  {
    title: "QR受付・リアルタイム集計",
    body: "スマホがそのまま受付端末に。チェックイン状況と申込データは常にリアルタイムで手元に。",
  },
  {
    title: "即日セルフサーブ開催",
    body: "サインアップしたその日にイベントページを公開。営業への問い合わせも、キックオフMTGも不要です。",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <header className="border-b border-zinc-100">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">GAO HUB</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              ログイン
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
            >
              無料で始める
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          イベント開催から決済まで、
          <br />
          ぜんぶこれひとつ。
        </h1>
        <p className="mt-6 text-lg text-zinc-600 max-w-2xl mx-auto">
          カンファレンス・セミナーの集客ページ作成、チケット販売、QR受付までをセルフサーブで。
          初期費用ゼロ、月額ゼロ。かかるのは売れたチケットの手数料だけ。
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login?mode=signup"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700"
          >
            無料でイベントを作る
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 grid gap-8 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-lg">{f.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} GAO HUB
      </footer>
    </main>
  );
}
