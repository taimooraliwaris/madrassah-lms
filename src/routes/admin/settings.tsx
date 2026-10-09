import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Plus, Trash2, Check } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/forms/Field";
import { Separator } from "@/components/ui/separator";
import { useSettings, useSaveSettings } from "@/hooks/queries";
import { useBranding, type Theme } from "@/contexts/BrandingContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type PanelId =
  | "general"
  | "academic"
  | "grading"
  | "verification"
  | "appearance"
  | "language";

const PANELS: { id: PanelId; label: string }[] = [
  { id: "general", label: "Institution" },
  { id: "academic", label: "Academic Year" },
  { id: "grading", label: "Grading System" },
  { id: "verification", label: "Verification Rules" },
  { id: "appearance", label: "Appearance" },
  { id: "language", label: "Language" },
];

function SettingsPage() {
  const [panel, setPanel] = useState<PanelId>("general");
  const { data: s, isLoading } = useSettings();
  const save = useSaveSettings();

  return (
    <div>
      <EntityHeader
        title="System Settings"
        subtitle="Manage institution-wide configuration"
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="p-2 h-fit">
          <nav className="space-y-0.5">
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition",
                  panel === p.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </Card>

        <Card className="p-5">
          {isLoading || !s ? (
  <p className="text-sm text-muted-foreground">Loading…</p>
) : panel === "general" ? (
  <GeneralPanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
) : panel === "academic" ? (
  <AcademicPanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
) : panel === "grading" ? (
  <GradingPanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
) : panel === "verification" ? (
  <VerificationPanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
) : panel === "appearance" ? (
  <AppearancePanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
) : (
  <LanguagePanel s={s} onSave={(p: any) => save.mutateAsync(p)} pending={save.isPending} />
)}
        </Card>
      </div>
    </div>
  );
}

function PanelShell({
  title,
  children,
  onSave,
  pending,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => Promise<void>;
  pending: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button onClick={onSave} disabled={pending}>
          <Save className="mr-1.5 h-4 w-4" />
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <Separator className="mb-4" />
      {children}
    </div>
  );
}

