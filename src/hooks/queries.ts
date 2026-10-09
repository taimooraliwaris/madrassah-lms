import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Student = Tables["students"]["Row"];
export type Teacher = Tables["teachers"]["Row"];
export type Class = Tables["classes"]["Row"];
export type Subject = Tables["subjects"]["Row"];
export type Admission = Tables["admissions"]["Row"];
export type Parent = Tables["parents"]["Row"];
export type ParentLink = Tables["parent_links"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type AuditLog = Tables["audit_log"]["Row"];
export type Settings = Tables["settings"]["Row"];
export type ApprovalRequest = Tables["approval_requests"]["Row"];
export type VerificationItem = Database["public"]["Views"]["verification_queue"]["Row"];

export const qk = {
  students: ["students"] as const,
  student: (id: string) => ["students", id] as const,
  studentAudit: (id: string) => ["students", id, "audit"] as const,
  studentParents: (id: string) => ["students", id, "parents"] as const,
  teachers: ["teachers"] as const,
  teacher: (id: string) => ["teachers", id] as const,
  classes: ["classes"] as const,
  subjects: ["subjects"] as const,
  admissions: ["admissions"] as const,
  users: ["users"] as const,
  dashboard: ["dashboard"] as const,
  parentSearch: (q: string) => ["parents", "search", q] as const,
  teacherClasses: (id: string) => ["teacher_classes", id] as const,
  verification: ["verification_queue"] as const,
  auditLog: (f: AuditFilters) => ["audit_log", f] as const,
  settings: ["settings"] as const,
  approvals: ["approval_requests"] as const,
};

export type AuditFilters = {
  search?: string;
  action?: "insert" | "update" | "delete" | "all";
  entity_type?: string | "all";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};


// ===== Students =====
export type StudentWithRefs = Student & {
  class: Pick<Class, "id" | "name" | "program"> | null;
  teacher: Pick<Teacher, "id" | "full_name"> | null;
};

export function useStudents() {
  return useQuery({
    queryKey: qk.students,
    queryFn: async (): Promise<StudentWithRefs[]> => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "*, class:classes(id,name,program), teacher:teachers!students_assigned_teacher_id_fkey(id,full_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as StudentWithRefs[];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: qk.student(id),
    enabled: !!id,
    queryFn: async (): Promise<StudentWithRefs | null> => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "*, class:classes(id,name,program), teacher:teachers!students_assigned_teacher_id_fkey(id,full_name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as StudentWithRefs | null;
    },
  });
}

export function useStudentParents(id: string) {
  return useQuery({
    queryKey: qk.studentParents(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_links")
        .select("is_primary, parent:parents(*)")
        .eq("student_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudentAudit(id: string) {
  return useQuery({
    queryKey: qk.studentAudit(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("entity_type", "students")
        .eq("entity_id", id)
        .order("at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Tables["students"]["Insert"] & { id?: string },
    ) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from("students")
          .update(rest)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("students")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qk.students });
      if (data?.id) qc.invalidateQueries({ queryKey: qk.student(data.id) });
    },
  });
}

export function useLinkParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      parent_id: string;
      is_primary?: boolean;
    }) => {
      const { error } = await supabase.from("parent_links").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: qk.studentParents(v.student_id) }),
  });
}

export function useUnlinkParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { student_id: string; parent_id: string }) => {
      const { error } = await supabase
        .from("parent_links")
        .delete()
        .eq("student_id", input.student_id)
        .eq("parent_id", input.parent_id);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: qk.studentParents(v.student_id) }),
  });
}

export function useCreateParent() {
  return useMutation({
    mutationFn: async (input: Tables["parents"]["Insert"]) => {
      const { data, error } = await supabase
        .from("parents")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSearchParents(q: string) {
  return useQuery({
    queryKey: qk.parentSearch(q),
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parents")
        .select("*")
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ===== Teachers =====
export function useTeachers() {
  return useQuery({
    queryKey: qk.teachers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: qk.teacher(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Tables["teachers"]["Insert"] & { id?: string },
    ) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from("teachers")
          .update(rest)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("teachers")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teachers }),
  });
}

export function useTeacherClassIds(teacherId: string) {
  return useQuery({
    queryKey: qk.teacherClasses(teacherId),
    enabled: !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_classes")
        .select("class_id")
        .eq("teacher_id", teacherId);
      if (error) throw error;
      return (data ?? []).map((r) => r.class_id);
    },
  });
}

export function useSetTeacherClasses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teacher_id: string; class_ids: string[] }) => {
      await supabase
        .from("teacher_classes")
        .delete()
        .eq("teacher_id", input.teacher_id);
      if (input.class_ids.length) {
        const { error } = await supabase
          .from("teacher_classes")
          .insert(
            input.class_ids.map((c) => ({
              teacher_id: input.teacher_id,
              class_id: c,
            })),
          );
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: qk.teacherClasses(v.teacher_id) }),
  });
}


