import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/format";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const db = adminDb();
  const userSnap = await db.doc(`users/${uid}`).get();
  const orgId = userSnap.get("orgId") as string | null;
  if (!orgId) return NextResponse.json({ error: "組織が未登録です" }, { status: 400 });

  const memberSnap = await db.doc(`organizations/${orgId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const orgRef = db.doc(`organizations/${orgId}`);
  const orgSnap = await orgRef.get();
  let accountId = orgSnap.get("stripeAccountId") as string | null;

  const stripe = getStripe();
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "JP",
      metadata: { orgId },
    });
    accountId = account.id;
    await orgRef.update({ stripeAccountId: accountId });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: appUrl("/dashboard/settings/payments"),
    return_url: appUrl("/dashboard/settings/payments?onboarded=1"),
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
