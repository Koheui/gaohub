# Neo EventHub 要件定義書 (v0.1 — 2026-07-15)

## 1. プロダクト概要

カンファレンス等のイベントについて「開催準備 → 集客 → チケット決済 → 当日受付」までを
一気通貫で提供するマルチテナント SaaS。ベンチマークは EventHub
(`docs/202507_EventHubサービスご紹介資料_TYPE2（展開用）.pdf` 参照)。

### ベンチマークの弱点と本プロダクトの差別化軸

| EventHub の弱点 | Neo EventHub の答え |
|---|---|
| 初期20万円 + 年間71万〜162万円 + 人数課金の複雑な料金 | セルフサーブ・従量課金のシンプルな料金。無料で開催開始できる |
| チケット決済手数料 **7%** | Stripe 実費(3.6%)+ 低率のプラットフォーム手数料 |
| リードレポートがバッチ生成CSV(2〜3分待ち・1,000件分割) | Firestore リアルタイム同期。ダッシュボードが常に最新 |
| QR受付が「URLコピー+パスコード手入力」で煩雑、オフライン不可 | PWA スキャナー。ログインすれば端末登録不要、オフラインキュー対応 |
| カスタムドメイン25万円、SSO15万円/年 などの有償オプション | カスタムドメインは Cloudflare for SaaS で標準提供(将来) |
| 導入に営業・契約・キックオフMTGが必要 | サインアップ即日でイベント公開可能 |

## 2. 提供形態

- マルチテナント SaaS(外販)
- テナント = Organization(主催者組織)。1 Organization が複数イベントを持つ
- 課金: Stripe Connect(Express)で主催者に売上を直接入金し、
  プラットフォーム手数料(application fee)を徴収するモデル

## 3. MVP スコープ(フェーズ1: 集客〜決済〜受付)

### 主催者(Organizer)
1. メール/Google でサインアップ、Organization 作成
2. イベント作成・編集(タイトル、日時、会場、説明、カバー画像、テーマカラー)
3. チケット種別の作成(無料/有料、価格、販売枠、販売期間)
4. Stripe Connect オンボーディング(有料チケット販売の前提)
5. 公開イベントページ(LP)の自動生成 — `/e/{slug}`
6. 申込者一覧のリアルタイム閲覧・CSVエクスポート
7. 当日受付: PWA QRスキャナー(スタッフ権限)、チェックイン状況のリアルタイム集計

### 参加者(Attendee)
1. イベントページ閲覧(ログイン不要)
2. チケット選択 → 申込フォーム → (有料なら)Stripe Checkout 決済
3. 申込完了メール(Resend)+ QRコード付きチケット表示ページ `/t/{ticketId}`
4. 当日は QR を提示してチェックイン

### フェーズ2以降(スコープ外・設計上考慮のみ)
- 出展者ブース・リアルタイムリードレポート
- 交流/面談マッチング、メッセージ
- セッションタイムテーブル・セッション単位のチェックイン
- アンケート、アーカイブ配信、MA/CRM連携
- カスタムドメイン(Cloudflare for SaaS)、多言語

## 4. 技術スタック

| レイヤ | 採用技術 | 備考 |
|---|---|---|
| フロント/API | Next.js (App Router, TypeScript) | Vercel にデプロイ |
| 認証 | Firebase Authentication | メールリンク + Google |
| DB | Cloud Firestore | リアルタイム同期が差別化の核 |
| ストレージ | Firebase Storage | カバー画像等 |
| 決済 | Stripe Checkout + Stripe Connect (Express) | Webhook で申込確定 |
| メール | Resend | 申込完了・リマインド |
| DNS/CDN | Cloudflare | 将来: カスタムドメイン提供 |
| CI/CD | GitHub + Vercel | main へ push で本番反映 |

## 5. データモデル(Firestore)

```
organizations/{orgId}
  name, slug, stripeAccountId, createdAt
  members/{uid}: { role: "owner" | "admin" | "staff" }

events/{eventId}
  orgId, slug, title, description, coverImageUrl, themeColor
  venue: { name, address }, startsAt, endsAt
  status: "draft" | "published" | "ended"
  publishedAt, createdAt

events/{eventId}/ticketTypes/{ticketTypeId}
  name, description, priceJpy (0=無料), capacity, soldCount
  salesStartsAt, salesEndsAt, isActive

registrations/{registrationId}          … コレクショングループで横断検索
  eventId, orgId, ticketTypeId
  attendee: { name, email, company, title }
  status: "pending_payment" | "confirmed" | "cancelled"
  payment: { stripeSessionId, stripePaymentIntentId, amountJpy, paidAt } | null
  qrToken (ランダム128bit, チケットQRの中身)
  checkedInAt: Timestamp | null, checkedInBy: uid | null
  createdAt
```

- `qrToken` は推測不能なランダム値。QR には `qrToken` のみを載せ、
  チェックイン API がサーバー側で registration を解決する
- 決済確定は **Stripe Webhook (`checkout.session.completed`) のみを信頼**。
  クライアントの成功リダイレクトでは確定しない
- 在庫(capacity)は Firestore トランザクションで `soldCount` を増分し超過販売を防ぐ

## 6. 画面構成

```
/                       … サービスLP
/login, /signup         … 認証
/dashboard              … Organization ダッシュボード(イベント一覧)
/dashboard/events/new
/dashboard/events/[id]          … 概要・申込状況(リアルタイム)
/dashboard/events/[id]/tickets  … チケット種別管理
/dashboard/events/[id]/attendees … 申込者一覧・CSV
/dashboard/events/[id]/checkin  … PWA QRスキャナー
/dashboard/settings/payments    … Stripe Connect オンボーディング
/e/[slug]               … 公開イベントページ(LP)
/e/[slug]/register      … 申込フォーム → Stripe Checkout
/t/[ticketId]           … QRチケット表示(メールのリンク先)
/api/checkout           … Checkout Session 作成
/api/webhooks/stripe    … 決済確定 → registration confirm + メール送信
/api/checkin            … qrToken 検証 + チェックイン記録
```

## 7. 非機能要件

- 受付スキャナーは回線が細い会場でも動くこと(PWA・楽観的UI・再送キュー)
- Firestore Security Rules で org メンバー以外の管理データアクセスを遮断
- 決済金額はサーバー側で ticketType から算出(クライアント提示額を信用しない)
- 個人情報(申込者)は org 単位で分離。公開ページには一切露出しない