// ===== Classes & subjects =====
export type ClassWithTeacher = Class & {
  teacher: Pick<Teacher, "id" | "full_name"> | null;
  student_count: number;
};

export function useClasses() {
  return useQuery({
    queryKey: qk.classes,
    queryFn: async (): Promise<ClassWithTeacher[]> => {
      const { data, error } = await supabase
        .from("classes")
        .select(
          "*, teacher:teachers!classes_primary_teacher_id_fkey(id,full_name), students(count)",
        )
        .order("name");
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        student_count: c.students?.[0]?.count ?? 0,
      })) as ClassWithTeacher[];
    },
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: qk.subjects,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("program")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Tables["classes"]["Insert"] & { id?: string },
    ) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from("classes")
          .update(rest)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("classes")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classes }),
  });
}

// ===== Admissions =====
export function useAdmissions() {
  return useQuery({
    queryKey: qk.admissions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReviewAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: "rejected" | "info_requested";
      note?: string;
    }) => {
      const { error } = await supabase
        .from("admissions")
        .update({
          status: input.status,
          review_note: input.note ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admissions }),
  });
}

export function usePromoteAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      admission_id: string;
      class_id: string;
      teacher_id: string;
      enrollment_date: string;
    }) => {
      const { data, error } = await supabase.rpc("app_promote_admission", {
        _admission_id: input.admission_id,
        _class_id: input.class_id,
        _teacher_id: input.teacher_id,
        _enrollment_date: input.enrollment_date,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admissions });
      qc.invalidateQueries({ queryKey: qk.students });
    },
  });
}

// ===== Users =====
export type UserRow = Profile & { role: "admin" | "operator" | "parent" | null };

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: async (): Promise<UserRow[]> => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
        ]);
      if (pe) throw pe;
      if (re) throw re;
      const roleMap = new Map(
        (roles ?? []).map((r) => [r.user_id, r.role as UserRow["role"]]),
      );
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? null,
      }));
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      role: "admin" | "operator" | "parent";
    }) => {
      await supabase.from("user_roles").delete().eq("user_id", input.user_id);
      const { error } = await supabase.from("user_roles").insert({
        user_id: input.user_id,
        role: input.role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

// ===== Dashboard =====
export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => {
      const [students, teachers, pendingAdm, recentAudit] = await Promise.all([
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("teachers")
          .select("id", { count: "exact", head: true })
          .eq("employment_status", "active"),
        supabase
          .from("admissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("audit_log")
          .select("*")
          .order("at", { ascending: false })
          .limit(8),
      ]);
      const [{ count: pendingVer }, { count: pendingApr }] = await Promise.all([
        supabase
          .from("verification_queue")
          .select("entity_id", { count: "exact", head: true }),
        supabase
          .from("approval_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      return {
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        pendingAdmissions: pendingAdm.count ?? 0,
        pendingVerifications: pendingVer ?? 0,
        pendingApprovals: pendingApr ?? 0,
        recentActivity: recentAudit.data ?? [],
      };
    },
  });
}

// ===== Parent portal: children of the logged-in parent =====
export type ChildStudent = Student & {
  class: Pick<Class, "id" | "name" | "program"> | null;
  teacher: Pick<Teacher, "id" | "full_name"> | null;
};

export const qkChildren = ["parent", "children"] as const;

export function useMyChildren() {
  return useQuery({
    queryKey: qkChildren,
    queryFn: async (): Promise<ChildStudent[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Find parent rows for this user
      const { data: parents, error: pe } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", user.id);
      if (pe) throw pe;
      const parentIds = (parents ?? []).map((p) => p.id);
      if (!parentIds.length) return [];
      const { data: links, error: le } = await supabase
        .from("parent_links")
        .select("student_id")
        .in("parent_id", parentIds);
      if (le) throw le;
      const studentIds = Array.from(
        new Set((links ?? []).map((l) => l.student_id)),
      );
      if (!studentIds.length) return [];
      const { data: students, error: se } = await supabase
        .from("students")
        .select(
          "*, class:classes(id,name,program), teacher:teachers!students_assigned_teacher_id_fkey(id,full_name)",
        )
        .in("id", studentIds)
        .order("full_name");
      if (se) throw se;
      return (students ?? []) as unknown as ChildStudent[];
    },
  });
}


// ===== Verification Queue =====
export function useVerificationQueue() {
  return useQuery({
    queryKey: qk.verification,
    queryFn: async (): Promise<VerificationItem[]> => {
      const { data, error } = await supabase
        .from("verification_queue")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDecideVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entity_type: string;
      entity_id: string;
      decision: "approved" | "rejected";
      note?: string;
    }) => {
      const { error } = await supabase.rpc("app_decide_submission", {
        _entity_type: input.entity_type,
        _entity_id: input.entity_id,
        _approve: input.decision === "approved",
        _note: input.note ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: ["operator"] });
    },
  });
}


// ===== Audit Log =====
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: qk.auditLog(filters),
    queryFn: async () => {
      const page = filters.page ?? 0;
      const pageSize = filters.pageSize ?? 50;
      let q = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (filters.action && filters.action !== "all")
        q = q.eq("action", filters.action);
      if (filters.entity_type && filters.entity_type !== "all")
        q = q.eq("entity_type", filters.entity_type);
      if (filters.from) q = q.gte("at", filters.from);
      if (filters.to) q = q.lte("at", filters.to);
      const { data, error, count } = await q;
      if (error) throw error;
      let rows = data ?? [];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.entity_type.toLowerCase().includes(s) ||
            r.action.toLowerCase().includes(s) ||
            JSON.stringify(r.after ?? r.before ?? {})
              .toLowerCase()
              .includes(s),
        );
      }
      // Enrich actor names
      const actorIds = Array.from(
        new Set(rows.map((r) => r.actor_id).filter(Boolean)),
      ) as string[];
      let actorMap = new Map<string, string>();
      if (actorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", actorIds);
        actorMap = new Map(
          (profs ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]),
        );
      }
      return {
        rows: rows.map((r) => ({
          ...r,
          actor_name: r.actor_id ? actorMap.get(r.actor_id) ?? "System" : "System",
        })),
        total: count ?? 0,
        page,
        pageSize,
      };
    },
  });
}