function GeneralPanel({ s, onSave, pending }: any) {
  const [v, setV] = useState({
    institution_name: s.institution_name ?? "",
    tagline: s.tagline ?? "",
    contact_email: s.contact_email ?? "",
    contact_phone: s.contact_phone ?? "",
    institution_logo_url: s.institution_logo_url ?? "",
  });
  useEffect(() => {
    setV({
      institution_name: s.institution_name ?? "",
      tagline: s.tagline ?? "",
      contact_email: s.contact_email ?? "",
      contact_phone: s.contact_phone ?? "",
      institution_logo_url: s.institution_logo_url ?? "",
    });
  }, [s]);
  return (
    <PanelShell
      title="Institution"
      onSave={async () => {
        await onSave(v);
        toast.success("Settings saved");
      }}
      pending={pending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institution name" required>
          <Input value={v.institution_name} onChange={(e) => setV({ ...v, institution_name: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <Input value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} />
        </Field>
        <Field label="Contact email">
          <Input type="email" value={v.contact_email} onChange={(e) => setV({ ...v, contact_email: e.target.value })} />
        </Field>
        <Field label="Contact phone">
          <Input value={v.contact_phone} onChange={(e) => setV({ ...v, contact_phone: e.target.value })} />
        </Field>
        <Field label="Institution logo URL" className="sm:col-span-2">
          <Input value={v.institution_logo_url} onChange={(e) => setV({ ...v, institution_logo_url: e.target.value })} placeholder="https://…" />
        </Field>
        {v.institution_logo_url && (
          <div className="sm:col-span-2 flex items-center gap-3">
            <img src={v.institution_logo_url} alt="Logo preview" className="h-16 w-16 rounded-md border object-cover" />
            <p className="text-xs text-muted-foreground">Logo preview</p>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function AcademicPanel({ s, onSave, pending }: any) {
  const [year, setYear] = useState(s.academic_year ?? "");
  useEffect(() => setYear(s.academic_year ?? ""), [s]);
  return (
    <PanelShell title="Academic Year" onSave={async () => { await onSave({ academic_year: year }); toast.success("Saved"); }} pending={pending}>
      <Field label="Current academic year" required>
        <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024-2025" />
      </Field>
    </PanelShell>
  );
}

function GradingPanel({ s, onSave, pending }: any) {
  type GradeRow = { grade: string; min: number };
  const [rows, setRows] = useState<GradeRow[]>(Array.isArray(s.grading_scale) ? s.grading_scale : []);
  useEffect(() => { setRows(Array.isArray(s.grading_scale) ? s.grading_scale : []); }, [s]);
  return (
    <PanelShell title="Grading System" onSave={async () => { await onSave({ grading_scale: rows }); toast.success("Saved"); }} pending={pending}>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="w-20" value={r.grade} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} />
            <Input type="number" className="w-24" value={r.min} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} />
            <span className="text-sm text-muted-foreground">% and above</span>
            <Button size="icon" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setRows([...rows, { grade: "", min: 0 }])}>
          <Plus className="mr-1.5 h-4 w-4" /> Add grade
        </Button>
      </div>
    </PanelShell>
  );
}

function VerificationPanel({ s, onSave, pending }: any) {
  const initial = (s.verification_rules ?? {}) as Record<string, boolean>;
  const [rules, setRules] = useState({
    attendance: initial.attendance ?? false,
    daily_marks: initial.daily_marks ?? false,
    exam_marks: initial.exam_marks ?? false,
    fee_payments: initial.fee_payments ?? true,
    remarks: initial.remarks ?? false,
  });
  useEffect(() => {
    const r = (s.verification_rules ?? {}) as Record<string, boolean>;
    setRules({
      attendance: r.attendance ?? false,
      daily_marks: r.daily_marks ?? false,
      exam_marks: r.exam_marks ?? false,
      fee_payments: r.fee_payments ?? true,
      remarks: r.remarks ?? false,
    });
  }, [s]);
  const items: { key: keyof typeof rules; label: string }[] = [
    { key: "fee_payments", label: "Fee payment entries" },
    { key: "attendance", label: "Attendance entries" },
    { key: "daily_marks", label: "Daily marks entries" },
    { key: "exam_marks", label: "Exam marks entries" },
    { key: "remarks", label: "Teacher remarks" },
  ];
  return (
    <PanelShell title="Verification Rules" onSave={async () => { await onSave({ verification_rules: rules }); toast.success("Saved"); }} pending={pending}>
      <p className="mb-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        By default only fee payments need admin approval. Enable other switches only if you want operator entries to wait for verification.
      </p>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm font-medium">{it.label}</Label>
            <Switch checked={rules[it.key]} onCheckedChange={(v) => setRules({ ...rules, [it.key]: v })} />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function AppearancePanel({ s, onSave, pending }: any) {
  const branding = useBranding();
  const initialThemes: Theme[] = Array.isArray(s.themes) && s.themes.length > 0 ? s.themes : branding.themes;
  const [themes, setThemes] = useState<Theme[]>(initialThemes);
  const [activeId, setActiveId] = useState<string>(s.primary_theme_id ?? initialThemes[0]?.id ?? "");
  useEffect(() => {
    const t = Array.isArray(s.themes) && s.themes.length > 0 ? s.themes : branding.themes;
    setThemes(t);
    setActiveId(s.primary_theme_id ?? t[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const update = (i: number, patch: Partial<Theme>) =>
    setThemes(themes.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const addTheme = () => {
    if (themes.length >= 5) return toast.error("Maximum 5 themes");
    const id = `custom${themes.length + 1}`;
    setThemes([
      ...themes,
      {
        id,
        name: `Custom ${themes.length + 1}`,
        primary: "oklch(0.5 0.1 220)",
        accent: "oklch(0.72 0.12 75)",
        background: "oklch(0.98 0.01 95)",
        foreground: "oklch(0.2 0.02 220)",
      },
    ]);
  };

  return (
    <PanelShell
      title="Appearance"
      onSave={async () => {
        await onSave({ themes, primary_theme_id: activeId });
        branding.setThemeId(activeId);
        toast.success("Theme saved");
      }}
      pending={pending}
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Pick the active theme for the entire portal. You can edit colors or add up to 5 presets.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {themes.map((t, i) => (
          <Card
            key={t.id}
            className={cn(
              "cursor-pointer p-4 transition",
              activeId === t.id && "ring-2 ring-primary",
            )}
            onClick={() => setActiveId(t.id)}
          >
            <div className="mb-3 flex items-center justify-between">
              <Input
                className="h-8 max-w-[160px]"
                value={t.name}
                onChange={(e) => update(i, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              />
              {activeId === t.id && <Check className="h-4 w-4 text-primary" />}
            </div>
            <div
              className="mb-3 flex h-16 items-center justify-center rounded-md text-xs font-bold"
              style={{ background: t.primary, color: t.foreground }}
            >
              <span style={{ background: t.accent, padding: "4px 10px", borderRadius: 6, color: t.foreground }}>
                Aa
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
              {(["primary", "accent", "background", "foreground"] as const).map((k) => (
                <label key={k} className="space-y-1">
                  <span className="text-muted-foreground capitalize">{k}</span>
                  <Input className="h-7 text-xs" value={(t as any)[k]} onChange={(e) => update(i, { [k]: e.target.value } as any)} />
                </label>
              ))}
            </div>
            {themes.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setThemes(themes.filter((_, j) => j !== i));
                  if (activeId === t.id) setActiveId(themes[0]?.id ?? "");
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" /> Remove
              </Button>
            )}
          </Card>
        ))}
      </div>
      {themes.length < 5 && (
        <Button size="sm" variant="outline" className="mt-3" onClick={addTheme}>
          <Plus className="mr-1.5 h-4 w-4" /> Add theme
        </Button>
      )}
    </PanelShell>
  );
}

function LanguagePanel({ s, onSave, pending }: any) {
  const branding = useBranding();
  const [lang, setLang] = useState<"en" | "ur">(s.default_language ?? "en");
  const [urduOn, setUrduOn] = useState<boolean>(s.urdu_enabled ?? true);
  useEffect(() => {
    setLang(s.default_language ?? "en");
    setUrduOn(s.urdu_enabled ?? true);
  }, [s]);
  return (
    <PanelShell
      title="Language"
      onSave={async () => {
        await onSave({ default_language: lang, urdu_enabled: urduOn });
        branding.setLanguage(lang);
        toast.success("Language saved");
      }}
      pending={pending}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm font-medium">Enable Urdu Mode</Label>
            <p className="text-xs text-muted-foreground">
              Allow users to switch to Urdu (RTL).
            </p>
          </div>
          <Switch checked={urduOn} onCheckedChange={setUrduOn} />
        </div>

        <Field label="Default language">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={lang === "en" ? "default" : "outline"}
              onClick={() => setLang("en")}
            >
              English
            </Button>
            <Button
              type="button"
              variant={lang === "ur" ? "default" : "outline"}
              onClick={() => setLang("ur")}
              disabled={!urduOn}
            >
              اردو
            </Button>
          </div>
        </Field>

        <div
          className="rounded-md border p-4"
          dir={branding.language === "ur" ? "rtl" : "ltr"}
        >
          <h3 className="font-semibold">{branding.t("common.welcome_back")}</h3>
          <p className="text-sm text-muted-foreground">
            {branding.t("landing.ayah")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {branding.t("landing.ayah_ref")}
          </p>
        </div>
      </div>
    </PanelShell>
  );
}
