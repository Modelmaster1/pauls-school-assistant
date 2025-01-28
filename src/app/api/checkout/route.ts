import { NextResponse } from 'next/server';
import stripe from '~/lib/stripe';

export async function POST(req: Request) {
  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: "price_1Qko7MHOfTu6w2Dh7dgxnU89",
          quantity: 1,
        },],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}?checkoutID={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}?checkoutID={CHECKOUT_SESSION_ID}`,
      custom_fields: [
        {
          key: "jokeField",
          label: {
            type: "custom",
            custom: "Tell us a joke"
          },
          type: "text",
          optional: true,
        }
      ],
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}