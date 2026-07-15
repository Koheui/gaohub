import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { applicationFeeAmount, getStripe } from "@/lib/stripe";
import { sendTicketEmail } from "@/lib/email";
import { appUrl, formatDateRange } from "@/lib/format";

interface CheckoutBody {
  eventId: string;
  ticketTypeId: string;
  attendee: { name: string; email: string; company?: string; jobTitle?: string };
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }

  const name = body.attendee?.name?.trim();
  const email = body.attendee?.email?.trim();
  if (!body.eventId || !body.ticketTypeId || !name || !email) {
    return bad("必須項目が不足しています");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("メールアドレスの形式が不正です");

  const db = adminDb();
  const eventSnap = await db.doc(`events/${body.eventId}`).get();
  if (!eventSnap.exists || eventSnap.get("status") !== "published") {
    return bad("イベントが見つかりません", 404);
  }
  const ticketSnap = await db
    .doc(`events/${body.eventId}/ticketTypes/${body.ticketTypeId}`)
    .get();
  if (!ticketSnap.exists || !ticketSnap.get("isActive")) {
    return bad("チケットが見つかりません", 404);
  }

  const priceJpy: number = ticketSnap.get("priceJpy") ?? 0;
  const orgId: string = eventSnap.get("orgId");
  const qrToken = crypto.randomBytes(16).toString("hex");

  const registration = {
    eventId: body.eventId,
    orgId,
    ticketTypeId: body.ticketTypeId,
    ticketTypeName: ticketSnap.get("name") as string,
    attendee: {
      name,
      email,
      company: body.attendee.company?.trim() ?? "",
      jobTitle: body.attendee.jobTitle?.trim() ?? "",
    },
    amountJpy: priceJpy,
    stripeSessionId: null as string | null,
    stripePaymentIntentId: null as string | null,
    paidAt: null,
    qrToken,
    checkedInAt: null,
    checkedInBy: null,
    createdAt: FieldValue.serverTimestamp(),
  };

  const eventTitle: string = eventSnap.get("title");
  const dateText = formatDateRange(
    eventSnap.get("startsAt").toDate(),
    eventSnap.get("endsAt").toDate()
  );
  const venueName: string = eventSnap.get("venueName") ?? "";

  // ---- 無料チケット: 即時確定 ----
  if (priceJpy === 0) {
    const regRef = db.collection("registrations").doc();
    try {
      await db.runTransaction(async (tx) => {
        const t = await tx.get(ticketSnap.ref);
        if ((t.get("soldCount") ?? 0) >= (t.get("capacity") ?? 0)) {
          throw new Error("SOLD_OUT");
        }
        tx.update(ticketSnap.ref, { soldCount: FieldValue.increment(1) });
        tx.set(regRef, { ...registration, status: "confirmed" });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "SOLD_OUT") {
        return bad("このチケットは売り切れました");
      }
      throw err;
    }

    const ticketUrl = appUrl(`/t/${regRef.id}?k=${qrToken}`);
    await sendTicketEmail({
      to: email,
      attendeeName: name,
      eventTitle,
      eventDateText: dateText,
      venueName,
      ticketUrl,
    }).catch((e) => console.error("[checkout] ticket email failed:", e));

    return NextResponse.json({ url: ticketUrl });
  }

  // ---- 有料チケット: Stripe Checkout ----
  if ((ticketSnap.get("soldCount") ?? 0) >= (ticketSnap.get("capacity") ?? 0)) {
    return bad("このチケットは売り切れました");
  }

  const orgSnap = await db.doc(`organizations/${orgId}`).get();
  const stripeAccountId = orgSnap.get("stripeAccountId") as string | null;
  const stripeOnboarded = orgSnap.get("stripeOnboarded") as boolean;
  if (!stripeAccountId || !stripeOnboarded) {
    return bad("主催者の決済設定が完了していないため、有料チケットを購入できません");
  }

  const regRef = db.collection("registrations").doc();
  await regRef.set({ ...registration, status: "pending_payment" });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: priceJpy,
          product_data: {
            name: `${eventTitle} — ${registration.ticketTypeName}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount(priceJpy),
      transfer_data: { destination: stripeAccountId },
    },
    metadata: { registrationId: regRef.id },
    success_url: appUrl(`/t/${regRef.id}?k=${qrToken}`),
    cancel_url: appUrl(`/e/${eventSnap.get("slug")}`),
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await regRef.update({ stripeSessionId: session.id });

  return NextResponse.json({ url: session.url });
}
