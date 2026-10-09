import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const inquirySchema = z.object({
  student_name: z.string().trim().min(2, "Enter the student's name").max(100),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  program: z.enum(["Hifz", "Nazra"]),
  parent_name: z.string().trim().min(2, "Enter your name").max(100),
  parent_phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20),
  parent_email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional(),
  message: z.string().max(1000).optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

function LandingPage() {
  const branding = useBranding();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { program: "Hifz" },
  });

  const onSubmit = async (data: InquiryForm) => {
    const payload = {
      ...data,
      parent_email: data.parent_email || null,
      date_of_birth: data.date_of_birth || null,
    };
    const { error } = await supabase.from("admission_inquiries").insert(payload);
    if (error) {
      toast.error("Could not submit inquiry. Please try again.");
      console.error(error);
      return;
    }
    setSubmitted(true);
    reset();
    toast.success("Inquiry submitted. We'll be in touch shortly.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.institutionName} className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                {branding.institutionName.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold leading-tight">{branding.institutionName}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {branding.tagline}
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#programs" className="text-sm text-muted-foreground hover:text-foreground">
              Programs
            </a>
            <a href="#why" className="text-sm text-muted-foreground hover:text-foreground">
              Why us
            </a>
            <a href="#apply" className="text-sm text-muted-foreground hover:text-foreground">
              Apply
            </a>
          </nav>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-arabesque text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> Admissions open · 2024-25
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Sacred education,<br />guided by tradition,<br />tracked with care.
            </h1>
            <p className="mt-5 max-w-md text-base/relaxed opacity-90">
              Madrassah Al-Noor offers structured Hifz and Nazra programs with
              transparent progress tracking for parents and disciplined daily
              learning for students.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#apply">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Apply for Admission
                </Button>
              </a>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  Portal Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="grid w-full max-w-sm grid-cols-2 gap-4">
              <Stat n="312" l="Students" />
              <Stat n="28" l="Teachers" />
              <Stat n="14" l="Hifz Classes" />
              <Stat n="98%" l="Attendance" />
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Programs</h2>
        <p className="mt-2 text-muted-foreground">
          Two structured tracks for every stage of Quranic learning.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Hifz Program</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Full memorization of the Holy Quran with daily Sabaq, Sabki,
              Manzil and Tarbiati Nisab tracking.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/15 text-accent-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nazra Program</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Correct reading with Tajweed — foundations for every student
              beginning their Quranic journey.
            </p>
          </Card>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="bg-card border-y">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Why parents trust us
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                t: "Verified records",
                d: "Every entry is reviewed by management before reaching your account.",
              },
              {
                icon: Users,
                t: "Parent portal",
                d: "Daily attendance, performance, and exam results in one place.",
              },
              {
                icon: BookOpen,
                t: "Structured learning",
                d: "Aala / Behter / Munasib / Kamzore / Naaga grading for clarity.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admission Inquiry
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tell us about your child. Our admissions team will reach out within
            2 working days.
          </p>
        </div>

        <Card className="mt-8 p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-[var(--color-success)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Inquiry received</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                JazakAllahu Khairan. We've recorded your inquiry. Our team will
                contact you on the phone number provided.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setSubmitted(false)}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 md:grid-cols-2"
            >
              <Field
                label="Student name *"
                error={errors.student_name?.message}
              >
                <Input {...register("student_name")} />
              </Field>
              <Field label="Date of birth" error={errors.date_of_birth?.message}>
                <Input type="date" {...register("date_of_birth")} />
              </Field>
              <Field label="Gender">
                <Select
                  value={watch("gender") ?? ""}
                  onValueChange={(v) => setValue("gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Program *" error={errors.program?.message}>
                <Select
                  value={watch("program")}
                  onValueChange={(v) =>
                    setValue("program", v as "Hifz" | "Nazra")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hifz">Hifz</SelectItem>
                    <SelectItem value="Nazra">Nazra</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Parent / Guardian name *"
                error={errors.parent_name?.message}
              >
                <Input {...register("parent_name")} />
              </Field>
              <Field label="Phone *" error={errors.parent_phone?.message}>
                <Input {...register("parent_phone")} />
              </Field>
              <Field
                className="md:col-span-2"
                label="Email"
                error={errors.parent_email?.message}
              >
                <Input type="email" {...register("parent_email")} />
              </Field>
              <Field className="md:col-span-2" label="Address">
                <Textarea rows={2} {...register("address")} />
              </Field>
              <Field
                className="md:col-span-2"
                label="Anything we should know?"
              >
                <Textarea rows={3} {...register("message")} />
              </Field>
              <div className="md:col-span-2">
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? "Submitting…" : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 md:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {branding.institutionName} · {branding.tagline}
          </div>
          <Link
            to="/login"
            className="text-sm text-primary hover:underline"
          >
            Staff & Parent Sign In →
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-center backdrop-blur">
      <div className="text-2xl font-bold text-accent">{n}</div>
      <div className="text-xs opacity-80">{l}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
