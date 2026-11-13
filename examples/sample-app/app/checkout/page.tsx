import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Northstar Supply order.",
};

export default function CheckoutPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>One last check before the trail.</h1>
        <p>
          Confirm your kit and delivery details. This sample checkout does not
          collect payment or create a real order.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
