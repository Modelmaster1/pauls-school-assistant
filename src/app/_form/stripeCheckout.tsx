"use client";
import { loadStripe } from "@stripe/stripe-js";
import { Check, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { FormType } from "./funcAndModel";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function RedirectToStripeCheckout({
  checkoutID,
  setCustomerID,
  setCurrentStep,
}: {
  checkoutID: string | null;
  setCustomerID: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<FormType>>;
}) {
  useEffect(() => {
    if (checkoutID)
      verifyCheckout(checkoutID).then((data) => {
        if (data.success) {
          setCustomerID(data.customer);
          setCurrentStep(5+ 1);
        } else {
          console.error("Payment verification failed:", data.error);
        }
      });
  }, [checkoutID]);

  async function redirect() {
    const stripe = await stripePromise;

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const { sessionId } = await response.json();

    if (sessionId) {
      stripe?.redirectToCheckout({ sessionId });
    } else {
      console.error("Failed to create a checkout session");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">Upgrade to Premium</div>
      <div className="text-sm opacity-60">
        Get access to enhanced features and support the development of Paul's
        School Assistant.
      </div>
      <div className="mt-4 space-y-3">
        <LabelItem
          title="Priority Notifications"
          description="Get instant notifications about changes in your schedule"
        />
        <LabelItem
          title="Extended History"
          description="Access your complete schedule history"
        />
        <LabelItem
          title="Premium Support"
          description="Get priority support and feature requests"
        />
      </div>
      <div className="mt-6">
        <Button
          onClick={redirect}
          disabled={checkoutID != null}
          className="w-full"
          variant="default"
        >
          {checkoutID == null ? (
            "Upgrade to Premium"
          ) : (
            <>
              <LoaderCircle className="animate-spin" />
              <span className="">Verifying Payment</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LabelItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-full bg-neutral-800 p-1.5">
        <Check size={15} />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm opacity-60">{description}</div>
      </div>
    </div>
  );
}

interface CheckoutVerificationResult {
  success: boolean;
  error?: string;
  customer?: any;
}

async function verifyCheckout(
  checkoutID: string,
): Promise<CheckoutVerificationResult> {
  try {
    const response = await fetch("/api/getCustomer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutID }),
    });

    const data = await response.json();
    if (response.ok && data.customer) {
      return { success: true, customer: data.customer };
    } else {
      return { success: false, error: data.error || "Verification failed" };
    }
  } catch (error) {
    console.error("Error verifying checkout:", error);
    return { success: false, error: "Failed to verify checkout" };
  }
}