// ===== Settings =====
export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: async (): Promise<Settings | null> => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const { error } = await supabase
        .from("settings")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings }),
  });
}

// ===== Approval Requests =====
export function useApprovalRequests() {
  return useQuery({
    queryKey: qk.approvals,
    queryFn: async (): Promise<ApprovalRequest[]> => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      decision: "approved" | "rejected";
      note?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: input.decision,
          decision_note: input.note ?? null,
          decided_by: u.user?.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.approvals });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

// ===================================================================
// Phase 4 — Operator hooks
// ===================================================================

export const qkOp = {
  roster: (classId: string) => ["operator", "roster", classId] as const,
  mySubs: (filters?: unknown) => ["operator", "submissions", filters] as const,
  todayTasks: ["operator", "today"] as const,
};

export function useClassRoster(classId: string | null | undefined) {
  return useQuery({
    queryKey: qkOp.roster(classId ?? ""),
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, student_code, program")
        .eq("class_id", classId!)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubjectsByProgram(program: "hifz" | "nazra" | null | undefined) {
  return useQuery({
    queryKey: ["subjects", "program", program],
    enabled: !!program,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("program", program!)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

// ----- Attendance -----
export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      class_id: string;
      date: string;
      note?: string;
      marks: Array<{ student_id: string; status: "present" | "absent" | "late" | "excused"; remark?: string }>;
    }) => {
      const submitted_by = await uid();
      const { data: entry, error: e1 } = await supabase
        .from("attendance_entries")
        .insert({ class_id: input.class_id, date: input.date, note: input.note ?? null, submitted_by })
        .select()
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("attendance_marks")
        .insert(input.marks.map((m) => ({ entry_id: entry.id, ...m })));
      if (e2) throw e2;
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
      qc.invalidateQueries({ queryKey: qk.verification });
    },
  });
}

// ----- Daily marks -----
export function useSubmitDailyMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      class_id: string;
      subject_id: string;
      date: string;
      note?: string;
      marks: Array<{ student_id: string; grade: "aala" | "behter" | "munasib" | "kamzore" | "naaga"; reason?: string; remark?: string }>;
    }) => {
      const submitted_by = await uid();
      const { data: entry, error: e1 } = await supabase
        .from("daily_marks_entries")
        .insert({ class_id: input.class_id, subject_id: input.subject_id, date: input.date, note: input.note ?? null, submitted_by })
        .select()
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("daily_marks")
        .insert(input.marks.map((m) => ({ entry_id: entry.id, ...m })));
      if (e2) throw e2;
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
      qc.invalidateQueries({ queryKey: qk.verification });
    },
  });
}

