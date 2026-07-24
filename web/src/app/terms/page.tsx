import Link from "next/link";
import { ui } from "@/lib/ui";
import { Grain } from "@/components/Grain";

export default function TermsPage() {
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
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">利用規約</h1>
            <p className="mt-2 text-xs font-bold text-zinc-500">最終更新日: 2026年7月24日</p>
          </div>

          <div className="space-y-6 text-sm text-zinc-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">第1条（適用）</h2>
              <p>
                本利用規約（以下「本規約」）は、Future Studio（以下「当社」）が提供するオールインワン型プラットフォーム「GAO HUB」（以下「本サービス」）の利用条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">第2条（アカウント登録・管理）</h2>
              <p>
                ユーザーは、自身の登録情報およびパスワード等の管理責任を負うものとします。アカウント情報の第三者への譲渡、貸与、売買等は禁止します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">第3条（チケット販売および決済）</h2>
              <p>
                本サービス上のイベントチケットおよびEC商品の購入・決済処理は、Stripe, Inc. の提供する決済インフラを介して安全に処理されます。各主催者の定めるキャンセルポリシーが適用されます。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">第4条（禁止事項）</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>法令または公序良俗に違反する行為</li>
                <li>不正アクセス、システムの破壊または妨害行為</li>
                <li>他のユーザー、登壇者、出展者に対するスパム、迷惑行為、ハラスメント</li>
                <li>虚偽の情報掲載や詐欺的なイベント開催</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">第5条（免責事項）</h2>
              <p>
                当社は、本サービスに起因してユーザーに生じた損害について、当社の故意または重大な過失による場合を除き、一切の責任を負わないものとします。
              </p>
            </section>
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
