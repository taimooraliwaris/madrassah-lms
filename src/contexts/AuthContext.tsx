import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "operator" | "parent";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase.rpc("get_primary_role", {
      _user_id: uid,
    });
    if (error) {
      console.error("get_primary_role error", error);
      setRole(null);
    } else {
      setRole((data as AppRole | null) ?? null);
    }
  };

  useEffect(() => {
    // Set up listener BEFORE getSession (per docs)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Defer role lookup to avoid deadlocks
        setTimeout(() => {
          loadRole(newSession?.user?.id);
        }, 0);
      },
    );

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRole(data.session?.user?.id).finally(() => setLoading(false));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const refreshRole = async () => {
    await loadRole(user?.id);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleHome(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "operator":
      return "/operator/dashboard";
    case "parent":
      return "/parent/dashboard";
    default:
      return "/login";
  }
}
