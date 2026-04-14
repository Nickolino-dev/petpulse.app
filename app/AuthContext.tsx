"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        console.log("🔄 Auth: Recupero sessione iniziale...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("❌ Auth: Errore durante il recupero sessione:", err);
        setUser(null);
      } finally {
        setLoading(false); // Sblocca SEMPRE lo stato iniziale
        console.log("✅ Auth: Caricamento iniziale completato.");
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔔 Auth: Stato cambiato ->", event);
        setUser(session?.user ?? null);
        setLoading(false); // Sblocca anche in caso di login/logout successivo
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
