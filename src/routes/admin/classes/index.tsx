import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Users } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClassFormDialog } from "@/components/forms/ClassFormDialog";
import {
  useClasses,
  useSubjects,
  type ClassWithTeacher,
} from "@/hooks/queries";
import { programLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/classes/")({
  component: ClassesList,
});

function ClassesList() {
  const { data: classes = [], isLoading } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassWithTeacher | null>(null);
  const [detail, setDetail] = useState<ClassWithTeacher | null>(null);

  return (
    <div>
      <EntityHeader
        title="Classes & Sections"
        subtitle="Organize students by program and level"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : classes.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No classes yet. Create your first class to get started.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer p-5 transition-all hover:shadow-md"
              onClick={() => setDetail(c)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.program === "hifz"
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-accent/40 bg-accent/10 text-accent-foreground"
                      }
                    >
                      {programLabel(c.program)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(c);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="text-muted-foreground">
                  Teacher:{" "}
                  <span className="text-foreground">
                    {c.teacher?.full_name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {c.student_count} students
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
      />

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detail?.name}</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="mt-6 space-y-5">
              <div className="text-sm text-muted-foreground">
                {programLabel(detail.program)} · {detail.academic_year} ·{" "}
                {detail.student_count} students
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Subjects
                </h4>
                <ul className="space-y-1.5">
                  {subjects
                    .filter((s) => s.program === detail.program)
                    .map((s) => (
                      <li
                        key={s.id}
                        className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                      >
                        {s.name}
                      </li>
                    ))}
                  {subjects.filter((s) => s.program === detail.program)
                    .length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      No subjects defined for this program.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Primary teacher
                </h4>
                <p className="text-sm">
                  {detail.teacher?.full_name ?? "Not assigned"}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditing(detail);
                  setDetail(null);
                  setFormOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit class
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
