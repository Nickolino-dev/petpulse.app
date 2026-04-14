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

  const fetchProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      setProfile(data || null);
    } catch (error) {
      console.error("Errore fetchProfile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Otteniamo la sessione subito
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // 2. Se c'è un utente, iniziamo a caricare il profilo MA non blocchiamo l'app
        if (currentUser) {
          fetchProfile(currentUser);
        }
      } catch (error) {
        console.error("Errore inizializzazione Auth:", error);
      } finally {
        // 3. Sblocchiamo SEMPRE il loading qui, per permettere all'app di partire
        console.log("🔓 AuthContext: Caricamento iniziale completato.");
        hasLoadedInitially.current = true;
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("🔔 Auth State Change:", event);

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }

        // Se per qualche motivo il loading è ancora true, sbloccalo
        setLoading(false);
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
