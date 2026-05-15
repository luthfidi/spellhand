"use client";

import { useRouter } from "next/navigation";
import { HeroStage } from "./_stages/hero-stage";

export default function HomePage() {
  const router = useRouter();
  return <HeroStage onBegin={() => router.push("/levels")} />;
}
