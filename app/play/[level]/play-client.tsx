"use client";

import { useRouter } from "next/navigation";
import { PlayStage } from "@/app/_stages/play-stage";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import type { LevelNumber } from "@/lib/levels";

export function PlayClient({ level }: { level: LevelNumber }) {
  const router = useRouter();
  const { hand, loaded } = useHandPreference();

  // If no hand preference yet, route back to /levels — that page handles the modal.
  if (loaded && !hand) {
    if (typeof window !== "undefined") router.replace("/levels");
    return null;
  }
  if (!hand) return null;

  return (
    <PlayStage
      levelNumber={level}
      hand={hand}
      onBack={() => router.push(`/levels/${level}`)}
      onNextLevel={() => {
        const next = (level + 1) as LevelNumber;
        if (next <= 4) router.push(`/levels/${next}`);
        else router.push("/");
      }}
      onAllLevels={() => router.push("/levels")}
      onFinish={() => router.push("/challenge")}
    />
  );
}
