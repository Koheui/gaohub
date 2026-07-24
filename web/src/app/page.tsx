import Link from "next/link";
import { Grain } from "@/components/Grain";

const features = [
  {
    icon: "🎨",
    badge: "AUTOMATIC LP & BANNER",
    title: "デザインされたLP ＆ バナー自動生成",
    body: "セッションや登壇者を登録するだけで、カンファレンス級の美しいLPと宣伝バナー画像を自動生成。デザイン制作費も外注期間も一切ゼロに。",
  },
  {
    icon: "🎟️",
    badge: "STRIPE CONNECT",
    title: "チケット決済・セルフサーブ販売",
    body: "Stripe連携により有料チケット・無料参加票を即日販売。売上は主催者の銀行口座へ直接自動入金。初期費用・月額費用は完全無料。",
  },
  {
    icon: "📱",
    badge: "PWA CHECK-IN",
    title: "PWA即時受付 ＆ リアルタイム集計",
    body: "主催者やスタッフのスマホがそのまま高速受付端末に。チェックイン状況やリアルタイム売上・来場率をライブダッシュボードで一元把握。",
  },
  {
    icon: "🔒",
    badge: "1-ON-1 OFFERS",
    title: "1-on-1 ダイレクトオファー ＆ リアルタイム通知",
    body: "エンドユーザーと登壇者・出展者が直接つながる完全プライベート商談・名刺交換基盤。Slack / LINE / メールへ即時通知が飛ぶ現場スピード対応。",
  },
  {
    icon: "📦",
    badge: "DIRECT COMMERCE",
    title: "直営EC物販 ＆ フィジカル連携",
    body: "イベントの雰囲気を冷まさず、公式オリジナルグッズやオリジナルプロダクトのEC購入をシームレス接続。熱量の高いファンコミュニティを醸成。",
  },
  {
    icon: "📖",
    badge: "OWNED MEDIA",
    title: "オウンドメディア・ジャーナル配信",
    body: "イベントの開催裏話やレポートを写真・インライン画像付きで広大なフルビューエディタで執筆。文字数から読了時間を自動生成し動的同期。",
  },
];

