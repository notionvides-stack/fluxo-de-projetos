import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/domain";

type AuthCtx = {
  session: Session | null;
  ready: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  userId: string | null;
};
const Ctx = createContext<AuthCtx>({ session: null, ready: false, profile: null, isAdmin: false, userId: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const userId = session?.user.id ?? null;
  const { data } = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      return { profile: p.data, isAdmin: !!r.data?.some((x) => x.role === "admin") };
    },
  });
  return (
    <Ctx.Provider value={{ session, ready, userId, profile: data?.profile ?? null, isAdmin: data?.isAdmin ?? false }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
