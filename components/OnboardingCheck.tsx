"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function OnboardingCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // Leggiamo solo l'Auth grezzo
  const router = useRouter();
  const pathname = usePathname();

  // Stato Iniziale di blocco (Protezione Rendering)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // DEBUG: Vediamo cosa succede all'inizio del controllo
      console.log("🔍 DEBUG CHECK:", {
        loading,
        hasUser: !!user,
        currentPath: pathname,
      });

      // Effetto di Controllo: non facciamo nulla finché l'utente non è certo
      if (loading) return;

      if (!user) {
        console.log("⚠️ Nessun utente trovato, stop al controllo.");
        return;
      }

      // Fetch Profilo Silenzioso e Assoluto (aspetta Supabase)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // DEBUG: Questo è il log fondamentale per stasera
      console.log("📄 RISULTATO DB PROFILO:", profile);
      if (error) console.error("❌ ERRORE SUPABASE:", error);

      const isProfileIncomplete =
        !profile?.username ||
        !profile?.pet_name ||
        profile?.pet_name === "Il mio Pet" ||
        profile?.pet_name === "Nuovo Pet";

      const isOnboardingPage = pathname === "/onboarding";

      console.log("🤔 STATUS:", { isProfileIncomplete, isOnboardingPage });

      // Redirect Sicuro: sostituiamo la rotta e NON sblocchiamo isLoading
      if (isProfileIncomplete && !isOnboardingPage) {
        console.log("➡️ Redirect verso ONBOARDING");
        router.push("/onboarding");
      } else if (!isProfileIncomplete && isOnboardingPage) {
        console.log("➡️ Profilo completo, redirect verso HOME");
        router.push("/");
      } else {
        // Profilo OK e pagina corretta: sblocca Navbar, Header e Feed!
        console.log("✅ ACCESSO GARANTITO: Sblocco UI");
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, loading, pathname, router]);

  // Protezione Rendering (non restituisce i "children" finché non siamo sicuri)
  if (isLoading) {
    // Un log che si ripete finché siamo bloccati
    console.log("⏳ UI ancora bloccata dallo spinner...");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse shadow-sm">
          🐾
        </div>
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse tracking-widest uppercase">
          Verificando la cuccia...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
