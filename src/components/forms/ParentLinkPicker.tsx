import { useState } from "react";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import {
  useCreateParent,
  useSearchParents,
  type Parent,
} from "@/hooks/queries";
import { toast } from "sonner";

export function ParentLinkPicker({
  selected,
  onPick,
  onRemove,
}: {
  selected: Parent[];
  onPick: (p: Parent) => void;
  onRemove: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data: results = [], isFetching } = useSearchParents(q);
  const create = useCreateParent();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    relation: "Father",
    phone: "",
    email: "",
  });

  const submitNew = async () => {
    if (!form.full_name || !form.phone)
      return toast.error("Name and phone are required");
    const created = await create.mutateAsync({
      full_name: form.full_name,
      relation: form.relation,
      phone: form.phone,
      email: form.email || null,
    });
    onPick(created as Parent);
    setOpen(false);
    setForm({ full_name: "", relation: "Father", phone: "", email: "" });
    setQ("");
  };

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium">
                  {p.full_name}
                  {i === 0 && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      PRIMARY
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.relation} · {p.phone}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemove(p.id)}
                aria-label="Remove parent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search existing parent by name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {q.length >= 2 && (
        <Card className="max-h-56 overflow-y-auto p-1">
          {isFetching && (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No matches</div>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isSelected(p.id)}
              onClick={() => {
                onPick(p as Parent);
                setQ("");
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              <span>
                <span className="font-medium">{p.full_name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {p.relation} · {p.phone}
                </span>
              </span>
              {isSelected(p.id) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add New Parent
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New parent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required className="sm:col-span-2">
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </Field>
            <Field label="Relation">
              <Input
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
              />
            </Field>
            <Field label="Phone" required>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNew} disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Add Parent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