const highlights = [
  { label: "初期費用・月額費用", val: "¥0" },
  { label: "LP生成 ＆ 公開スピード", val: "最短3分" },
  { label: "決済処理手数料", val: "チケット売上のみ" },
  { label: "プライバシー保護", val: "1-on-1 秘匿通信" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f6f5f2] text-zinc-950 font-sans selection:bg-zinc-950 selection:text-white">
      {/* ごく薄いフィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.14} />
      </div>

      {/* 🏛️ 1. ナビゲーションヘッダー */}
      <header className="sticky top-0 z-50 border-b-2 border-zinc-950 bg-[#f6f5f2]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter text-zinc-950">
            GAO<span className="text-zinc-400"> </span>HUB
          </Link>

          <nav className="flex items-center gap-4 text-xs font-black">
            <Link
              href="/u/oka"
              target="_blank"
              className="hidden sm:inline-block text-zinc-600 hover:text-zinc-950 tracking-wider uppercase"
            >
              デモページを見る ↗
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-zinc-950 px-4 py-2 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-zinc-950 px-5 py-2 text-white shadow-md hover:bg-zinc-800 transition-transform hover:scale-105"
            >
              無料で始める →
            </Link>
          </nav>
        </div>
      </header>

      {/* 🚀 2. ヒーローセクション */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-white px-4 py-1.5 text-xs font-black tracking-wider text-zinc-950 shadow-sm mb-8">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>次世代イベント ＆ ブランド統合SaaS 「GAO HUB」</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-zinc-950 max-w-4xl mx-auto">
          イベント準備から決済、<br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-zinc-950 via-zinc-700 to-amber-600 bg-clip-text text-transparent">
            受付、物販、オファーまで。
          </span>
          <br />
          ぜんぶ、これひとつ。
        </h1>

        <p className="mt-8 text-base sm:text-xl font-medium text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          カンファレンスの集客LP・宣伝バナー自動生成、Stripeチケット決済、PWA即時受付、公式ECストア、1-on-1ダイレクト通信をワンストップで完結。
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login?mode=signup"
            className="rounded-full bg-zinc-950 px-8 py-4 text-base font-black text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-800 hover:shadow-zinc-950/20"
          >
            無料でイベント・ブランドを作る →
          </Link>
          <Link
            href="/u/oka"
            target="_blank"
            className="rounded-full border-2 border-zinc-950 bg-white px-8 py-4 text-base font-black text-zinc-950 shadow-md transition-all hover:bg-zinc-950 hover:text-white"
          >
            公開ポータルのデモを見る 🌐
          </Link>
        </div>

        {/* ハイライト数値 */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
          {highlights.map((h) => (
            <div key={h.label} className="rounded-2xl border-2 border-zinc-950 bg-white p-5 shadow-sm text-center">
              <p className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">{h.val}</p>
              <p className="mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{h.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 📦 3. ダッシュボード ＆ プロダクトプレビュー */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border-2 border-zinc-950 bg-zinc-950 p-3 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 px-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-400">
              GAO HUB Unified Command Center
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white space-y-3">
              <div className="text-3xl">🎨</div>
              <h3 className="text-lg font-black">デザインLP ＆ 自動バナー</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                7種類のテーマスタイル（Kodak, Spectrum, Aurora 等）を1タップで切替。SatoriエンジンでOGP宣伝バナーも自動吐き出し。
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white space-y-3">
              <div className="text-3xl">🔒</div>
              <h3 className="text-lg font-black">1-on-1 ダイレクトオファー</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                エンドユーザーと登壇者・出展者が直接つながる秘密の商談・名刺交換。Slack/LINE Webhookで現場に即時通知。
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white space-y-3">
              <div className="text-3xl">📦</div>
              <h3 className="text-lg font-black">直営EC ＆ オウンドメディア</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                写真内蔵記事の広大エディタ執筆と、オリジナル商品の直販ストアを統合。熱量の高いファンコミュニティを常時醸成。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 4. 機能グリッド (Features Ecosystem) */}
      <section className="relative z-10 border-t-2 border-zinc-950 bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">
              イベントとブランドを加速させる<br />オールインワンエコシステム
            </h2>
            <p className="mt-4 text-sm sm:text-base font-medium text-zinc-500">
              従来の分断されたWeb制作・決済・名簿ツール・ECの課題をすべて解決します。
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border-2 border-zinc-950 bg-[#f6f5f2] p-8 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{f.icon}</span>
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white px-3 py-1 rounded-full border border-zinc-300">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-black text-zinc-950 group-hover:text-amber-600 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-3 text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 5. 最下部コンバージョン CTA */}
      <section className="relative z-10 border-t-2 border-zinc-950 bg-zinc-950 py-24 text-white text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            さあ、新しいイベント ＆ ブランド体験を<br />今すぐはじめよう。
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            登録は30秒で完了。クレジットカード登録も契約書も不要で、今日からすぐにイベントページとブランドポータルを構築できます。
          </p>
          <div className="pt-4 flex justify-center">
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-white px-10 py-5 text-lg font-black text-zinc-950 shadow-2xl transition-transform hover:scale-105 hover:bg-zinc-100"
            >
              無料アカウントを作成して試す →
            </Link>
          </div>
        </div>
      </section>

      {/* 🏛️ 6. フッター ＆ 法的リンク */}
      <footer className="border-t-2 border-zinc-950 bg-white py-12 text-center text-sm text-zinc-500">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-zinc-950">GAO HUB</span>
            <span className="text-xs text-zinc-400">| Powered by Future Studio</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-zinc-600">
            <Link href="/terms" className="hover:text-zinc-950">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-zinc-950">
              プライバシーポリシー
            </Link>
            <Link href="/tokushoho" className="hover:text-zinc-950">
              特定商取引法に基づく表記
            </Link>
            <Link href="/contact" className="hover:text-zinc-950">
              お問い合わせ
            </Link>
          </nav>

          <span className="font-mono text-xs text-zinc-400">
            © {new Date().getFullYear()} GAO HUB. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
