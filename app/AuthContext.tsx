"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refetchProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedInitially = useRef(false);

  const fetchProfile = async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data || null);
  };

  useEffect(() => {
    // Caricamento iniziale sicuro
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);
      hasLoadedInitially.current = true;
      setLoading(false);
    };
    initAuth();

    // Ascoltatore dei cambiamenti (Login / Registrazione / Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Nessun setLoading(true) qui! Evitiamo il re-render al cambio scheda.
        setSession(session);
        setUser(session?.user ?? null);
        await fetchProfile(session?.user ?? null);
        if (!hasLoadedInitially.current) {
          hasLoadedInitially.current = true;
          setLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        refetchProfile: () => fetchProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
