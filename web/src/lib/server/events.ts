import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { EventTemplate } from "@/lib/types";

export interface PublicTicketType {
  id: string;
  name: string;
  description: string;
  priceJpy: number;
  soldOut: boolean;
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
  venueName: string;
  venueAddress: string;
  startsAt: Date;
  endsAt: Date;
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
}

export interface PublicSession {
  id: string;
  title: string;
  description: string;
  track: string;
  startsAt: Date;
  endsAt: Date;
  speakerIds: string[];
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
  const d = doc.data();
  return {
    id: doc.id,
    slug: d.slug,
    title: d.title,
    tagline: d.tagline ?? "",
    description: d.description ?? "",
    coverImageUrl: d.coverImageUrl ?? null,
    themeColor: d.themeColor ?? "#18181b",
    template: (d.template as EventTemplate) ?? "kodak",
    venueName: d.venueName ?? "",
    venueAddress: d.venueAddress ?? "",
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
  };
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
    };
  });
}

export async function getPublicSessions(eventId: string): Promise<PublicSession[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .orderBy("startsAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title,
      description: d.description ?? "",
      track: d.track ?? "",
      startsAt: d.startsAt.toDate(),
      endsAt: d.endsAt.toDate(),
      speakerIds: d.speakerIds ?? [],
    };
  });
}