// ----- Exam marks -----
export function useSubmitExamMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      exam_name: string;
      class_id: string;
      subject_id: string;
      total_marks: number;
      marks: Array<{ student_id: string; marks_obtained: number | null; is_absent: boolean }>;
    }) => {
      const submitted_by = await uid();
      const { data: entry, error: e1 } = await supabase
        .from("exam_marks_entries")
        .insert({
          exam_name: input.exam_name,
          class_id: input.class_id,
          subject_id: input.subject_id,
          total_marks: input.total_marks,
          submitted_by,
        })
        .select()
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("exam_marks")
        .insert(input.marks.map((m) => ({ entry_id: entry.id, ...m })));
      if (e2) throw e2;
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
      qc.invalidateQueries({ queryKey: qk.verification });
    },
  });
}

// ----- Remarks -----
export function useSubmitRemark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      class_id: string;
      date: string;
      scope: "individual" | "class";
      student_id?: string | null;
      category?: string;
      severity?: string;
      body: string;
    }) => {
      const submitted_by = await uid();
      const { error } = await supabase.from("remarks_entries").insert({
        ...input,
        student_id: input.scope === "class" ? null : input.student_id ?? null,
        submitted_by,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
      qc.invalidateQueries({ queryKey: qk.verification });
    },
  });
}

// ----- Fees -----
export function useSubmitFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      month: string;
      amount: number;
      method: "cash" | "bank" | "other";
      reference_no?: string;
      paid_on: string;
      notes?: string;
    }) => {
      const submitted_by = await uid();
      const { error } = await supabase.from("fee_payments").insert({ ...input, submitted_by });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
      qc.invalidateQueries({ queryKey: qk.verification });
    },
  });
}

// ----- My submissions (UNION across 5 tables) -----
export type OpSubmission = {
  id: string;
  entity_type: "attendance" | "daily_marks" | "exam_marks" | "remark" | "fee_payment";
  label: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
};

export function useMySubmissions(filters?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: qkOp.mySubs(filters),
    queryFn: async (): Promise<OpSubmission[]> => {
      const me = await uid();
      const [att, dm, ex, re, fp] = await Promise.all([
        supabase.from("attendance_entries").select("id, date, class_id, status, created_at, reviewed_at, review_note, classes(name)").eq("submitted_by", me).order("created_at", { ascending: false }).limit(50),
        supabase.from("daily_marks_entries").select("id, date, class_id, subject_id, status, created_at, reviewed_at, review_note, classes(name), subjects(name)").eq("submitted_by", me).order("created_at", { ascending: false }).limit(50),
        supabase.from("exam_marks_entries").select("id, exam_name, status, created_at, reviewed_at, review_note, classes(name), subjects(name)").eq("submitted_by", me).order("created_at", { ascending: false }).limit(50),
        supabase.from("remarks_entries").select("id, body, status, created_at, reviewed_at, review_note, students(full_name)").eq("submitted_by", me).order("created_at", { ascending: false }).limit(50),
        supabase.from("fee_payments").select("id, amount, month, status, created_at, reviewed_at, review_note, students(full_name)").eq("submitted_by", me).order("created_at", { ascending: false }).limit(50),
      ]);
      const all: OpSubmission[] = [
        ...(att.data ?? []).map((r: any) => ({ id: r.id, entity_type: "attendance" as const, label: `Attendance · ${r.classes?.name ?? "?"} · ${r.date}`, status: r.status, created_at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note })),
        ...(dm.data ?? []).map((r: any) => ({ id: r.id, entity_type: "daily_marks" as const, label: `Daily Marks · ${r.classes?.name ?? "?"} · ${r.subjects?.name ?? "?"} · ${r.date}`, status: r.status, created_at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note })),
        ...(ex.data ?? []).map((r: any) => ({ id: r.id, entity_type: "exam_marks" as const, label: `Exam Marks · ${r.exam_name} · ${r.classes?.name ?? "?"} · ${r.subjects?.name ?? "?"}`, status: r.status, created_at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note })),
        ...(re.data ?? []).map((r: any) => ({ id: r.id, entity_type: "remark" as const, label: `Remark · ${r.students?.full_name ?? "Class-wide"}`, status: r.status, created_at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note })),
        ...(fp.data ?? []).map((r: any) => ({ id: r.id, entity_type: "fee_payment" as const, label: `Fee · ₨${r.amount} · ${r.students?.full_name ?? "?"} · ${r.month}`, status: r.status, created_at: r.created_at, reviewed_at: r.reviewed_at, review_note: r.review_note })),
      ];
      let rows = all.sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (filters?.status && filters.status !== "all") rows = rows.filter((r) => r.status === filters.status);
      if (filters?.type && filters.type !== "all") rows = rows.filter((r) => r.entity_type === filters.type);
      return rows;
    },
  });
}

