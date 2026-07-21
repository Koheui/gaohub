import type { Timestamp } from "firebase/firestore";

export type OrgRole = "owner" | "admin" | "staff";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  orgId: string | null;
  createdAt: Timestamp;
}

export type EventStatus = "draft" | "published" | "ended";

/** 公開LPのテンプレート */
export type EventTemplate = "kodak" | "spectrum" | "aurora";

export interface EventDoc {
  id: string;
  orgId: string;
  slug: string;
  title: string;
  /** キャッチコピー(ヒーローでアニメーション表示) */
  tagline: string;
  description: string;
  coverImageUrl: string | null;
  themeColor: string;
  template: EventTemplate;
  /** ヒーロー背景の巨大アウトライン文字。空なら開催年を自動表示 */
  ghostText: string;
  /** ヒーロー背景の巨大アウトライン文字を表示するか */
  showGhostText: boolean;
  /** イベント名が流れるマーキー帯を表示するか */
  showMarquee: boolean;
  /** 統計+カウントダウンの見せ方。classic=枠付きストリップ / poster=枠なし特大数字 */
  statsStyle: "classic" | "poster";
  venueName: string;
  venueAddress: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  status: EventStatus;
  /** チケット購入者向けコミュニティラウンジを有効化するか */
  loungeEnabled: boolean;
  /** ラウンジに参加できる対象。all=全参加者 / paid=有料チケットの参加者のみ */
  loungeAccess: "all" | "paid";
  /** 主催者が定義する参加者カテゴリ(例: 運営者/投資家/支援者/スタートアップ) */
  loungeCategories: string[];
  /** セッションの「会場」欄で選択できる会場名の一覧(主催者が管理) */
  tracks: string[];
  /** 各会場(トラック)のテーマカラー設定 (会場名 -> カラーコードHex) */
  trackColors?: Record<string, string>;
  /** 申込フォームに追加する主催者定義のカスタム質問項目 */
  registrationFields: RegistrationFieldDef[];
  /** 申込フォームで「会社名」欄を表示するか(氏名・メールアドレスは常時必須のため対象外) */
  askCompany: boolean;
  /** 「会社名」欄を必須にするか(askCompanyがfalseの場合は無視) */
  requireCompany: boolean;
  /** 申込フォームで「役職」欄を表示するか */
  askJobTitle: boolean;
  /** 「役職」欄を必須にするか(askJobTitleがfalseの場合は無視) */
  requireJobTitle: boolean;
  /** 「会社名」欄の入力形式。text=自由入力 / select=プルダウン(companyFieldOptionsから選択) */
  companyFieldType: "text" | "select";
  companyFieldOptions: string[];
  /** 「役職」欄の入力形式。text=自由入力 / select=プルダウン(jobTitleFieldOptionsから選択) */
  jobTitleFieldType: "text" | "select";
  jobTitleFieldOptions: string[];
  /** スポンサーの序列(先頭ほど上位)。例: ["プラチナ","ゴールド","シルバー"] */
  sponsorTiers: string[];
  createdAt: Timestamp;
}

export type RegistrationFieldType = "text" | "textarea" | "select" | "checkbox";

/** 申込フォームの主催者カスタム質問。回答は Registration.customAnswers[id] に保存 */
export interface RegistrationFieldDef {
  id: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  /** type === "select" の場合の選択肢 */
  options: string[];
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  /** 0 = free */
  priceJpy: number;
  capacity: number;
  soldCount: number;
  isActive: boolean;
  /** true の場合、申込時に確認書類(学生証など)の画像アップロードを必須にする */
  requiresVerification: boolean;
  createdAt: Timestamp;
}

/** 登壇者(イベント配下の独立コレクション。詳細ページを持つ) */
export interface SpeakerDoc {
  id: string;
  name: string;
  title: string;
  company: string;
  photoUrl: string | null;
  bio: string;
  /** ラウンジからのメッセージ受信用(公開ページには一切出さない)。空なら受信不可 */
  email: string;
  websiteUrl: string;
  xUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  createdAt: Timestamp;
}

export interface SessionDoc {
  id: string;
  title: string;
  description: string;
  track: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  /** events/{id}/speakers への参照 */
  speakerIds: string[];
  /** true の場合「Coming Soon」として扱う(時刻非表示・予約不可)。詳細が決まる前に告知したいセッション向け */
  isComingSoon: boolean;
  /** 予約定員。null = 無制限 */
  capacity: number | null;
  /** 予約済み人数(capacity に対するトランザクションカウンタ) */
  reservedCount: number;
  /** 手動アップロードされたバナー画像。設定時は自動生成の代わりにこの画像を使用する */
  customBannerUrl: string | null;
  createdAt: Timestamp;
}

export type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled";

/** 確認書類(学生証等)の審査ステータス。書類提出が不要なチケットでは null のまま */
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Attendee {
  name: string;
  email: string;
  company: string;
  jobTitle: string;
}

export interface Registration {
  id: string;
  eventId: string;
  orgId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  attendee: Attendee;
  status: RegistrationStatus;
  amountJpy: number;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: Timestamp | null;
  qrToken: string;
  checkedInAt: Timestamp | null;
  checkedInBy: string | null;
  /** Storage 内パス(gs:// を含まない相対パス)。個人情報のため生URLはどこにも保存しない */
  verificationImagePath: string | null;
  verificationStatus: VerificationStatus | null;
  /** 予約済みセッションID一覧(events/{eventId}/sessions への参照) */
  reservedSessionIds: string[];
  /** 主催者定義のカスタム質問(EventDoc.registrationFields)への回答。key は RegistrationFieldDef.id */
  customAnswers: Record<string, string>;
  /** 申込時に「コミュニティラウンジに参加する」へチェックしたか。確定時にプロフィールを自動作成する */
  joinLounge: boolean;
  createdAt: Timestamp;
}

/** スポンサー企業(イベント配下の独立コレクション) */
export interface SponsorDoc {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  /** event.sponsorTiers のいずれか(主催者が定義した序列)。未設定は "" */
  tier: string;
  createdAt: Timestamp;
}

export type SurveyStatus = "draft" | "scheduled" | "sent";
/** 送付対象。all=確定者全員 / paid=有料チケット / checkedIn=当日チェックイン済み */
export type SurveyAudience = "all" | "paid" | "checkedIn";

/** アンケート(イベント配下のコレクション)。events/{id}/surveys/{surveyId} */
export interface SurveyDoc {
  id: string;
  title: string;
  description: string;
  /** 質問項目(申込フォームのカスタム質問と同じ形式) */
  questions: RegistrationFieldDef[];
  audience: SurveyAudience;
  status: SurveyStatus;
  /** 予約送信の日時。status=scheduled のとき cron が拾って送信する */
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  sentCount: number;
  responseCount: number;
  createdAt: Timestamp;
}

/** アンケート回答。events/{id}/surveys/{surveyId}/responses/{registrationId} */
export interface SurveyResponseDoc {
  id: string; // == registrationId
  registrationId: string;
  attendeeName: string;
  answers: Record<string, string>;
  submittedAt: Timestamp;
}

/** コミュニティラウンジのカテゴリ別参加者プロフィール。events/{id}/loungeProfiles/{registrationId} */
export interface LoungeProfileDoc {
  id: string; // == registrationId
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  /** event.loungeCategories のいずれか(主催者が定義したジャンル) */
  category: string;
  bio: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
