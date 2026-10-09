import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import {
  useChildDailyMarks,
  useChildRemarks,
  useSubjectsByProgram,
} from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/progress")({
  component: ParentProgress,
});

const GRADE_LABEL: Record<string, string> = {
  aala: "Excellent",
  behter: "Good",
  munasib: "Average",
  kamzore: "Needs Improvement",
  naaga: "Absent / Not Done",
};
const GRADE_DOT: Record<string, string> = {
  aala: "bg-[color:var(--color-success)]",
  behter: "bg-primary",
  munasib: "bg-amber-500",
  kamzore: "bg-orange-500",
  naaga: "bg-destructive",
};

function ParentProgress() {
  const { selectedChild } = useSelectedChild();
  const { data: subjects } = useSubjectsByProgram(
    selectedChild?.program ?? null,
  );
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const effectiveSubject = subjectId ?? subjects?.[0]?.id ?? null;

  const { data: marks, isLoading } = useChildDailyMarks(
    selectedChild?.id ?? null,
    effectiveSubject,
    30,
  );
  const { data: remarks } = useChildRemarks(selectedChild?.id ?? null);

  const last7 = useMemo(() => {
    const days: { date: string; grade: string | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const hit = (marks ?? []).find((m) => m.daily_marks_entries.date === d);
      days.push({ date: d, grade: hit?.grade ?? null });
    }
    return days;
  }, [marks]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      aala: 0,
      behter: 0,
      munasib: 0,
      kamzore: 0,
      naaga: 0,
    };
    (marks ?? []).forEach((m) => (counts[m.grade] = (counts[m.grade] ?? 0) + 1));
    return counts;
  }, [marks]);

  if (!selectedChild) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Select a child to view progress.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {selectedChild.full_name}'s Progress
        </h1>
        <p className="text-sm text-muted-foreground">
          Daily performance from teachers, updated after admin review.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(GRADE_LABEL).map(([g, label]) => (
            <div key={g} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", GRADE_DOT[g])} />
              <span className="capitalize">{g}</span>
              <span className="text-muted-foreground">— {label}</span>
            </div>
          ))}
        </div>
      </Card>

      {subjects && subjects.length > 0 ? (
        <Tabs
          value={effectiveSubject ?? undefined}
          onValueChange={setSubjectId}
        >
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {subjects.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="rounded-md border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {subjects.map((s) => (
            <TabsContent key={s.id} value={s.id} className="space-y-4 pt-4">
              <Card className="p-5">
                <h2 className="text-sm font-semibold">This week</h2>
                {isLoading ? (
                  <div className="flex h-16 items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs">
                    {last7.map((d) => {
                      const day = new Date(d.date).toLocaleDateString(undefined, {
                        weekday: "short",
                      });
                      return (
                        <div key={d.date} className="flex flex-col items-center gap-1.5">
                          <span
                            className={cn(
                              "h-6 w-6 rounded-full",
                              d.grade ? GRADE_DOT[d.grade] : "bg-muted",
                            )}
                          />
                          <span className="text-muted-foreground">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold">Last 30 days summary</h2>
                <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                  {(["aala", "behter", "munasib", "kamzore", "naaga"] as const).map(
                    (g) => (
                      <div key={g} className="rounded-md border p-3">
                        <div className={cn("mx-auto h-2.5 w-2.5 rounded-full", GRADE_DOT[g])} />
                        <div className="mt-2 text-lg font-bold">
                          {summary[g] ?? 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {g}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          No subjects configured yet.
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold">Teacher remarks</h2>
        {!remarks || remarks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No remarks shared yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {remarks.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-md border-l-2 border-primary bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.date}</span>
                  {r.severity ? <Badge variant="outline">{r.severity}</Badge> : null}
                </div>
                <p className="mt-1 text-sm">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
