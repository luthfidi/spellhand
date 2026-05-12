import { cn } from "@/lib/utils";

/**
 * A precision-instrument frame: corner brackets, crosshair, optional caption.
 * Place absolutely over a camera/video container.
 */
export function Viewfinder({
  caption,
  active = true,
  className,
}: {
  caption?: string;
  active?: boolean;
  className?: string;
}) {
  const stroke = active ? "stroke-acid" : "stroke-bone-3";
  const fill = active ? "fill-acid" : "fill-bone-3";

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {/* Corner brackets */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* TL */}
        <path d="M 2 14 L 2 2 L 14 2" className={cn("fill-none", stroke)} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {/* TR */}
        <path d="M 86 2 L 98 2 L 98 14" className={cn("fill-none", stroke)} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {/* BL */}
        <path d="M 2 86 L 2 98 L 14 98" className={cn("fill-none", stroke)} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {/* BR */}
        <path d="M 86 98 L 98 98 L 98 86" className={cn("fill-none", stroke)} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />

        {/* Center crosshair */}
        <line x1="50" y1="46" x2="50" y2="54" className={cn("fill-none", stroke)} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        <line x1="46" y1="50" x2="54" y2="50" className={cn("fill-none", stroke)} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />

        {/* Tick marks along top */}
        {[20, 35, 50, 65, 80].map((x) => (
          <line key={x} x1={x} y1="2" x2={x} y2="4" className={cn("fill-none", stroke)} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        ))}
        {/* Tick marks along left */}
        {[20, 35, 50, 65, 80].map((y) => (
          <line key={y} x1="2" y1={y} x2="4" y2={y} className={cn("fill-none", stroke)} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        ))}

        {/* REC dot */}
        <circle cx="92" cy="6" r="0.9" className={fill}>
          {active ? <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" /> : null}
        </circle>
      </svg>

      {caption ? (
        <div className="caption-acid absolute left-2 top-2 px-1 leading-none">{caption}</div>
      ) : null}
    </div>
  );
}
