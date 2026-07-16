import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { applicationFeeAmount } from "@/lib/stripe";
import type { EventStatus } from "@/lib/types";

export interface PlatformSummary {
  totalOrganizations: number;
  newOrganizationsThisMonth: number;
  totalEvents: number;
  eventsByStatus: Record<EventStatus, number>;
  totalConfirmedRegistrations: number;
  totalRevenueJpy: number;
  totalPlatformFeeJpy: number;
}

export interface OrgSummary {
  id: string;
  name: string;
  createdAt: Date;
  eventCount: number;
  publishedEventCount: number;
  confirmedRegistrations: number;
  revenueJpy: number;
  lastActivityAt: Date | null;
}

export interface AdminOverview {
  summary: PlatformSummary;
  organizations: OrgSummary[];
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 全テナント横断でプラットフォーム全体のサマリと組織別の集計を作る。
 * MVP規模のデータ量を前提に、コレクションを全件取得して JS 側で集計する
 * (件数が増えたら Cloud Functions での事前集計や Firestore の count() 集約に切り替える)。
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const db = adminDb();
  const [orgsSnap, eventsSnap, regsSnap] = await Promise.all([
    db.collection("organizations").get(),
    db.collection("events").get(),
    db.collection("registrations").where("status", "==", "confirmed").get(),
  ]);

  const orgById = new Map<string, OrgSummary>();
  for (const doc of orgsSnap.docs) {
    const d = doc.data();
    orgById.set(doc.id, {
      id: doc.id,
      name: d.name ?? "(無題の組織)",
      createdAt: d.createdAt?.toDate?.() ?? new Date(0),
      eventCount: 0,
      publishedEventCount: 0,
      confirmedRegistrations: 0,
      revenueJpy: 0,
      lastActivityAt: d.createdAt?.toDate?.() ?? null,
    });
  }

  const eventsByStatus: Record<EventStatus, number> = { draft: 0, published: 0, ended: 0 };
  const eventOrgById = new Map<string, string>();

  for (const doc of eventsSnap.docs) {
    const d = doc.data();
    const status: EventStatus = d.status ?? "draft";
    eventsByStatus[status] = (eventsByStatus[status] ?? 0) + 1;
    const orgId: string = d.orgId;
    eventOrgById.set(doc.id, orgId);

    const org = orgById.get(orgId);
    if (!org) continue;
    org.eventCount += 1;
    if (status === "published") org.publishedEventCount += 1;
    const createdAt: Date | undefined = d.createdAt?.toDate?.();
    if (createdAt && (!org.lastActivityAt || createdAt > org.lastActivityAt)) {
      org.lastActivityAt = createdAt;
    }
  }

  let totalRevenueJpy = 0;
  let totalPlatformFeeJpy = 0;

  for (const doc of regsSnap.docs) {
    const d = doc.data();
    const amountJpy: number = d.amountJpy ?? 0;
    totalRevenueJpy += amountJpy;
    if (amountJpy > 0) totalPlatformFeeJpy += applicationFeeAmount(amountJpy);

    const orgId: string = d.orgId;
    const org = orgById.get(orgId);
    if (!org) continue;
    org.confirmedRegistrations += 1;
    org.revenueJpy += amountJpy;
    const createdAt: Date | undefined = d.createdAt?.toDate?.();
    if (createdAt && (!org.lastActivityAt || createdAt > org.lastActivityAt)) {
      org.lastActivityAt = createdAt;
    }
  }

  const monthStart = startOfMonth();
  const organizations = [...orgById.values()].sort(
    (a, b) => b.revenueJpy - a.revenueJpy || b.confirmedRegistrations - a.confirmedRegistrations
  );

  const summary: PlatformSummary = {
    totalOrganizations: orgById.size,
    newOrganizationsThisMonth: organizations.filter((o) => o.createdAt >= monthStart).length,
    totalEvents: eventsSnap.size,
    eventsByStatus,
    totalConfirmedRegistrations: regsSnap.size,
    totalRevenueJpy,
    totalPlatformFeeJpy,
  };

  return { summary, organizations };
}

export interface OrgEventDetail {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  startsAt: Date;
  confirmedRegistrations: number;
  checkedIn: number;
  revenueJpy: number;
  createdAt: Date;
}

export interface OrgDetail {
  id: string;
  name: string;
  createdAt: Date;
  stripeOnboarded: boolean;
  events: OrgEventDetail[];
}

export async function getOrgDetail(orgId: string): Promise<OrgDetail | null> {
  const db = adminDb();
  const orgSnap = await db.doc(`organizations/${orgId}`).get();
  if (!orgSnap.exists) return null;
  const orgData = orgSnap.data()!;

  const [eventsSnap, regsSnap] = await Promise.all([
    db.collection("events").where("orgId", "==", orgId).get(),
    db.collection("registrations").where("orgId", "==", orgId).where("status", "==", "confirmed").get(),
  ]);

  const events = new Map<string, OrgEventDetail>();
  for (const doc of eventsSnap.docs) {
    const d = doc.data();
    events.set(doc.id, {
      id: doc.id,
      title: d.title ?? "(無題のイベント)",
      slug: d.slug ?? "",
      status: d.status ?? "draft",
      startsAt: d.startsAt?.toDate?.() ?? new Date(0),
      confirmedRegistrations: 0,
      checkedIn: 0,
      revenueJpy: 0,
      createdAt: d.createdAt?.toDate?.() ?? new Date(0),
    });
  }

  for (const doc of regsSnap.docs) {
    const d = doc.data();
    const ev = events.get(d.eventId);
    if (!ev) continue;
    ev.confirmedRegistrations += 1;
    ev.revenueJpy += d.amountJpy ?? 0;
    if (d.checkedInAt) ev.checkedIn += 1;
  }

  return {
    id: orgSnap.id,
    name: orgData.name ?? "(無題の組織)",
    createdAt: orgData.createdAt?.toDate?.() ?? new Date(0),
    stripeOnboarded: !!orgData.stripeOnboarded,
    events: [...events.values()].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
  };
}
