import Link from "next/link";
import { TopNav } from "@/components/nav/top-nav";
import { LETTERS } from "@/lib/letters";
import { pad2 } from "@/lib/utils";

export default function ProfilePage() {
  const implementedCount = LETTERS.filter((l) => l.implemented).length;

  return (
    <main className="min-h-svh bg-ink">
      <TopNav caption="§ 00 · PROFILE" />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="caption-acid">PHASE 02 · NOT YET LIVE</p>
        <h1 className="mt-3 font-[family-name:var(--font-display-loaded)] text-5xl italic leading-[0.95] sm:text-6xl">
          Your catalogue
          <br />
          is empty.
        </h1>
        <p className="mt-6 max-w-lg font-mono text-sm leading-relaxed text-bone-2">
          Accounts, progress, and certificates land in <span className="text-acid">Phase 02</span>.
          For now, every session resets when you close the tab.
        </p>

        <div className="ruled-y mt-12 grid grid-cols-2 divide-x divide-rule sm:grid-cols-4">
          <Stat label="Implemented" value={`${implementedCount} / 24`} />
          <Stat label="Mastered" value="—" />
          <Stat label="Streak" value="—" />
          <Stat label="Certificates" value="0 / 4" />
        </div>

        <section className="mt-12">
          <p className="caption mb-3">UPCOMING CERTIFICATES</p>
          <div className="ruled-t -mx-px grid sm:grid-cols-2">
            {[
              { tier: "Bronze", unlock: "Master the first 10 letters." },
              { tier: "Silver", unlock: "Master all 24 static letters." },
              { tier: "Gold", unlock: "Complete all four levels." },
              { tier: "Platinum", unlock: "Add J and Z when they ship." },
            ].map((c) => (
              <div key={c.tier} className="hairline -mt-px -ml-px p-6">
                <p className="caption">{c.tier.toUpperCase()}</p>
                <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-2xl italic">
                  {c.tier}
                </p>
                <p className="mt-2 font-mono text-sm text-bone-2">{c.unlock}</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/"
          className="caption mt-12 inline-block underline-offset-4 hover:underline"
        >
          ← back to the catalogue
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-5">
      <p className="caption mb-2">{label}</p>
      <p className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none text-bone">
        {value}
      </p>
    </div>
  );
}
