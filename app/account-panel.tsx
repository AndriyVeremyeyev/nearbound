"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import type { CurrentUser } from "@/lib/auth-session";
import { authClient } from "../lib/auth-client";

type AccountMode = "sign-in" | "sign-up";

type AccountPanelProps = {
  currentUser: CurrentUser | null;
};

export function AccountPanel({ currentUser }: AccountPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const result = mode === "sign-in"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({
          name: String(formData.get("name") ?? "").trim(),
          email,
          password,
        });

    if (result.error) {
      setError(result.error.message ?? "We could not complete that request.");
      setStatus("idle");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function signOut() {
    setStatus("submitting");
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  if (currentUser) {
    return (
      <section className="account-card account-card-signed-in">
        <p className="eyebrow">Account ready</p>
        <h1>Welcome back, {currentUser.name}.</h1>
        <p>
          You are signed in as <strong>{currentUser.email}</strong>. Saved places
          and preferences arrive in the next product step.
        </p>
        <div className="account-actions">
          <Link className="account-primary-action" href="/">Plan a trip <span aria-hidden="true">→</span></Link>
          <button type="button" onClick={signOut} disabled={status === "submitting"}>
            {status === "submitting" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-card">
      <p className="eyebrow">Optional account</p>
      <h1>{mode === "sign-in" ? "Keep your travel context." : "Create your Nearbound account."}</h1>
      <p className="account-intro">
        Planning stays public. An account will let Nearbound remember your home
        base and learn from the places you visit.
      </p>

      <div className="account-mode" aria-label="Account action">
        <button
          type="button"
          className={mode === "sign-in" ? "active" : ""}
          aria-pressed={mode === "sign-in"}
          onClick={() => { setMode("sign-in"); setError(null); }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "sign-up" ? "active" : ""}
          aria-pressed={mode === "sign-up"}
          onClick={() => { setMode("sign-up"); setError(null); }}
        >
          Create account
        </button>
      </div>

      <form className="account-form" onSubmit={submitAccount}>
        {mode === "sign-up" && (
          <label>
            Your name
            <input name="name" type="text" autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="account-submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting"
            ? "One moment…"
            : mode === "sign-in" ? "Sign in" : "Create account"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="account-privacy">
        Your account is private. The public trip URL never includes your email,
        password, or exact starting point.
      </p>
    </section>
  );
}
