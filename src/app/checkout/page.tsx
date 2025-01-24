'use client';

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const handleCheckout = async () => {
    const stripe = await stripePromise;

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const { sessionId } = await response.json();

    if (sessionId) {
      stripe?.redirectToCheckout({ sessionId });
    } else {
      console.error('Failed to create a checkout session');
    }
  };

  return (
    <div>
      <h1>Stripe Checkout Example</h1>
      <button onClick={handleCheckout}>Go to Checkout</button>
    </div>
  );
}
