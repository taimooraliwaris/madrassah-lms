import { useMemo } from "react";
import { quranicVerses, type VerseContext } from "@/data/quranicVerses";

/**
 * Deterministic-but-varying verse for the given context.
 * Rotates daily (changes at midnight) so it feels fresh without re-rolling on each render.
 */
export function useVerseOfPage(context: VerseContext) {
  return useMemo(() => {
    const pool = quranicVerses.filter(
      (v) => v.context.includes(context) || v.context.includes("general"),
    );
    if (!pool.length) return quranicVerses[0];
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return pool[dayIndex % pool.length];
  }, [context]);
}