// ----- Operator dashboard today tasks -----
export function useOperatorToday() {
  return useQuery({
    queryKey: qkOp.todayTasks,
    queryFn: async () => {
      const me = await uid();
      const today = new Date().toISOString().slice(0, 10);
      const { data: classes } = await supabase.from("classes").select("id, name, program").eq("status", "active").order("name");
      const { data: attToday } = await supabase
        .from("attendance_entries")
        .select("class_id, status, created_at")
        .eq("submitted_by", me)
        .eq("date", today);
      const { data: marksToday } = await supabase
        .from("daily_marks_entries")
        .select("class_id, subject_id, status, created_at")
        .eq("submitted_by", me)
        .eq("date", today);
      return {
        today,
        classes: classes ?? [],
        attendanceDone: new Set((attToday ?? []).map((a) => a.class_id)),
        marksDone: new Set((marksToday ?? []).map((m) => `${m.class_id}:${m.subject_id}`)),
      };
    },
  });
}

// ----- Parent: latest approved data for a child -----
export function useChildAttendanceSummary(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "attendance", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_marks")
        .select("status, attendance_entries!inner(date, status)")
        .eq("student_id", studentId!)
        .eq("attendance_entries.status", "approved")
        .order("attendance_entries(date)", { ascending: false } as never)
        .limit(30);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const total = rows.length;
      const present = rows.filter((r) => r.status === "present").length;
      return {
        total,
        present,
        rate: total ? Math.round((present / total) * 100) : null,
        recent: rows.slice(0, 5),
      };
    },
  });
}

// ----- Parent: attendance month grid -----
export function useChildAttendanceMonth(
  studentId: string | null | undefined,
  year: number,
  month: number, // 1-12
) {
  return useQuery({
    queryKey: ["parent", "attendance-month", studentId, year, month],
    enabled: !!studentId,
    queryFn: async () => {
      const from = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const to = new Date(year, month, 0).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("attendance_marks")
        .select("status, remark, attendance_entries!inner(date, status)")
        .eq("student_id", studentId!)
        .eq("attendance_entries.status", "approved")
        .gte("attendance_entries.date", from)
        .lte("attendance_entries.date", to);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        status: "present" | "absent" | "late" | "excused";
        remark: string | null;
        attendance_entries: { date: string; status: string };
      }>;
    },
  });
}

// ----- Parent: daily marks for a child -----
export function useChildDailyMarks(
  studentId: string | null | undefined,
  subjectId: string | null | undefined,
  days = 30,
) {
  return useQuery({
    queryKey: ["parent", "daily-marks", studentId, subjectId, days],
    enabled: !!studentId,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000)
        .toISOString()
        .slice(0, 10);
      let q = supabase
        .from("daily_marks")
        .select(
          "grade, reason, remark, daily_marks_entries!inner(date, subject_id, status)",
        )
        .eq("student_id", studentId!)
        .eq("daily_marks_entries.status", "approved")
        .gte("daily_marks_entries.date", since);
      if (subjectId) q = q.eq("daily_marks_entries.subject_id", subjectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        grade: "aala" | "behter" | "munasib" | "kamzore" | "naaga";
        reason: string | null;
        remark: string | null;
        daily_marks_entries: { date: string; subject_id: string; status: string };
      }>;
    },
  });
}

// ----- Parent: exam results -----
export function useChildExamResults(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "exams", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_marks")
        .select(
          "marks_obtained, is_absent, exam_marks_entries!inner(exam_name, total_marks, status, subject_id, class_id, created_at)",
        )
        .eq("student_id", studentId!)
        .eq("exam_marks_entries.status", "approved");
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        marks_obtained: number | null;
        is_absent: boolean;
        exam_marks_entries: {
          exam_name: string;
          total_marks: number;
          status: string;
          subject_id: string;
          class_id: string;
          created_at: string;
        };
      }>;
    },
  });
}

