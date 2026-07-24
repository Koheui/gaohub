# 🚀 GAO HUB (Neo_eventHub) 開発進捗 ＆ Claude Code 引き継ぎドキュメント

## 1. プロジェクト概要 ＆ 技術スタック
* **プロダクト名**: **GAO HUB（ガオハブ）**
* **コンセプト**: 「Go All Out（全力で挑戦する）」を掲げる企業・ブランド・主催者のためのオールインワン統合SaaS（イベントLP自動生成・Stripeチケット決済・PWA即時受付・直営EC物販・オウンドメディア/ジャーナル配信・1-on-1ダイレクト通信）。
* **リポジトリパス**: `/Volumes/T5_Data/Neo_eventHub/web`
* **技術スタック**:
  * **Framework**: Next.js 16 (App Router, Turbopack)
  * **Language/Styling**: TypeScript, Tailwind CSS, Vanilla CSS, Lucide Icons, Grain UI Components
  * **Database/Auth**: Firebase (Cloud Firestore, Firebase Auth, Firebase Admin SDK)
  * **Payments**: Stripe Connect (セルフサーブ決済 ＆ 主催者直通自動入金)
  * **Media/OGP**: Satori (Next.js ImageResponse) による動的宣伝バナー生成
  * **Mail/Notifications**: Resend (メール配信), Slack/LINE Webhook 連携
  * **Hosting/Deploy**: Vercel Production。独自ドメイン **`https://gaohub.jp`**(取得済み・DNS/Vercel Domains 紐付け中)。本番の `NEXT_PUBLIC_APP_URL` / `EMAIL_FROM` はこのドメインに合わせて設定する。

---

## 2. これまでに完了した主要実装 ＆ 修正実績

### 1️⃣ ブランドポータル (`/u/[username]`) ＆ CMS設定 (`/dashboard/site`)
- **自由URLスラグ変更**: ダッシュボードの `/dashboard/site` にて、公開ポータルの末尾URL（例: `/u/oka` ➔ `/u/future-studio` や `/u/gaohub`）を後からいつでも自由にプロンプト不要で変更できる機能を実装。
- **全形式自由リンク Pick Up グリッド**: SNS（YouTube, X, Instagram, Facebook等）、コーポレートサイト、オリジナルURLを自由登録可能。外部URL (`http...`) は別タブ (`target="_blank"`) で開くよう自動制御。
- **YouTube 抽出拡張**: YouTube Shorts (`/shorts/`) やパラメータ付きURL、動画ID直接入力に対応する正規表現抽出ロジックの堅牢化。

### 2️⃣ LPデザインシステム ＆ 動的OGPバナー生成 (Satori)
- **LPビジュアルテンプレート (7種)**: `events/[id]/page.tsx` にて、Kodak, Spectrum, Aurora, Neon Cyber, Swiss Minimal, Editorial Serif, Metro Grid のデザインカード ＆ カラーピッカーを常時選択・即時切替可能。
- **バナー生成の角丸バグ修正 ＆ 大写真化**: Satori レンダラーが親要素の `overflow: hidden` を無視する挙動に対し、`<img>` タグに直接 `borderRadius` を指定。登壇者写真を 1.3〜1.5倍に拡大。
- **モノクロミニマル動的ディバイダー**: 登壇者が不在の際にもタイトルと下線が重ならない動的レイアウト計算を導入。

### 3️⃣ 1-on-1 ダイレクト通信 ＆ リアルタイム即時通知 (Privacy-First)
- **当事者間 1-on-1 秘匿通信モデル**: オファー・メッセージは「送信したエンドユーザー」と「指定された宛先の登壇者/出展者本人」の2者間のみで暗号化通信。他の出展者・他の登壇者・主催者が閲覧・監視できないパーミッション構造を維持。
- **イベント当日即時通知パネル (`/dashboard/events/[id]/messages`)**: 個別メール即時転送、スマホPWA画面内通知、控室 Slack / LINE Webhook 連携を配置。
- **現場ライブチャットラウンジ直通**: `/t/[registrationId]/lounge` へのワンタップ接続ボタンを完備。

### 4️⃣ オウンドメディア・ジャーナル (`/dashboard/posts`, `/j/[id]`)
- **文字数自動計算による読了時間表示**: 記事の本文文字数から読了分数を自動計算してインジケーター表示。非表示切り替えトグルも完備。
- **フルビュー写真内蔵エディタ**: 大画面で画像をインライン挿入しながら執筆できる直感的な編集UI。

### 5️⃣ 法的表記・特商法 ＆ 新SaaSランディングページ
- **法的ページ完備**:
  - 利用規約 (`/terms`)
  - プライバシーポリシー (`/privacy`)
  - 特定商取引法に基づく表記 (`/tokushoho`)
  - お問い合わせ (`/contact`)
- **トップページ (`/`) の SaaS LP 刷新**: ヒーローセクション、プロダクトプレビューUI、6大機能エコシステムグリッド、法的事項フッターを備えた最先端デザイン。

---

## 3. 次のステップ（Claude Code で引き継ぐ推奨タスク）

1. **独自ドメインの紐付け設定**
   - 取得予定のドメイン（例: `gaohub.jp` 等）を Vercel の DNS 設定に接続。
2. **Resend 送信ドメイン認証**
   - DNS レコード（SPF, DKIM, DMARC）を設定し、カスタムドメインからの送信を認証。
3. **Stripe Connect 本番キー (Live Mode) 適用**
   - 特商法表記 (`/tokushoho`) を元に Stripe 本番審査を通過させ、本番決済テストを実施。

---

## 4. 開発コマンド
```bash
# プロジェクトディレクトリへ移動
cd /Volumes/T5_Data/Neo_eventHub/web

# ローカル開発サーバー起動
npm run dev

# 型チェック ＆ ローカルビルド検証
npm run build

# Vercel 本番デプロイ
npx -y vercel --prod
```
