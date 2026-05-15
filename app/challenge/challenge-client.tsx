"use client";

import { useRouter } from "next/navigation";
import { ChallengeStage } from "@/app/_stages/challenge-stage";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";

export function ChallengeClient() {
  const router = useRouter();
  const { hand, loaded } = useHandPreference();

  // Need hand preference before entering challenge — bounce to /levels (which has the modal).
  if (loaded && !hand) {
    if (typeof window !== "undefined") router.replace("/levels");
    return null;
  }
  if (!hand) return null;

  return (
    <ChallengeStage
      hand={hand}
      onBack={() => router.push("/levels")}
      onHome={() => router.push("/")}
    />
  );
}
