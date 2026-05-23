"use client";

import { useRouter } from "next/navigation";
import { LevelSelectStage } from "@/app/_stages/level-select-stage";
import { HandPreferenceModal } from "@/components/onboard/hand-preference-modal";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import { useWarmMediaPipe } from "@/lib/hooks/use-warm-mediapipe";

export function LevelsClient() {
  const router = useRouter();
  const { hand, setHand, loaded } = useHandPreference();
  const showModal = loaded && !hand;
  useWarmMediaPipe();

  return (
    <>
      <HandPreferenceModal open={showModal} onPick={setHand} />
      {hand ? (
        <LevelSelectStage
          onPick={(n) => router.push(`/levels/${n}`)}
          onChallenge={() => router.push("/challenge")}
          onBack={() => router.push("/")}
          hand={hand}
          onToggleHand={() => setHand(hand === "right" ? "left" : "right")}
        />
      ) : null}
    </>
  );
}
