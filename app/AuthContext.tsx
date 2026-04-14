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
      return null;
    }
    try {
      console.log("📡 AuthContext: Recupero profilo per ID:", currentUser.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 è "nessuna riga trovata", normale se nuovo utente
        console.error("❌ Errore DB Profilo:", error.message);
      }

      const profileData = data || null;
      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error("Errore fetchProfile:", error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("🎬 AuthContext: Avvio inizializzazione...");
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user);
        } else {
          console.log("ℹ️ Nessuna sessione iniziale trovata.");
        }
      } catch (error) {
        console.error("❌ Errore inizializzazione Auth:", error);
      } finally {
        console.log("🔓 AuthContext: Loading impostato a FALSE");
        setLoading(false);
        hasLoadedInitially.current = true;
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("🔔 Auth State Change:", event);

        // Gestiamo il caso di logout immediato
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user);
        }

        // Se l'app era rimasta appesa, questo la sblocca
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
