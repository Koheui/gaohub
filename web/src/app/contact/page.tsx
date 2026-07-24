"use client";

import { useState } from "react";
import Link from "next/link";
import { Grain } from "@/components/Grain";
import { ui } from "@/lib/ui";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("service");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

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

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border-2 border-zinc-950 bg-white p-8 sm:p-12 shadow-xl space-y-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">お問い合わせ</h1>
            <p className="mt-2 text-xs text-zinc-500">
              GAO HUB サービス導入・イベント開催・取材・提携についてのお問い合わせ
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-8 text-center space-y-4">
              <div className="text-4xl">✉️</div>
              <h2 className="text-xl font-black text-emerald-950">送信が完了いたしました</h2>
              <p className="text-xs font-bold text-emerald-900 leading-relaxed max-w-md mx-auto">
                お問い合わせいただきありがとうございます。担当者より登録メールアドレス（{email}）へ順次返信いたします。
              </p>
              <Link
                href="/"
                className="inline-block rounded-xl bg-zinc-950 px-6 py-3 text-xs font-black text-white hover:bg-zinc-800 transition-colors"
              >
                トップページへ戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={ui.label}>お名前・ご担当者名 *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 岡 浩平"
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>メールアドレス *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@futurestudio.co.jp"
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>お問い合わせ種別 *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={ui.input}
                >
                  <option value="service">GAO HUB サービス導入・導入ご相談</option>
                  <option value="event">イベント開催・システム連携について</option>
                  <option value="press">取材・メディア掲載・講演依頼</option>
                  <option value="other">その他のお問い合わせ</option>
                </select>
              </div>

              <div>
                <label className={ui.label}>お問い合わせ内容 *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ご相談内容、開催予定のイベント規模などを詳しくご記入ください。"
                  className={ui.input}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-zinc-950 py-3.5 text-sm font-black text-white hover:bg-zinc-800 transition-all shadow-md"
              >
                送信する →
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
