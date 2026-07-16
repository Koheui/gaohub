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
export type EventTemplate = "kodak" | "noir" | "aurora";

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
  venueName: string;
  venueAddress: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  status: EventStatus;
  createdAt: Timestamp;
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
  createdAt: Timestamp;
}

export type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled";

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
  createdAt: Timestamp;
}
