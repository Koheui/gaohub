# GAO HUB 要件定義書 (v0.2 — 2026-07-15)

## 1. プロダクト概要

カンファレンス等のイベントについて「開催準備 → 集客 → チケット決済 → 当日受付」までを
一気通貫で提供するマルチテナント SaaS。ベンチマークは EventHub
(`docs/202507_EventHubサービスご紹介資料_TYPE2（展開用）.pdf` 参照)。

### ベンチマークの弱点と本プロダクトの差別化軸

| EventHub の弱点 | GAO HUB の答え |
|---|---|
| 初期20万円 + 年間71万〜162万円 + 人数課金の複雑な料金 | セルフサーブ・従量課金のシンプルな料金。無料で開催開始できる |
| チケット決済手数料 **7%** | Stripe 実費(3.6%)+ 低率のプラットフォーム手数料 |
| リードレポートがバッチ生成CSV(2〜3分待ち・1,000件分割) | Firestore リアルタイム同期。ダッシュボードが常に最新 |
| QR受付が「URLコピー+パスコード手入力」で煩雑、オフライン不可 | PWA スキャナー。ログインすれば端末登録不要、オフラインキュー対応 |
| カスタムドメイン25万円、SSO15万円/年 などの有償オプション | カスタムドメインは Cloudflare for SaaS で標準提供(将来) |
| 導入に営業・契約・キックオフMTGが必要 | サインアップ即日でイベント公開可能 |
| LPのデザイン自由度が低く、別途Webサイト制作が必要になる | **コンテンツ登録だけでカンファレンス級のLPを自動生成**。クリエイティブのアップロードにも対応 |
| 交流機能等の使い方が分からないUI | 機能の導線が自明なUI。説明マニュアルなしで使えることを設計原則にする |

### デザイン原則(ユーザー要求により最重要)

大きな金額が動くカンファレンスで恥ずかしくない見た目を、制作会社なしで実現する。

1. **LPファースト(ヘッドレスCMS)**: セッション・登壇者・チケットを登録するだけで、公開LPに
   ヒーロー/タイムテーブル/登壇者グリッド/チケットセクションとして自動反映される。
   登壇者は独立コンテンツで、それぞれ詳細ページ(`/e/{slug}/speakers/{id}`)を持つ
2. **クリエイティブ**: カバー画像・登壇者写真をアップロード可能(Firebase Storage)。
   画像が無くてもテーマカラーからジェネレーティブな背景を自動生成し、素のまま公開しても様になる
3. **テンプレート**: LPは複数テンプレートから選択可能(kodak=紙×グラデ×グレイン /
   spectrum=グレー地×テーマカラー由来のスペクトラムグラデーション(白も色として使う) /
   aurora=メッシュグラデーション)。テーマカラーは全テンプレートに追従。spectrumは
   アクセントカラーも背景と同じ生成パレット(`spectrumStops`)から取り、色味を統一する
4. **モーション/没入感**: セクションが明確に分かれたレイアウトは採用しない(古く見える)。
   ページ全体を1枚の固定背景キャンバス(低速パララックス)とし、コンテンツは
   半透明パネルとして浮かべる。ファーストビューは100svh+開場カーテン+タイトルの
   バースト演出。マーキー帯・ゴーストタイポ・スクロールリビールで繋ぎ目を消す。
   `prefers-reduced-motion` を尊重する
5. **導線の自明さ**: どの機能も「次に何をすべきか」が画面上で分かる。マニュアル前提のUIは作らない

## 2. 提供形態

- マルチテナント SaaS(外販)
- テナント = Organization(主催者組織)。1 Organization が複数イベントを持つ
- 課金: Stripe Connect(Express)で主催者に売上を直接入金し、
  プラットフォーム手数料(application fee)を徴収するモデル

### マスター管理者(Future Studio / プラットフォーム運営者)

主催者へのデータフィードバック(コンサルティング的な価値提供)のため、全テナントを
横断するアナリティクスが必要。`/admin` に専用のマスター管理画面を持つ。

- **権限付与**: `src/lib/platformAdmin.ts` の `PLATFORM_ADMIN_EMAILS` にメールアドレスを
  固定登録する方式(2026-07-17時点: kohei_oka@futurestudio.co.jp のみ)。Firestoreに
  自己申告フラグを置く経路は作らない — 全テナントの個人情報・売上に及ぶ強い権限のため
