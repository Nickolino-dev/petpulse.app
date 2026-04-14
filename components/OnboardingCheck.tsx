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
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Se il Context sta caricando (loading vero), non fare nulla.
      if (loading) return;

      // 2. Se il loading è FINITO ma non c'è l'utente
      if (!user) {
        // Se siamo già in una pagina pubblica (tipo login/registrazione), sblocchiamo lo spinner
        if (pathname === "/login" || pathname === "/register") {
          setIsLoading(false);
          return;
        }
        // Altrimenti, diamo un piccolo margine (500ms) per la INITIAL_SESSION di Supabase
        const timeout = setTimeout(() => {
          if (!user) {
            console.log("🚫 Utente non trovato dopo attesa, vado al login");
            // router.push("/login"); // Scommenta questa riga se hai una pagina di login
            setIsLoading(false); // Per ora sblocchiamo e basta per vedere cosa succede
          }
        }, 1000);
        return () => clearTimeout(timeout);
      }

      console.log("🔍 Onboarding: Controllo profilo per", user.id);

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const isProfileIncomplete =
          !profile?.username ||
          !profile?.pet_name ||
          profile?.pet_name === "Il mio Pet";

        const isOnboardingPage = pathname === "/onboarding";

        if (isProfileIncomplete && !isOnboardingPage) {
          router.push("/onboarding");
        } else if (!isProfileIncomplete && isOnboardingPage) {
          router.push("/");
        } else {
          console.log("✅ ACCESSO OK");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Errore check:", err);
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, loading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
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
