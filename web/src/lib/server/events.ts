import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { EventTemplate } from "@/lib/types";

export interface PublicTicketType {
  id: string;
  name: string;
  description: string;
  priceJpy: number;
  soldOut: boolean;
  requiresVerification: boolean;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  coverImageUrl: string | null;
  themeColor: string;
  template: EventTemplate;
  /** ヒーロー背景の巨大アウトライン文字。空なら開催年を自動表示 */
  ghostText: string;
  showGhostText: boolean;
  showMarquee: boolean;
  statsStyle: "classic" | "poster";
  venueName: string;
  venueAddress: string;
  startsAt: Date;
  endsAt: Date;
  loungeEnabled: boolean;
  loungeCategories: string[];
}

export interface PublicSpeaker {
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
}

export interface PublicSession {
  id: string;
  title: string;
  description: string;
  track: string;
  startsAt: Date;
  endsAt: Date;
  speakerIds: string[];
  isComingSoon: boolean;
  capacity: number | null;
  reservedCount: number;
}

function toPublicEvent(id: string, d: FirebaseFirestore.DocumentData): PublicEvent {
  return {
    id,
    slug: d.slug,
    title: d.title,
    tagline: d.tagline ?? "",
    description: d.description ?? "",
    coverImageUrl: d.coverImageUrl ?? null,
    themeColor: d.themeColor ?? "#18181b",
    template: (d.template as EventTemplate) ?? "kodak",
    ghostText: d.ghostText ?? "",
    showGhostText: d.showGhostText ?? true,
    showMarquee: d.showMarquee ?? true,
    statsStyle: (d.statsStyle as "classic" | "poster") ?? "classic",
    venueName: d.venueName ?? "",
    venueAddress: d.venueAddress ?? "",
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    loungeEnabled: d.loungeEnabled ?? false,
    loungeCategories: d.loungeCategories ?? [],
  };
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEvent | null> {
  const snap = await adminDb()
    .collection("events")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toPublicEvent(doc.id, doc.data());
}

/** ダッシュボード(バナー生成など)向け: 公開状態を問わず取得する */
export async function getEventById(eventId: string): Promise<PublicEvent | null> {
  const snap = await adminDb().doc(`events/${eventId}`).get();
  if (!snap.exists) return null;
  return toPublicEvent(snap.id, snap.data()!);
}

export async function getPublicTicketTypes(eventId: string): Promise<PublicTicketType[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("ticketTypes")
    .where("isActive", "==", true)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      description: d.description ?? "",
      priceJpy: d.priceJpy ?? 0,
      soldOut: (d.soldCount ?? 0) >= (d.capacity ?? 0),
      requiresVerification: d.requiresVerification ?? false,
    };
  });
}

export async function getPublicSpeakers(eventId: string): Promise<PublicSpeaker[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("speakers")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      title: d.title ?? "",
      company: d.company ?? "",
      photoUrl: d.photoUrl ?? null,
      bio: d.bio ?? "",
      websiteUrl: d.websiteUrl ?? "",
      xUrl: d.xUrl ?? "",
      instagramUrl: d.instagramUrl ?? "",
      linkedinUrl: d.linkedinUrl ?? "",
      facebookUrl: d.facebookUrl ?? "",
    };
  });
}

function toPublicSession(id: string, d: FirebaseFirestore.DocumentData): PublicSession {
  return {
    id,
    title: d.title,
    description: d.description ?? "",
    track: d.track ?? "",
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    speakerIds: d.speakerIds ?? [],
    isComingSoon: d.isComingSoon ?? false,
    capacity: d.capacity ?? null,
    reservedCount: d.reservedCount ?? 0,
  };
}

export async function getPublicSessions(eventId: string): Promise<PublicSession[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .orderBy("startsAt", "asc")
    .get();
  return snap.docs.map((doc) => toPublicSession(doc.id, doc.data()));
}

/** バナー生成など、単一セッションだけが必要な場面向け */
export async function getSessionById(
  eventId: string,
  sessionId: string
): Promise<PublicSession | null> {
  const snap = await adminDb().doc(`events/${eventId}/sessions/${sessionId}`).get();
  if (!snap.exists) return null;
  return toPublicSession(snap.id, snap.data()!);
}

/** speakerIds に対応する登壇者を、セッションでの登場順で返す */
export function pickSpeakers(all: PublicSpeaker[], speakerIds: string[]): PublicSpeaker[] {
  const byId = new Map(all.map((s) => [s.id, s]));
  return speakerIds.map((id) => byId.get(id)).filter((s): s is PublicSpeaker => !!s);
}
