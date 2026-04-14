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
      // 1. Se stiamo ancora caricando il Context, non fare nulla
      if (loading) return;

      // 2. Se non c'è l'utente dopo che il caricamento è finito,
      // forse sta ancora arrivando la sessione. Aspettiamo un attimo.
      if (!user) {
        console.log("⏳ Onboarding: Aspettando l'utente...");
        return;
      }

      console.log("🔍 Onboarding: Controllo accesso per", user.email);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Errore Fetch:", error);
      }

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
      } else {
        console.log("✅ ACCESSO GARANTITO");
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, loading, pathname, router]);

  // Se siamo ancora in caricamento O se non c'è ancora l'utente (mentre la sessione arriva)
  if (isLoading || (loading && !user)) {
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
