import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});
type FormVals = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormVals) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      // we still show success to avoid leaking which emails exist
      console.error(error);
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <Link
          to="/"
          className="mb-6 flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            M
          </div>
          <div className="text-sm font-semibold">Madrassah LMS</div>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-[var(--color-success)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Reset link sent</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for that email, we've sent a password reset
              link. Please check your inbox.
            </p>
            <Link to="/login">
              <Button className="mt-6 w-full">Back to login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered email. We'll send a reset link.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to login
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
