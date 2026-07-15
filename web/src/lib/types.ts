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

export interface EventDoc {
  id: string;
  orgId: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  themeColor: string;
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
