import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CreateUserInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  role: z.enum(["admin", "operator", "parent"]),
});

export const createUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateUserInput.parse(data))
  .handler(async ({ data, context }) => {
    // Only admins may create users.
    const { data: roleRow, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Only admins can create users");

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone ?? null },
    });
    if (created.error) throw new Error(created.error.message);
    const newUserId = created.data.user!.id;

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { id: newUserId };
  });

const ResetInput = z.object({ email: z.string().email() });
export const sendPasswordResetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ResetInput.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      data.email,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
