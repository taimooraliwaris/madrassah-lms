import { type VerseContext } from "@/data/quranicVerses";
import { useVerseOfPage } from "@/hooks/useVerseOfPage";
import { cn } from "@/lib/utils";

interface Props {
  context: VerseContext;
  className?: string;
  /** 'card' wraps in a bordered surface; 'inline' renders on transparent bg; 'onPrimary' for dark/primary backdrops */
  variant?: "card" | "inline" | "onPrimary";
}

/**
 * Quranic verse display block.
 * - Arabic ayah is ALWAYS rendered in Arabic script.
 * - Translation line is ALWAYS rendered in Urdu (Nastaliq), regardless of UI language.
 */
export function QuranicVerseCard({ context, className, variant = "card" }: Props) {
  const verse = useVerseOfPage(context);
  const onPrimary = variant === "onPrimary";

  return (
    <div
      className={cn(
        variant === "card" && "rounded-lg border bg-muted/30 p-5",
        variant === "inline" && "py-3",
        onPrimary && "py-2",
        className,
      )}
      dir="rtl"
      lang="ar"
    >
      <p
        className={cn(
          "mb-3 text-center font-bold",
          onPrimary ? "text-primary-foreground" : "text-foreground",
        )}
        style={{
          fontFamily: "var(--font-arabic-quran)",
          fontSize: onPrimary ? "1.75rem" : "1.5rem",
          lineHeight: "2.4",
          direction: "rtl",
          letterSpacing: 0,
          fontWeight: 700,
        }}
      >
        {verse.arabic}
      </p>

      <p
        className={cn(
          "mb-3 text-center font-semibold",
          onPrimary ? "text-primary-foreground/90" : "text-muted-foreground",
        )}
        style={{
          fontFamily: "var(--font-arabic-quran)",
          fontSize: "1rem",
        }}
      >
        — {verse.reference_ar}
      </p>

      <p
        className={cn(
          "text-center font-semibold",
          onPrimary ? "text-primary-foreground/95" : "text-foreground",
        )}
        dir="rtl"
        lang="ur"
        style={{
          fontFamily: "var(--font-urdu-body)",
          fontSize: onPrimary ? "1.15rem" : "1.05rem",
          lineHeight: "2.2",
          letterSpacing: 0,
        }}
      >
        {verse.translation_ur}
      </p>
    </div>
  );
}
