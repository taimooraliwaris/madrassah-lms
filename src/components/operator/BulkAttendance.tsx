import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, UploadCloud, Loader2 } from "lucide-react";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import { useClassRoster, useSubmitAttendance } from "@/hooks/queries";

const STATUS_MAP: Record<string, "present" | "absent" | "late" | "excused"> = {
  P: "present",
  A: "absent",
  L: "late",
  E: "excused",
};

export function BulkAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today);
  const { data: roster = [] } = useClassRoster(classId);
  const submit = useSubmitAttendance();
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    if (!classId || !roster.length)
      return toast.error("Pick a class with active students first");
    const rows = [
      ["student_code", "full_name", "status (P/A/L/E)", "remark"],
      ...roster.map((r) => [r.student_code, r.full_name, "P", ""]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${date}.xlsx`);
  };

  const onFile = async (file: File) => {
    if (!classId) return toast.error("Pick a class first");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      const byCode = new Map(roster.map((r) => [r.student_code, r]));
      const marks: Array<{
        student_id: string;
        status: "present" | "absent" | "late" | "excused";
        remark?: string;
      }> = [];
      let skipped = 0;
      for (const row of rows) {
        const code = String(row.student_code ?? "").trim();
        const raw = String(
          row["status (P/A/L/E)"] ?? row.status ?? "P",
        )
          .trim()
          .toUpperCase()
          .charAt(0);
        const student = byCode.get(code);
        const status = STATUS_MAP[raw];
        if (!student || !status) {
          skipped++;
          continue;
        }
        marks.push({
          student_id: student.id,
          status,
          remark: row.remark ? String(row.remark) : undefined,
        });
      }
      if (!marks.length) return toast.error("No valid rows found in file");
      await submit.mutateAsync({ class_id: classId, date, marks });
      toast.success(
        `Submitted ${marks.length} entries${skipped ? ` · ${skipped} skipped` : ""}`,
      );
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    }
  };

  return (
    <div className="space-y-4">
      <SelectionHeader
        classId={classId}
        onClassChange={setClassId}
        date={date}
        onDateChange={setDate}
      />
      <Card className="p-5">
        <h3 className="font-semibold">Step 1 — Download Template</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-filled with this class's roster. Status codes: P=Present,
          A=Absent, L=Late, E=Excused.
        </p>
        <Button variant="outline" className="mt-3" onClick={downloadTemplate}>
          <Download className="mr-1.5 h-4 w-4" /> Download Excel Template
        </Button>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Step 2 — Upload Filled Sheet</h3>
        <label
          htmlFor="att-bulk"
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center hover:border-primary/50"
        >
          {submit.isPending ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm">Click to upload your filled .xlsx</p>
          <p className="text-xs text-muted-foreground">.xlsx / .xls only</p>
        </label>
        <Input
          ref={fileRef}
          id="att-bulk"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </Card>
    </div>
  );
}
