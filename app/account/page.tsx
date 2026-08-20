import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth-session";
import { loadSavedOrigins, loadUserProfile, loadVisitedPlaces } from "@/lib/trips/repository";
import { AccountPanel } from "../account-panel";
import { ProfileSettings } from "../profile-settings";
import { VisitedPlaces } from "../visited-places";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account — Nearbound",
  description: "Sign in to keep your Nearbound travel context.",
};

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  const [profile, savedOrigins, visitedPlaces] = currentUser
    ? await Promise.all([
        loadUserProfile(currentUser.id),
        loadSavedOrigins(currentUser.id),
        loadVisitedPlaces(currentUser.id),
      ])
    : [null, [], []];

  return (
    <main className="account-page">
      <header className="detail-header">
        <Link className="brand" href="/" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </Link>
        <Link className="detail-back" href="/">← Back to planner</Link>
      </header>
      {currentUser && profile ? (
        <>
          <ProfileSettings
            profile={profile}
            savedOrigins={savedOrigins}
            fallbackName={currentUser.name}
            email={currentUser.email}
          />
          <section className="account-history">
            <p className="eyebrow">Your history</p>
            <h1>Visited places</h1>
            <VisitedPlaces initialPlaces={visitedPlaces} />
          </section>
        </>
      ) : (
        <div className="account-shell">
          <div className="account-promise" aria-hidden="true">
            <span>01</span><strong>Choose</strong><span>02</span><strong>Visit</strong><span>03</span><strong>Remember</strong>
          </div>
          <AccountPanel currentUser={null} />
        </div>
      )}
    </main>
  );
}