- **認可の仕組み**: クライアント側(`/admin/layout.tsx`)は表示制御のみ。実データは
  必ず `/api/admin/*` 経由で取得し、サーバー側で ID トークンの署名済み `email` /
  `email_verified` クレームを検証してから返す(`verifyPlatformAdmin`)。
  クライアントから Firestore を直接横断クエリすることはできない
- **見える指標**: プラットフォーム全体サマリー(組織数・イベント数・確定申込数・
  プラットフォーム手数料/流通総額・イベントステータス内訳)、組織一覧(売上/申込数/
  イベント数でソート・検索、ドリルダウン可)、組織別の詳細(イベントごとの申込・
  チェックイン・売上)
- **デザイン**: 主催者ダッシュボードとは反転したダーク基調(zinc-950)にして
  「特別な管理者エリア」であることを視覚的に示す。統計カード・ステータス内訳バーの
  配色は dataviz スキルの検証済みパレットを使用

## 3. MVP スコープ(フェーズ1: 集客〜決済〜受付)

### 主催者(Organizer)
1. メール/Google でサインアップ、Organization 作成
2. イベント作成・編集(タイトル、日時、会場、説明、カバー画像、テーマカラー)
3. セッション(トークコンテンツ)と登壇者の登録 → LPタイムテーブル/登壇者欄に自動反映
4. チケット種別の作成(無料/有料、価格、販売枠、販売期間、確認書類アップロードの要否)
4. Stripe Connect オンボーディング(有料チケット販売の前提)
5. 公開イベントページ(LP)の自動生成 — `/e/{slug}`
6. 申込者一覧のリアルタイム閲覧・CSVエクスポート・確認書類の審査(承認/却下)
7. 当日受付: PWA QRスキャナー(スタッフ権限)、チェックイン状況のリアルタイム集計

### 参加者(Attendee)
1. イベントページ閲覧(ログイン不要)
2. チケット選択 → 申込フォーム → (確認書類が必要なチケットは画像アップロード必須)
   → (有料なら)Stripe Checkout 決済
3. 申込完了メール(Resend)+ QRコード付きチケット表示ページ `/t/{ticketId}`
4. 当日は QR を提示してチェックイン

### フェーズ2以降(スコープ外・設計上考慮のみ)
- 出展者ブース・リアルタイムリードレポート
- 交流/面談マッチング、メッセージ
- セッション単位のチェックイン・満席管理
- 簡易クリエイティブエディタ
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
  orgId, slug, title, tagline, description, coverImageUrl
  themeColor, template ("kodak" | "spectrum" | "aurora")
  venue: { name, address }, startsAt, endsAt
  status: "draft" | "published" | "ended"
  publishedAt, createdAt

events/{eventId}/ticketTypes/{ticketTypeId}
  name, description, priceJpy (0=無料), capacity, soldCount
  salesStartsAt, salesEndsAt, isActive
  requiresVerification (学生無料等: 申込時に確認書類の画像アップロードを必須にする)

events/{eventId}/speakers/{speakerId}
  name, title, company, photoUrl, bio, websiteUrl, xUrl, createdAt

events/{eventId}/sessions/{sessionId}
  title, description, track, startsAt, endsAt
  speakerIds: [speakerId]     … speakers への参照
  createdAt

registrations/{registrationId}          … コレクショングループで横断検索
  eventId, orgId, ticketTypeId
  attendee: { name, email, company, title }
  status: "pending_payment" | "confirmed" | "cancelled"
  payment: { stripeSessionId, stripePaymentIntentId, amountJpy, paidAt } | null
  qrToken (ランダム128bit, チケットQRの中身)
  checkedInAt: Timestamp | null, checkedInBy: uid | null
  verificationImagePath: string | null   … Storage内パス(生URLは保存しない)
  verificationStatus: "pending" | "approved" | "rejected" | null
  createdAt
