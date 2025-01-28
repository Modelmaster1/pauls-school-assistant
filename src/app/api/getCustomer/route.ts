import { NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "~/lib/stripe";

export async function POST(req: Request) {
    const body = await req.json();
    const checkoutID = body.checkoutID;
    
    const session = await stripe.checkout.sessions.retrieve(checkoutID);

    if (session.status === "complete") {
        const customer = session.customer;
        return NextResponse.json({ customer: customer }, { status: 200 });
    }

    return NextResponse.json({ error: "No complete Purchase" }, { status: 500 });
}