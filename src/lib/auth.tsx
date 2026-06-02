import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isFuncionario: boolean;
  isStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, isFuncionario: false, isStaff: false, loading: true, signOut: async () => {},
});

const SUSPENDED_MSG = "Sua conta foi suspensa. Entre em contato com o suporte.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFuncionario, setIsFuncionario] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setIsAdmin(false);
        setIsFuncionario(false);
        return;
      }
      // Check ativo first
      const { data: profile } = await supabase
        .from("profiles")
        .select("ativo")
        .eq("id", s.user.id)
        .maybeSingle();
      if (profile && profile.ativo === false) {
        toast.error(SUSPENDED_MSG);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsFuncionario(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", s.user.id);
      const rs = (roles ?? []).map((r) => r.role);
      setIsAdmin(rs.includes("admin"));
      setIsFuncionario(rs.includes("funcionario"));
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => { hydrate(s); }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      hydrate(s).finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{
      user, session, isAdmin, isFuncionario,
      isStaff: isAdmin || isFuncionario,
      loading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
