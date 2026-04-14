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
      // 1. Aspettiamo che l'AuthContext capisca chi siamo
      if (loading) return;

      // 2. SE NON C'È L'UTENTE
      if (!user) {
        // Se siamo già nella pagina di autenticazione, sblocchiamo lo spinner e stop
        if (pathname === "/auth") {
          setIsLoading(false);
          return;
        }

        // Se proviamo ad andare altrove senza essere loggati, via verso /auth
        console.log("🚫 Utente non loggato, redirect a /auth");
        router.push("/auth");
        return;
      }

      // 3. SE C'È L'UTENTE, controlliamo se ha finito l'onboarding
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, pet_name")
          .eq("id", user.id)
          .single();

        const isProfileIncomplete =
          !profile?.username ||
          !profile?.pet_name ||
          profile?.pet_name === "Il mio Pet";

        const isOnboardingPage = pathname === "/onboarding";

        if (isProfileIncomplete && !isOnboardingPage) {
          router.push("/onboarding");
        } else if (
          !isProfileIncomplete &&
          (isOnboardingPage || pathname === "/auth")
        ) {
          // Se il profilo è ok ma siamo su pagine di servizio, andiamo in Home
          router.push("/");
        } else {
          // Tutto in regola, via lo spinner
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
          Verifica in corso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
