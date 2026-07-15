import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}

/** プラットフォーム手数料(basis points)。例: 150 = 1.5% */
export function platformFeeBps(): number {
  return Number(process.env.PLATFORM_FEE_BPS ?? "150");
}

export function applicationFeeAmount(amountJpy: number): number {
  return Math.floor((amountJpy * platformFeeBps()) / 10000);
}
