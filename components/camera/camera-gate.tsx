"use client";

import { useTranslations } from "next-intl";
import type { DetectorStatus } from "@/lib/mediapipe/use-hand-landmarker";

/**
 * Quiet loader / permission gate shown over the camera viewport while the
 * model + camera spin up. No user click required in the happy path —
 * useHandLandmarker auto-runs once `start()` is called by the parent.
 */
export function CameraGate({
  status,
  error,
  onRetry,
}: {
  status: DetectorStatus;
  error: string | null;
  onRetry: () => void;
}) {
  const t = useTranslations("camera");

  if (status === "permission-denied") {
    return (
      <div className="max-w-sm">
        <p className="caption text-blood">{t("permission_denied_eyebrow")}</p>
        <h2 className="mt-3 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95]">
          {t("permission_denied_title")}
        </h2>
        <p className="mt-3 text-sm text-bone-2">
          {t("permission_denied_body")}
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="max-w-sm">
        <p className="caption text-blood">{t("fault_eyebrow")}</p>
        <p className="mt-3 text-sm text-bone-2">{error ?? t("fault_default")}</p>
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-3 bg-acid px-5 py-3 font-mono text-sm text-ink"
        >
          {t("retry")} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }
  const label =
    status === "requesting-camera"
      ? t("status_requesting")
      : status === "loading-model"
        ? t("status_loading_model")
        : t("status_starting");
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="caption-acid">{label.toUpperCase()}</p>
      <div className="h-[2px] w-40 overflow-hidden bg-rule">
        <div className="h-full w-1/3 animate-sweep bg-acid" />
      </div>
    </div>
  );
}