// ----- Parent: fee payments -----
export function useChildFeePayments(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "fees", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", studentId!)
        .eq("status", "approved")
        .order("paid_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ----- Parent: remarks -----
export function useChildRemarks(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "remarks", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("remarks_entries")
        .select("*")
        .eq("student_id", studentId!)
        .eq("status", "approved")
        .order("date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ===================================================================
// Phase 6 — Admin overview hooks + matrix submit
// ===================================================================

export function useSubmitDailyMarksMatrix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      class_id: string;
      date: string;
      subjects: Array<{
        subject_id: string;
        marks: Array<{
          student_id: string;
          grade: "aala" | "behter" | "munasib" | "kamzore" | "naaga";
          reason?: string;
          remark?: string;
        }>;
      }>;
    }) => {
      const { error } = await supabase.rpc("app_submit_daily_marks_matrix" as never, {
        _class_id: input.class_id,
        _date: input.date,
        _payload: input.subjects,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator"] });
    },
  });
}

// Admin: attendance overview for a date (optionally filtered by class)
export function useAdminAttendanceByDate(date: string | null | undefined, classId?: string) {
  return useQuery({
    queryKey: ["admin", "attendance", date ?? "pending", classId ?? "all"],
    enabled: !!date,
    queryFn: async () => {
      let q = supabase
        .from("attendance_entries")
        .select("id, class_id, date, note")
        .eq("date", date!);
      if (classId) q = q.eq("class_id", classId);
      const { data: entries, error } = await q;
      if (error) throw error;

      const entryIds = (entries ?? []).map((e) => e.id);
      const classIds = Array.from(new Set((entries ?? []).map((e) => e.class_id).filter(Boolean)));
      const [marksResult, classesResult] = await Promise.all([
        entryIds.length
          ? supabase.from("attendance_marks").select("entry_id, status").in("entry_id", entryIds)
          : Promise.resolve({ data: [], error: null }),
        classIds.length
          ? supabase.from("classes").select("id, name, program").in("id", classIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (marksResult.error) throw marksResult.error;
      if (classesResult.error) throw classesResult.error;

      const marksByEntry = new Map<string, Array<{ status: string }>>();
      for (const m of marksResult.data ?? []) {
        const list = marksByEntry.get(m.entry_id) ?? [];
        list.push({ status: m.status });
        marksByEntry.set(m.entry_id, list);
      }
      const classMap = new Map<string, any>();
      for (const c of classesResult.data ?? []) classMap.set(c.id, c);

      return (entries ?? []).map((e: any) => {
        const marks = marksByEntry.get(e.id) ?? [];
        const classInfo = classMap.get(e.class_id);
        const total = marks.length;
        const t = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const m of marks) (t as any)[m.status] = ((t as any)[m.status] ?? 0) + 1;
        return {
          id: e.id as string,
          class_id: e.class_id as string,
          class_name: (classInfo?.name ?? "—") as string,
          program: classInfo?.program ?? null,
          date: e.date as string,
          note: e.note as string | null,
          total,
          present: t.present,
          absent: t.absent,
          late: t.late,
          excused: t.excused,
          rate: total ? Math.round((t.present / total) * 100) : null,
        };
      });
    },
  });
}

// Admin: daily marks aggregate by class/subject for a date range
export function useAdminPerformance(
  from: string | null | undefined,
  to: string | null | undefined,
  classId?: string,
  subjectId?: string,
) {
  return useQuery({
    queryKey: ["admin", "performance", from ?? "pending", to ?? "pending", classId ?? "all", subjectId ?? "all"],
    enabled: !!from && !!to,
    queryFn: async () => {
      let q = supabase
        .from("daily_marks_entries")
        .select("id, date, class_id, subject_id")
        .gte("date", from!)
        .lte("date", to!);
      if (classId) q = q.eq("class_id", classId);
      if (subjectId) q = q.eq("subject_id", subjectId);
      const { data: entries, error } = await q;
      if (error) throw error;

      const entryIds = (entries ?? []).map((e) => e.id);
      const classIds = Array.from(new Set((entries ?? []).map((e) => e.class_id).filter(Boolean)));
      const subjectIds = Array.from(new Set((entries ?? []).map((e) => e.subject_id).filter(Boolean)));
      const [marksResult, classesResult, subjectsResult] = await Promise.all([
        entryIds.length
          ? supabase.from("daily_marks").select("entry_id, grade").in("entry_id", entryIds)
          : Promise.resolve({ data: [], error: null }),
        classIds.length
          ? supabase.from("classes").select("id, name").in("id", classIds)
          : Promise.resolve({ data: [], error: null }),
        subjectIds.length
          ? supabase.from("subjects").select("id, name").in("id", subjectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (marksResult.error) throw marksResult.error;
      if (classesResult.error) throw classesResult.error;
      if (subjectsResult.error) throw subjectsResult.error;

      const marksByEntry = new Map<string, Array<{ grade: string }>>();
      for (const m of marksResult.data ?? []) {
        const list = marksByEntry.get(m.entry_id) ?? [];
        list.push({ grade: m.grade });
        marksByEntry.set(m.entry_id, list);
      }
      const classMap = new Map<string, any>();
      for (const c of classesResult.data ?? []) classMap.set(c.id, c);
      const subjectMap = new Map<string, any>();
      for (const s of subjectsResult.data ?? []) subjectMap.set(s.id, s);

      return (entries ?? []).map((e: any) => {
        const marks = marksByEntry.get(e.id) ?? [];
        const c = { aala: 0, behter: 0, munasib: 0, kamzore: 0, naaga: 0 };
        for (const m of marks) (c as any)[m.grade] = ((c as any)[m.grade] ?? 0) + 1;
        return {
          id: e.id as string,
          date: e.date as string,
          class_name: (classMap.get(e.class_id)?.name ?? "—") as string,
          subject_name: (subjectMap.get(e.subject_id)?.name ?? "—") as string,
          total: marks.length,
          aala: c.aala,
          behter: c.behter,
          munasib: c.munasib,
          kamzore: c.kamzore,
          naaga: c.naaga,
        };
      });
    },
  });
}

// Admin: exams overview grouped by exam_name
export function useAdminExams() {
  return useQuery({
    queryKey: ["admin", "exams"],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from("exam_marks_entries")
        .select("id, exam_name, total_marks, created_at, class_id, subject_id")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const entryIds = (entries ?? []).map((e) => e.id);
      const { data: marks, error: marksError } = entryIds.length
        ? await supabase
            .from("exam_marks")
            .select("entry_id, marks_obtained, is_absent")
            .in("entry_id", entryIds)
        : { data: [], error: null };
      if (marksError) throw marksError;

      const marksByEntry = new Map<string, Array<{ marks_obtained: number | null; is_absent: boolean }>>();
      for (const m of marks ?? []) {
        const list = marksByEntry.get(m.entry_id) ?? [];
        list.push({ marks_obtained: m.marks_obtained, is_absent: m.is_absent });
        marksByEntry.set(m.entry_id, list);
      }

      const grouped = new Map<
        string,
        {
          exam_name: string;
          entries: number;
          students: number;
          pass: number;
          total_marks_sum: number;
          obtained_sum: number;
          latest: string;
        }
      >();
      (entries ?? []).forEach((e: any) => {
        const entryMarks = marksByEntry.get(e.id) ?? [];
        const g = grouped.get(e.exam_name) ?? {
          exam_name: e.exam_name,
          entries: 0,
          students: 0,
          pass: 0,
          total_marks_sum: 0,
          obtained_sum: 0,
          latest: e.created_at,
        };
        g.entries += 1;
        for (const m of entryMarks) {
          g.students += 1;
          if (!m.is_absent) {
            g.obtained_sum += Number(m.marks_obtained ?? 0);
            g.total_marks_sum += Number(e.total_marks);
            if (Number(m.marks_obtained ?? 0) >= Number(e.total_marks) * 0.4) g.pass += 1;
          }
        }
        if (e.created_at > g.latest) g.latest = e.created_at;
        grouped.set(e.exam_name, g);
      });
      return Array.from(grouped.values()).sort((a, b) => (a.latest < b.latest ? 1 : -1));
    },
  });
}

// Admin: fee payments for a YYYY-MM month
export function useAdminFeePayments(month: string | null | undefined) {
  return useQuery({
    queryKey: ["admin", "fees", month ?? "pending"],
    enabled: !!month,
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("fee_payments")
        .select("*")
        .ilike("month", `%${month!}%`)
        .order("paid_on", { ascending: false });
      if (error) throw error;

      const studentIds = Array.from(new Set((payments ?? []).map((p) => p.student_id).filter(Boolean)));
      const { data: students, error: studentsError } = studentIds.length
        ? await supabase.from("students").select("id, full_name, student_code").in("id", studentIds)
        : { data: [], error: null };
      if (studentsError) throw studentsError;

      const studentMap = new Map<string, any>();
      for (const s of students ?? []) studentMap.set(s.id, s);
      return (payments ?? []).map((p) => ({ ...p, students: studentMap.get(p.student_id) ?? null }));
    },
  });
}


// ===================================================================
// Phase 7 — Notifications, PTM, Activities, Parent Admin Tools
// ===================================================================

export type Notification = Tables["notifications"]["Row"];
export type PtmReport = Tables["ptm_reports"]["Row"];
export type Activity = Tables["activities"]["Row"];
export type ActivityResult = Tables["activity_results"]["Row"];

// ---------- Notifications ----------
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return 0;
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("id");
      if (error) throw error;
      const ids = (notifs ?? []).map((n) => n.id);
      if (ids.length === 0) return 0;
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", uid)
        .in("notification_id", ids);
      const readSet = new Set((reads ?? []).map((r) => r.notification_id));
      return ids.filter((id) => !readSet.has(id)).length;
    },
  });
}

