import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, UploadCloud, Loader2 } from "lucide-react";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import {
  useClasses,
  useClassRoster,
  useSubjectsByProgram,
  useSubmitDailyMarksMatrix,
} from "@/hooks/queries";

type Grade = "aala" | "behter" | "munasib" | "kamzore" | "naaga";

const GRADE_MAP: Record<string, Grade> = {
  AA: "aala",
  BH: "behter",
  MN: "munasib",
  KM: "kamzore",
  NG: "naaga",
};

export function BulkMarks() {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today);
  const { data: classes = [] } = useClasses();
  const { data: roster = [] } = useClassRoster(classId);
  const program = classes.find((c) => c.id === classId)?.program ?? null;
  const { data: subjects = [] } = useSubjectsByProgram(program as never);
  const submit = useSubmitDailyMarksMatrix();
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    if (!classId || !roster.length)
      return toast.error("Pick a class with active students first");
    if (!subjects.length) return toast.error("No subjects for this program");
    const header = [
      "student_code",
      "full_name",
      ...subjects.map((s) => s.name),
    ];
    const rows = [
      header,
      ...roster.map((r) => [
        r.student_code,
        r.full_name,
        ...subjects.map(() => "AA"),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      ...subjects.map(() => ({ wch: 14 })),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    // Legend sheet
    const legend = XLSX.utils.aoa_to_sheet([
      ["Code", "Meaning"],
      ["AA", "Aala"],
      ["BH", "Behter"],
      ["MN", "Munasib"],
      ["KM", "Kamzore"],
      ["NG", "Naaga (Absent)"],
    ]);
    XLSX.utils.book_append_sheet(wb, legend, "Legend");
    XLSX.writeFile(wb, `marks_${date}.xlsx`);
  };

  const onFile = async (file: File) => {
    if (!classId) return toast.error("Pick a class first");
    if (!subjects.length) return toast.error("No subjects loaded");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      const byCode = new Map(roster.map((r) => [r.student_code, r]));
      const bySubjectName = new Map(subjects.map((s) => [s.name, s.id]));

      // Build per-subject mark list
      const perSubject: Record<
        string,
        Array<{ student_id: string; grade: Grade }>
      > = {};
      let skipped = 0;
      for (const row of rows) {
        const code = String(row.student_code ?? "").trim();
        const student = byCode.get(code);
        if (!student) {
          skipped++;
          continue;
        }
        for (const subject of subjects) {
          const raw = String(row[subject.name] ?? "")
            .trim()
            .toUpperCase();
          const grade = GRADE_MAP[raw];
          if (!grade) continue;
          (perSubject[subject.id] ??= []).push({
            student_id: student.id,
            grade,
          });
        }
      }
      const payload = Object.entries(perSubject)
        .filter(([, marks]) => marks.length > 0)
        .map(([subject_id, marks]) => ({ subject_id, marks }));

      if (!payload.length) return toast.error("No valid rows found");
      await submit.mutateAsync({ class_id: classId, date, subjects: payload });
      toast.success(
        `Submitted ${payload.length} subject(s)${
          skipped ? ` · ${skipped} rows skipped` : ""
        }`,
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
        <h3 className="font-semibold">Step 1 — Download Marks Template</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          One row per student, one column per subject. Codes: AA=Aala,
          BH=Behter, MN=Munasib, KM=Kamzore, NG=Naaga.
        </p>
        <Button variant="outline" className="mt-3" onClick={downloadTemplate}>
          <Download className="mr-1.5 h-4 w-4" /> Download Excel Template
        </Button>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Step 2 — Upload Filled Sheet</h3>
        <label
          htmlFor="marks-bulk"
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
          id="marks-bulk"
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
