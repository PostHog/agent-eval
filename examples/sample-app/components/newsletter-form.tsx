"use client";

import { type FormEvent, useId, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const emailId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const result = (await response.json()) as { message: string };

    setMessage(result.message);
    setStatus(response.ok ? "success" : "error");

    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="newsletter-form" onSubmit={subscribe}>
      <label htmlFor={emailId}>Email address</label>
      <div>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Joining..." : "Join the list"}
        </button>
      </div>
      <p aria-live="polite" data-status={status}>
        {message}
      </p>
    </form>
  );
}
