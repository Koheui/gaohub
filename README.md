# Neo EventHub

カンファレンス等のイベントについて「開催準備 → 集客 → チケット決済 → 当日QR受付」を
ワンストップで提供するマルチテナント SaaS。ベンチマークと要件は
[docs/requirements.md](docs/requirements.md) を参照。

## 構成

- `web/` — Next.js (App Router) アプリ本体。Vercel にデプロイ
- `docs/` — 要件定義・ベンチマーク資料

スタック: Next.js / Firebase (Auth + Firestore) / Stripe Connect / Resend / Vercel / Cloudflare

## セットアップ

### 1. Firebase

1. [Firebase Console](https://console.firebase.google.com) でプロジェクト作成
2. **Authentication** → ログイン方法で「メール/パスワード」と「Google」を有効化
3. **Firestore Database** を作成(ロケーション: `asia-northeast1` 推奨)
4. ルールとインデックスをデプロイ:
   ```bash
   cd web
   npx firebase-tools deploy --only firestore  # firebase.json を使用
   ```
5. プロジェクトの設定 → サービスアカウント → 新しい秘密鍵を生成し、base64 化:
   ```bash
   base64 -i serviceAccount.json | tr -d '\n'
   ```

### 2. Stripe

1. [Stripe ダッシュボード](https://dashboard.stripe.com)で API キー(シークレット)を取得
2. **Connect** を有効化(Express アカウント / 日本)
3. Webhook エンドポイントを追加: `https://<your-domain>/api/webhooks/stripe`
   - イベント: `checkout.session.completed`, `checkout.session.expired`, `account.updated`
   - 署名シークレット(`whsec_...`)を控える
   - ローカル開発: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 3. Resend

1. [Resend](https://resend.com) で API キーを発行
2. 送信ドメインを認証し `EMAIL_FROM` を設定(未設定時はメール送信をスキップして動作)

### 4. 環境変数

```bash
cd web
cp .env.example .env.local
# 各値を記入
```

### 5. 起動

```bash
cd web
npm install
npm run dev
```

## MVPの流れ

1. `/login` でサインアップ → 組織を登録
2. ダッシュボードでイベント作成 → チケット種別を追加(無料/有料)
3. 有料チケットを売る場合は「決済設定」から Stripe Connect をオンボーディング
4. イベントを「公開」→ `/e/{slug}` が集客ページになる
5. 参加者が申込(有料は Stripe Checkout)→ QRチケットがメールで届く
6. 当日はダッシュボードの「受付(QRスキャン)」をスマホで開いてチェックイン

## 設計メモ

- 決済確定は Stripe Webhook (`checkout.session.completed`) のみを信頼
- 在庫は Firestore トランザクションで `soldCount` を管理
- QRの中身は推測不能な `qrToken`(128bit)のみ。チェックイン API がサーバー側で解決
- 管理系データへのアクセスは Firestore Security Rules で org メンバーに限定