export function useNotificationReads() {
  return useQuery({
    queryKey: ["notifications", "reads"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return new Set<string>();
      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", uid);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.notification_id));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || ids.length === 0) return;
      const rows = ids.map((id) => ({ notification_id: id, user_id: uid }));
      const { error } = await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "notification_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      body?: string;
      audience?: string;
      student_id?: string | null;
      class_id?: string | null;
      parent_user_id?: string | null;
      type?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { error } = await supabase.from("notifications").insert({
        title: input.title,
        body: input.body ?? null,
        audience: input.audience ?? "parent",
        student_id: input.student_id ?? null,
        class_id: input.class_id ?? null,
        parent_user_id: input.parent_user_id ?? null,
        type: input.type ?? "info",
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ---------- PTM reports ----------
export function usePtmReports(studentId?: string | null) {
  return useQuery({
    queryKey: ["ptm_reports", studentId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("ptm_reports")
        .select("*, students(full_name, student_code)")
        // 🚨 Ensuring NO .eq("status", "approved") exists here so all reports are fetched
        .order("created_at", { ascending: false });
        
      if (studentId) q = q.eq("student_id", studentId);
      
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePtmReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      period: string;
      meeting_date?: string;
      summary?: string;
      strengths?: string;
      improvements?: string;
      action_items?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("ptm_reports").insert({
        ...input,
        created_by: uid,
      });
      
      if (error) throw error;
    },
    // This correctly invalidates the query so the UI updates immediately after creating
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ptm_reports"] }),
  });
}

export function useDeletePtmReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ptm_reports").delete().eq("id", id);
      if (error) throw error;
    },
    // This correctly invalidates the query so the UI updates immediately after deleting
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ptm_reports"] }),
  });
}

// ---------- Activities ----------
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, activity_results(*, students(full_name, student_code))")
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      type?: string;
      activity_date: string;
      description?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("activities")
        .insert({ ...input, type: input.type ?? "event", created_by: uid })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useAddActivityResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      activity_id: string;
      student_id: string;
      position?: number | null;
      note?: string;
    }) => {
      const { error } = await supabase.from("activity_results").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("activity_results").delete().eq("activity_id", id);
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

// ---------- Admin: Parent accounts cleanup ----------
export function useUnlinkedParents() {
  return useQuery({
    queryKey: ["parents", "unlinked"],
    queryFn: async () => {
      const { data: parents } = await supabase.from("parents").select("*");
      const { data: links } = await supabase.from("parent_links").select("parent_id");
      const linkedSet = new Set((links ?? []).map((l) => l.parent_id));
      return (parents ?? []).filter(
        (p) => !linkedSet.has(p.id) || !p.user_id,
      );
    },
  });
}

export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("parent_links").delete().eq("parent_id", id);
      const { error } = await supabase.from("parents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
    },
  });
}

