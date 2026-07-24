import Link from "next/link";
import { Grain } from "@/components/Grain";

export default function TokushohoPage() {
  return (
    <div className="relative min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.14} />
      </div>

      <header className="relative z-10 border-b border-zinc-300 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tighter text-zinc-950">
            GAO<span className="text-zinc-400"> </span>HUB
          </Link>
          <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-zinc-950">
            ← トップへ戻る
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border-2 border-zinc-950 bg-white p-8 sm:p-12 shadow-xl space-y-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">特定商取引法に基づく表記</h1>
            <p className="mt-2 text-xs font-bold text-zinc-500">Commercial Disclosure</p>
          </div>

          <div className="border-t border-zinc-200 pt-6">
            <dl className="divide-y divide-zinc-200 text-sm">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">事業者名・販売事業者</dt>
                <dd className="mt-1 font-bold text-zinc-950 sm:col-span-2 sm:mt-0">Future Studio</dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">代表責任者</dt>
                <dd className="mt-1 font-bold text-zinc-950 sm:col-span-2 sm:mt-0">岡 浩平</dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">所在地</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  福岡県北九州市小倉北区（請求があった場合、遅滞なく開示いたします）
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">連絡先・メールアドレス</dt>
                <dd className="mt-1 font-mono font-bold text-zinc-900 sm:col-span-2 sm:mt-0">
                  support@futurestudio.co.jp
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">販売価格・対価</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  各イベント購入画面およびプロダクト詳細ページに表示された価格（消費税込み）が適用されます。
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">商品代金以外の必要料金</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  インターネット接続料金、通信手数料、配送を伴う物品の場合は配送料（各購入確認画面に明示）。
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">お支払い方法</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  クレジットカード決済（Stripe決済インフラによる即時安全処理）、Google Pay、Apple Pay 等。
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">商品の引渡し・提供時期</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  デジタルチケットおよびラウンジ機能は決済完了後、即時にマイページ（チケット画面）にて提供されます。
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-bold text-zinc-500 text-xs uppercase tracking-wider">キャンセル・返金について</dt>
                <dd className="mt-1 font-medium text-zinc-800 sm:col-span-2 sm:mt-0">
                  デジタルコンテンツ・チケットの性質上、購入確定後のキャンセル・返金はお受けできません。イベント主催者の都合による中止の場合は、主催者の規定に基づき全額返金されます。
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500">
            <span>GAO HUB / Future Studio</span>
            <Link href="/" className="font-bold text-zinc-950 hover:underline">
              トップページへ戻る →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
