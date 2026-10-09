// Stub for genuinely-future admin pages. PTM and Activities now have real pages.
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const ADMIN_STUBS = {} as const;

export function AdminStub({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <EntityHeader title={title} />
      <Card className="p-10 text-center">
        <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 font-semibold">Coming soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </Card>
    </div>
  );
}
