import Link from "next/link";
import { Grain } from "@/components/Grain";

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">プライバシーポリシー</h1>
            <p className="mt-2 text-xs font-bold text-zinc-500">最終更新日: 2026年7月24日</p>
          </div>

          <div className="space-y-6 text-sm text-zinc-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">1. 個人情報の収集・取得</h2>
              <p>
                当社は、本サービス「GAO HUB」の提供にあたり、ユーザーのお名前、電子メールアドレス、組織名、決済関連情報（Stripeを介した安全なトークン処理）、ログイン識別情報を取得します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">2. 個人情報の利用目的</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>本サービスの提供、認証、チケット発行および決済手続き</li>
                <li>ユーザー間（エンドユーザー ↔ 登壇者・出展者）の 1-on-1 ダイレクトオファー・通知の送信</li>
                <li>重要なお知らせやシステムアップデート、サポート対応</li>
                <li>不正利用防止およびセキュリティ維持</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">3. 当事者間 1-on-1 プライバシーの保護</h2>
              <p>
                本サービス上のメッセージおよび名刺・オファー交換は、送信者と受領者本人の2者間のみに閉じたプライベートな通信です。第三者や他の出展者、無関係なユーザーに公開・開示されることはありません。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">4. 第三者提供の制限</h2>
              <p>
                当社は、法令に基づく場合やお客様の同意がある場合を除き、個人情報を第三者に提供・開示いたしません。
              </p>
            </section>

            <section>
              <h2 className="text-base font-black text-zinc-950 mb-2">5. 安全管理措置</h2>
              <p>
                通信の暗号化（SSL/TLS）、Firestoreセキュリティルールによるデータアクセスの厳格制御を実施し、個人情報の漏洩や改ざんの防止に万全を期しています。
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
