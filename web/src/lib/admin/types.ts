/** /api/admin/* のレスポンス型(JSON化で Date は ISO 文字列になる) */

export interface AdminEventsByStatus {
  draft: number;
  published: number;
  ended: number;
}

export interface AdminPlatformSummary {
  totalOrganizations: number;
  newOrganizationsThisMonth: number;
  totalEvents: number;
  eventsByStatus: AdminEventsByStatus;
  totalConfirmedRegistrations: number;
  totalRevenueJpy: number;
  totalPlatformFeeJpy: number;
}

export interface AdminOrgSummary {
  id: string;
  name: string;
  createdAt: string;
  eventCount: number;
  publishedEventCount: number;
  confirmedRegistrations: number;
  revenueJpy: number;
  lastActivityAt: string | null;
}

export interface AdminOverview {
  summary: AdminPlatformSummary;
  organizations: AdminOrgSummary[];
}

export interface AdminOrgEvent {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "ended";
  startsAt: string;
  confirmedRegistrations: number;
  checkedIn: number;
  revenueJpy: number;
  createdAt: string;
}

export interface AdminOrgDetail {
  id: string;
  name: string;
  createdAt: string;
  stripeOnboarded: boolean;
  events: AdminOrgEvent[];
}