// ---------- Helpers: latest data dates for admin defaults ----------
export function useLatestAttendanceDate() {
  return useQuery({
    queryKey: ["admin", "latest_attendance_date"],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_entries")
        .select("date")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.date ?? null;
    },
  });
}

export function useLatestPerformanceDate() {
  return useQuery({
    queryKey: ["admin", "latest_performance_date"],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_marks_entries")
        .select("date")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.date ?? null;
    },
  });
}

export function useLatestFeeMonth() {
  return useQuery({
    queryKey: ["admin", "latest_fee_month"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_payments")
        .select("month, paid_on")
        .order("paid_on", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.month ?? null;
    },
  });
}

// Parent dashboard helpers
export function useChildLastExam(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "last_exam", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_marks")
        .select("marks_obtained, is_absent, exam_marks_entries!inner(exam_name, total_marks, status, created_at)")
        .eq("student_id", studentId!)
        .eq("exam_marks_entries.status", "approved")
        .order("exam_marks_entries(created_at)", { ascending: false } as never)
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });
}

export function useChildTodayPerformance(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["parent", "today_perf", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_marks")
        .select("grade, daily_marks_entries!inner(date, status)")
        .eq("student_id", studentId!)
        .eq("daily_marks_entries.status", "approved")
        .order("daily_marks_entries(date)", { ascending: false } as never)
        .limit(20);
      const rows = (data ?? []) as any[];
      if (rows.length === 0) return null;
      const latestDate = rows[0].daily_marks_entries.date;
      const todays = rows.filter((r) => r.daily_marks_entries.date === latestDate);
      const counts: Record<string, number> = { aala: 0, behter: 0, munasib: 0, kamzore: 0, naaga: 0 };
      todays.forEach((r) => (counts[r.grade] = (counts[r.grade] ?? 0) + 1));
      return { date: latestDate as string, counts };
    },
  });
}
