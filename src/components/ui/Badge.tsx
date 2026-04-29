import React from "react";
import { cn } from "../../utils/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink-900/7 text-ink-900",
    good: "bg-brand-200/70 text-ink-900",
    warn: "bg-amber-200/75 text-ink-900",
    bad: "bg-red-200/78 text-ink-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
