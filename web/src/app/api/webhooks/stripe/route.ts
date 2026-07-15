import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import { sendTicketEmail } from "@/lib/email";
import { appUrl, formatDateRange } from "@/lib/format";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const db = adminDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const registrationId = session.metadata?.registrationId;
      if (!registrationId) break;

      const regRef = db.doc(`registrations/${registrationId}`);
      const regSnap = await regRef.get();
      if (!regSnap.exists || regSnap.get("status") === "confirmed") break; // 冪等

      const ticketRef = db.doc(
        `events/${regSnap.get("eventId")}/ticketTypes/${regSnap.get("ticketTypeId")}`
      );
      await db.runTransaction(async (tx) => {
        tx.update(ticketRef, { soldCount: FieldValue.increment(1) });
        tx.update(regRef, {
          status: "confirmed",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          paidAt: FieldValue.serverTimestamp(),
        });
      });

      // 申込完了メール
      const eventSnap = await db.doc(`events/${regSnap.get("eventId")}`).get();
      if (eventSnap.exists) {
        await sendTicketEmail({
          to: regSnap.get("attendee").email,
          attendeeName: regSnap.get("attendee").name,
          eventTitle: eventSnap.get("title"),
          eventDateText: formatDateRange(
            eventSnap.get("startsAt").toDate(),
            eventSnap.get("endsAt").toDate()
          ),
          venueName: eventSnap.get("venueName") ?? "",
          ticketUrl: appUrl(`/t/${registrationId}?k=${regSnap.get("qrToken")}`),
        }).catch((e) => console.error("[webhook] ticket email failed:", e));
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const registrationId = session.metadata?.registrationId;
      if (!registrationId) break;
      const regRef = db.doc(`registrations/${registrationId}`);
      const regSnap = await regRef.get();
      if (regSnap.exists && regSnap.get("status") === "pending_payment") {
        await regRef.update({ status: "cancelled" });
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      const orgId = account.metadata?.orgId;
      if (orgId) {
        await db
          .doc(`organizations/${orgId}`)
          .update({ stripeOnboarded: !!account.charges_enabled })
          .catch(() => {});
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
