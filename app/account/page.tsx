import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth-session";
import { AccountPanel } from "../account-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account — Nearbound",
  description: "Sign in to keep your Nearbound travel context.",
};

export default async function AccountPage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="account-page">
      <header className="detail-header">
        <Link className="brand" href="/" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </Link>
        <Link className="detail-back" href="/">← Back to planner</Link>
      </header>
      <div className="account-shell">
        <div className="account-promise" aria-hidden="true">
          <span>01</span>
          <strong>Choose</strong>
          <span>02</span>
          <strong>Visit</strong>
          <span>03</span>
          <strong>Remember</strong>
        </div>
        <AccountPanel currentUser={currentUser} />
      </div>
    </main>
  );
}
