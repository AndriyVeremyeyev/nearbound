"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CurrentUser } from "@/lib/auth-session";
import { authClient } from "../lib/auth-client";

type AccountMenuProps = {
  currentUser: CurrentUser | null;
};

export function AccountMenu({ currentUser }: AccountMenuProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!currentUser) {
    return <Link className="account-link" href="/account">Sign in</Link>;
  }

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="account-menu">
      <Link href="/account" title={currentUser.email}>{currentUser.name}</Link>
      <button type="button" onClick={signOut} disabled={isSigningOut}>
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
