import { ClaimClient } from "./claim-client";

/**
 * Magic-link landing page. After Supabase exchanges the code for a session,
 * we end up here with `?name=...` carried through. Client component reads
 * the name, issues the cert via server action, and redirects to /cert/[token].
 */
export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name = "" } = await searchParams;
  return <ClaimClient displayName={name} />;
}
