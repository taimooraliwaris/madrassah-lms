import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Trophy, Award } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import {
  StudentSearch,
  type StudentLite,
} from "@/components/operator/StudentSearch";
import {
  useActivities,
  useCreateActivity,
  useAddActivityResult,
  useDeleteActivity,
} from "@/hooks/queries";

export const Route = createFileRoute("/admin/activities")({
  component: AdminActivities,
});

function AdminActivities() {
  const { data: activities, isLoading } = useActivities();
  const create = useCreateActivity();
  const del = useDeleteActivity();
  const addResult = useAddActivityResult();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("event");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const [openResult, setOpenResult] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentLite | null>(null);
  const [position, setPosition] = useState<number | "">("");
  const [note, setNote] = useState("");

  const submitActivity = async () => {
    if (!title.trim()) return toast.error("Enter a title");
    try {
      await create.mutateAsync({
        title: title.trim(),
        type,
        activity_date: date,
        description: description || undefined,
      });
      toast.success("Activity created");
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const submitResult = async (activityId: string) => {
    if (!student) return toast.error("Pick a student");
    try {
      await addResult.mutateAsync({
        activity_id: activityId,
        student_id: student.id,
        position: position === "" ? null : Number(position),
        note: note || undefined,
      });
      toast.success("Result added");
      setStudent(null);
      setPosition("");
      setNote("");
      setOpenResult(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <EntityHeader
        title="Co-Curricular Activities"
        subtitle="Track events, competitions and student achievements."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Field label="Title" required>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Qirat Competition"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="event">Event</option>
                      <option value="competition">Competition</option>
                      <option value="trip">Trip</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Date">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitActivity} disabled={create.isPending}>
                    {create.isPending ? "Saving…" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !activities || activities.length === 0 ? (
        <Card className="p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No activities yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first activity to start tracking participation.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((a: any) => {
            const results = (a.activity_results ?? []) as Array<{
              id: string;
              position: number | null;
              note: string | null;
              students: { full_name: string } | null;
            }>;
            const podium = [...results]
              .filter((r) => r.position != null)
              .sort((x, y) => (x.position ?? 99) - (y.position ?? 99));
            const others = results.filter((r) => r.position == null);
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.activity_date).toLocaleDateString()}
                    </p>
                    {a.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={openResult === a.id}
                      onOpenChange={(o) => setOpenResult(o ? a.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="mr-1 h-3 w-3" /> Result
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add result · {a.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Field label="Student" required>
                            <StudentSearch onPick={setStudent} />
                          </Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Position">
                              <Input
                                type="number"
                                min={1}
                                placeholder="1, 2, 3…"
                                value={position}
                                onChange={(e) =>
                                  setPosition(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Note">
                              <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                              />
                            </Field>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setOpenResult(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => submitResult(a.id)}
                              disabled={addResult.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Delete this activity and all results?"))
                          del.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {(podium.length > 0 || others.length > 0) && (
                  <div className="mt-3 border-t pt-3">
                    {podium.length > 0 && (
                      <div className="space-y-1">
                        {podium.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Award className="h-4 w-4 text-[color:var(--color-status-aala)]" />
                            <span className="font-semibold">
                              #{r.position}
                            </span>
                            <span>{r.students?.full_name}</span>
                            {r.note && (
                              <span className="text-muted-foreground">
                                · {r.note}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {others.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Participants:{" "}
                        {others
                          .map((r) => r.students?.full_name)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
