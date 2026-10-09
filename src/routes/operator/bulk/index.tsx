import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { UploadCloud, CalendarCheck, PencilRuler } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";

export const Route = createFileRoute("/operator/bulk/")({
  component: BulkHub,
});

function BulkHub() {
  return (
    <div>
      <EntityHeader title="Bulk Upload" subtitle="Choose an entry type to bulk-import via Excel." />
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/operator/attendance">
          <Card className="cursor-pointer p-6 transition-colors hover:border-primary/40">
            <CalendarCheck className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">Attendance Bulk Upload</h3>
            <p className="text-sm text-muted-foreground">Upload one Excel for multiple classes.</p>
          </Card>
        </Link>
        <Link to="/operator/marks">
          <Card className="cursor-pointer p-6 transition-colors hover:border-primary/40">
            <PencilRuler className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">Daily Marks Bulk Upload</h3>
            <p className="text-sm text-muted-foreground">Upload performance status for all classes.</p>
          </Card>
        </Link>
      </div>
      <Card className="mt-4 flex items-center gap-3 p-4 text-sm text-muted-foreground">
        <UploadCloud className="h-5 w-5" />
        Pick a class on the destination page, download the pre-filled template, fill in codes, then upload.
      </Card>

    </div>
  );
}
