"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/products";
import { useCart } from "./cart-provider";
import styles from "./checkout-form.module.css";

type Result = { orderId?: string; message: string };

export function CheckoutForm() {
  const { lines, itemCount, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const total = lines.reduce((sum, line) => {
    const product = products.find((entry) => entry.id === line.productId);

    return sum + (product?.price ?? 0) * line.quantity;
  }, 0);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, itemCount }),
    });
    const responseResult = (await response.json()) as Result;

    setSubmitting(false);
    setResult(responseResult);

    if (response.ok) clearCart();
  }

  if (result?.orderId) {
    return (
      <section className={styles.confirmation} aria-live="polite">
        <p className="supporting-text">Order {result.orderId}</p>
        <h2>Your sample order is packed.</h2>
        <p>{result.message}</p>
        <Link className="primary-button" href="/shop">
          Keep browsing
        </Link>
      </section>
    );
  }

  if (itemCount === 0) {
    return (
      <section className={styles.empty}>
        <h2>Your trip kit is empty.</h2>
        <p>Add at least one item before you check out.</p>
        <Link className="primary-button" href="/shop">
          Browse gear
        </Link>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={placeOrder}>
        <fieldset>
          <legend>Contact</legend>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </fieldset>

        <fieldset>
          <legend>Delivery</legend>
          <div className={styles.row}>
            <label>
              First name
              <input name="firstName" autoComplete="given-name" required />
            </label>
            <label>
              Last name
              <input name="lastName" autoComplete="family-name" required />
            </label>
          </div>
          <label>
            Street address
            <input name="address" autoComplete="street-address" required />
          </label>
          <div className={styles.row}>
            <label>
              City
              <input name="city" autoComplete="address-level2" required />
            </label>
            <label>
              Postal code
              <input name="postalCode" autoComplete="postal-code" required />
            </label>
          </div>
        </fieldset>

        {result && (
          <p className={styles.error} role="alert">
            {result.message}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Placing sample order..." : "Place sample order"}
        </button>
      </form>

      <aside className={styles.summary}>
        <h2>Trip kit</h2>
        <ul>
          {lines.map((line) => {
            const product = products.find(
              (entry) => entry.id === line.productId,
            );

            if (!product) return null;

            return (
              <li key={line.productId}>
                <span>
                  {product.name} × {line.quantity}
                </span>
                <strong>{formatPrice(product.price * line.quantity)}</strong>
              </li>
            );
          })}
        </ul>
        <p>
          <span>Estimated total</span>
          <strong>{formatPrice(total)}</strong>
        </p>
      </aside>
    </div>
  );
}
