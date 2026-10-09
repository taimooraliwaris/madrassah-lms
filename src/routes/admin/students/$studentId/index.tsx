import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabBar } from "@/components/TabBar";
import { EmptyState } from "@/components/EmptyState";
import {
  AttendanceTab,
  ProgressTab,
  ExamResultsTab,
  FeesTab,
} from "@/components/student-tabs/StudentTabs";
import {
  useStudent,
  useStudentParents,
  useStudentAudit,
} from "@/hooks/queries";

import { formatDate, formatRelative, programLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/students/$studentId/")({
  component: StudentProfile,
});

type TabId =
  | "overview"
  | "attendance"
  | "progress"
  | "exams"
  | "ptm"
  | "fees"
  | "activity";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "attendance", label: "Attendance" },
  { id: "progress", label: "Progress" },
  { id: "exams", label: "Exam Results" },
  { id: "ptm", label: "PTM" },
  { id: "fees", label: "Fees" },
  { id: "activity", label: "Activity" },
] as const;

function StudentProfile() {
  const { studentId } = Route.useParams();
  const { data, isLoading } = useStudent(studentId);
  const parents = useStudentParents(studentId);
  const audit = useStudentAudit(studentId);
  const [tab, setTab] = useState<TabId>("overview");

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data)
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Student not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/students">Back to Students</Link>
        </Button>
      </Card>
    );

  return (
    <div className="space-y-5">
      <EntityHeader
        title={data.full_name}
        crumbs={[
          { label: "Students", to: "/admin/students" },
          { label: data.full_name },
        ]}
        badge={<Badge variant="outline">{programLabel(data.program)}</Badge>}
        actions={
          <Button asChild variant="outline">
            <Link
              to="/admin/students/$studentId/edit"
              params={{ studentId: data.id }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <Info label="Student ID" value={data.student_code} />
          <Info label="Class" value={data.class?.name ?? "—"} />
          <Info label="Teacher" value={data.teacher?.full_name ?? "—"} />
          <Info label="Enrolled" value={formatDate(data.enrollment_date)} />
        </div>
      </Card>

      <TabBar tabs={TABS} value={tab} onChange={(v) => setTab(v as TabId)} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Personal
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Father's Name" value={data.father_name ?? "—"} />
              <Info label="Date of Birth" value={formatDate(data.dob)} />
              <Info label="Gender" value={data.gender ?? "—"} />
              <Info label="CNIC / B-Form" value={data.cnic ?? "—"} />
              <Info label="Phone" value={data.phone ?? "—"} />
              <Info label="Status" value={data.status} />
              <Info
                label="Address"
                value={data.address ?? "—"}
                full
              />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Parents & Guardians
            </h3>
            {(parents.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parents linked.
              </p>
            ) : (
              <ul className="space-y-3">
                {(parents.data ?? []).map((row: any) => (
                  <li
                    key={row.parent.id}
                    className="rounded-md border bg-muted/30 p-3"
                  >
                    <div className="text-sm font-medium">
                      {row.parent.full_name}
                      {row.is_primary && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.parent.relation} · {row.parent.phone}
                      {row.parent.email ? ` · ${row.parent.email}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "attendance" && <AttendanceTab studentId={data.id} />}
      {tab === "progress" && (
        <ProgressTab studentId={data.id} program={data.program as "hifz" | "nazra"} />
      )}
      {tab === "exams" && <ExamResultsTab studentId={data.id} />}
      {tab === "fees" && <FeesTab studentId={data.id} />}
      {tab === "ptm" && (
        <EmptyState
          title="PTM data not available yet"
          description="Parent-Teacher Meeting reports arrive in the next phase."
        />
      )}


      {tab === "activity" && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Activity log
          </h3>
          {(audit.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {(audit.data ?? []).map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="text-sm capitalize">
                      {a.action} on student record
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(a.at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
