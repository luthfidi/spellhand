"use client";

import { useRouter } from "next/navigation";
import { LevelIntroStage } from "@/app/_stages/level-intro-stage";
import { useWarmMediaPipe } from "@/lib/hooks/use-warm-mediapipe";
import type { LevelNumber } from "@/lib/levels";

export function LevelIntroClient({ level }: { level: LevelNumber }) {
  const router = useRouter();
  useWarmMediaPipe();
  return (
    <LevelIntroStage
      level={level}
      onTurnOn={() => router.push(`/play/${level}`)}
      onBack={() => router.push("/levels")}
    />
  );
}
