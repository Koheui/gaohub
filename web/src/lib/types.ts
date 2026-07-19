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
  /** 主催者が定義する参加者カテゴリ(例: 運営者/投資家/支援者/スタートアップ) */
  loungeCategories: string[];
  /** セッションの「トラック/会場」欄で選択できる会場名の一覧(主催者が管理) */
  tracks: string[];
  /** 申込フォームに追加する主催者定義のカスタム質問項目 */
  registrationFields: RegistrationFieldDef[];
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
