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
      // 1. Aspettiamo che l'AuthContext finisca di capire chi sei
      if (loading) return;

      // 2. SE NON C'È L'UTENTE
      if (!user) {
        // Se sei già sulla pagina di login o registrazione, ti lascio vedere la pagina
        if (pathname === "/login" || pathname === "/register") {
          setIsLoading(false);
          return;
        }

        // SE NON SEI LOGGATO e provi a entrare nella Home, ti sbatto al Login
        console.log(
          "🚫 Accesso negato: Utente non loggato. Redirect al login...",
        );
        router.push("/login"); // Assicurati di avere questa rotta!
        return;
      }

      // 3. SE C'È L'UTENTE, controlliamo il profilo
      console.log("✅ Utente rilevato:", user.id);

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
          console.log("⚠️ Profilo incompleto, vai all'onboarding");
          router.push("/onboarding");
        } else if (!isProfileIncomplete && isOnboardingPage) {
          router.push("/");
        } else {
          // Tutto ok, entra pure
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Errore nel check:", err);
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
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse uppercase tracking-widest">
          Annusando le tracce...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
