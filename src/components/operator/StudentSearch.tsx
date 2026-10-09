import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudentLite = {
  id: string;
  full_name: string;
  student_code: string;
  program: string;
  class_id: string | null;
};

export function StudentSearch({
  onPick,
}: {
  onPick: (s: StudentLite) => void;
}) {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["op", "student-search", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, student_code, program, class_id")
        .or(`full_name.ilike.%${q}%,student_code.ilike.%${q}%`)
        .eq("status", "active")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as StudentLite[];
    },
  });
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search student by name or code…"
          className="pl-9"
        />
      </div>
      {q.length >= 2 && data.length > 0 && (
        <Card className="absolute z-20 mt-1 max-h-64 w-full overflow-auto p-1">
          {data.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onPick(s);
                setQ("");
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <div>
                <div className="font-medium">{s.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.student_code} · {s.program}
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
