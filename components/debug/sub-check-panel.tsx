"use client";

import { useSearchParams } from "next/navigation";
import type { SubCheck } from "@/lib/recognition/types";

/**
 * Floating debug panel. Visible only when the URL has `?debug=1`.
 * Shows the active letter's per-aspect check breakdown for tuning.
 */
export function SubCheckPanel({
  target,
  subChecks,
  confidence,
}: {
  target: string;
  subChecks: SubCheck[] | null;
  confidence: number;
}) {
  const params = useSearchParams();
  if (params.get("debug") !== "1") return null;
  if (!subChecks || subChecks.length === 0) return null;

  return (
    <div className="hairline pointer-events-none fixed bottom-3 right-3 z-50 w-64 bg-ink-2/95 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-baseline justify-between">
        <span className="caption-acid">DEBUG · {target}</span>
        <span className="caption text-bone-2">{Math.round(confidence * 100)}%</span>
      </div>
      <ul className="mt-1.5 space-y-0.5">
        {subChecks.map((c, i) => (
          <li
            key={i}
            className={`font-mono text-[10px] leading-tight ${c.satisfied ? "text-acid" : "text-bone-3"}`}
          >
            {c.satisfied ? "✓" : "✗"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
