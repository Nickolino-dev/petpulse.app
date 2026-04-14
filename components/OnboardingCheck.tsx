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
      // Se l'AuthContext sta ancora lavorando, restiamo in attesa
      if (loading) return;

      // Se non c'è l'utente, aspettiamo che arrivi la sessione (non sblocchiamo ancora)
      if (!user) {
        console.log("⏳ Onboarding: In attesa di utente/sessione...");
        // Se dopo 3 secondi non c'è ancora nessuno, allora è davvero un ospite
        const timer = setTimeout(() => {
          if (!user) setIsLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
      }

      console.log("🔍 Onboarding: Utente trovato, controllo profilo...");

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Controllo se il profilo è quello di default o incompleto
        const isProfileIncomplete =
          !profile?.username ||
          !profile?.pet_name ||
          profile?.pet_name === "Il mio Pet" ||
          profile?.pet_name === "Nuovo Pet";

        const isOnboardingPage = pathname === "/onboarding";

        if (isProfileIncomplete && !isOnboardingPage) {
          router.push("/onboarding");
        } else if (!isProfileIncomplete && isOnboardingPage) {
          router.push("/");
          setIsLoading(false); // Sblocchiamo qui se siamo già a casa
        } else {
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
          Caricamento profilo...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