```

- `qrToken` は推測不能なランダム値。QR には `qrToken` のみを載せ、
  チェックイン API がサーバー側で registration を解決する
- 決済確定は **Stripe Webhook (`checkout.session.completed`) のみを信頼**。
  クライアントの成功リダイレクトでは確定しない
- 在庫(capacity)は Firestore トランザクションで `soldCount` を増分し超過販売を防ぐ
- 確認書類(学生証等)は個人情報のため、Storage には非公開で保存し
  (`storage.rules` で読み書きとも `false`)、`/api/checkout` が Admin SDK で書き込み、
  `/api/registrations/[id]/verification-image` が org メンバー確認の上でバイナリを
  直接返す。Signed URL は使わない(Storage エミュレータでの署名生成が環境依存で
  失敗するため、本番・エミュレータ双方で同じコードパスにしている)
- **確認書類は審査後に自動破棄する**: 承認/却下の確定
  (`/api/registrations/[id]/verification-review`)と同時に Storage から画像を削除し、
  `verificationImagePath` を null にする。個人情報を保持し続けないための設計で、
  審査は取り消せない一回きりの操作(UI で confirm を挟む)。申込フォーム・申込者一覧の
  両方に「確認後に破棄される」旨を明記する。なお運用としては、事前アップロードを
  使わず**現地で学生証を目視確認する**選択も可能(その場合は審査せずに当日確認する)
- **無料チケット(¥0)は Stripe を一切経由しない**: `/api/checkout` は ¥0 なら
  Stripe 接続チェックの前に即時確定するため、主催者が Stripe 未接続でも
  無料イベント・無料枠(学生無料等)は開催できる。有料チケットは Stripe の
  JPY 最低決済金額の制約で ¥50 以上のみ(¥1〜49 はフォームとAPIの両方で拒否)

## 6. 画面構成

```
/                       … サービスLP
/login, /signup         … 認証
/dashboard              … Organization ダッシュボード(イベント一覧)
/dashboard/events/new
/dashboard/events/[id]          … 概要・申込状況(リアルタイム)・カバー画像
/dashboard/events/[id]/sessions … セッション・登壇者管理(写真アップロード)
/dashboard/events/[id]/banner   … 告知バナー自動生成(Wide/Square/Story・ダウンロード)
/dashboard/events/[id]/tickets  … チケット種別管理
/dashboard/events/[id]/attendees … 申込者一覧・CSV
/dashboard/events/[id]/checkin  … PWA QRスキャナー
/dashboard/settings/payments    … Stripe Connect オンボーディング
/admin                          … マスター管理: プラットフォーム全体サマリー
/admin/organizations            … マスター管理: 全組織一覧(検索・ソート)
/admin/organizations/[orgId]    … マスター管理: 組織詳細(イベント別の申込・売上)
/e/[slug]               … 公開イベントページ(LP)
/e/[slug]/register      … 申込フォーム → Stripe Checkout
/t/[ticketId]           … QRチケット表示(メールのリンク先)
/api/checkout           … Checkout Session 作成(確認書類の画像アップロードも受付)
/api/webhooks/stripe    … 決済確定 → registration confirm + メール送信
/api/checkin            … qrToken 検証 + チェックイン記録
/api/banner/[eventId]   … イベント全体の告知バナー生成(?size=wide|square|story, ?download=1)
/api/banner/[eventId]/sessions/[sessionId] … セッション単位の告知バナー生成(登壇者の顔写真が主役)
/api/registrations/[id]/verification-image … 確認書類の画像を返す(org メンバーのみ)
/api/admin/summary              … 全体サマリー+組織一覧(マスター管理者のみ)
/api/admin/organizations/[orgId] … 組織詳細(マスター管理者のみ)
```

告知バナーは公開LPと同じレンダラー(`src/lib/server/bannerImage.tsx`)を使い、
`opengraph-image.tsx`(SNSシェア時の自動プレビュー)とダッシュボードの
バナーダウンロード機能の両方から呼び出す。テンプレート・テーマカラー・
登壇者の顔写真はイベントの設定からそのまま反映され、手動でのデザイン作業は不要。

**カンファレンスは複数のセッション(コンテンツ)が集まって完成するため、
バナーはイベント全体だけでなくセッション単位でも生成できる**。ダッシュボードの
バナー画面で「対象」をイベント全体/各セッションから選べる。セッションバナーは
登壇者(複数名)の顔写真・氏名・肩書を主役として大きく配置する
(`renderSessionBannerImage` / `SpeakerShowcase`)。登壇者の顔写真は
登壇者管理画面(`/dashboard/events/[id]/speakers`)でアップロードすればそのまま反映される。

Satori(`next/og` のレンダラー)は `text-overflow: ellipsis` の挙動が不安定なため、
バナー内の短いラベル(登壇者名・会社・肩書・イベント名)は表示前に文字数で
切り詰める(`truncate`ヘルパー)。また Wide(1200×630、縦が狭い)サイズでは
登壇者カードを `compact` 表示にして確実に収める。

## 7. 非機能要件

- 受付スキャナーは回線が細い会場でも動くこと(PWA・楽観的UI・再送キュー)
- Firestore Security Rules で org メンバー以外の管理データアクセスを遮断
- 決済金額はサーバー側で ticketType から算出(クライアント提示額を信用しない)
- 個人情報(申込者)は org 単位で分離。公開ページには一切露出しない
