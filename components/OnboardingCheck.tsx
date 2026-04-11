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
      // Effetto di Controllo: non facciamo nulla finché l'utente non è certo
      if (loading || !user) return;

      // Fetch Profilo Silenzioso e Assoluto (aspetta Supabase)
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Stato Profilo:", profile); // Debug: Controlliamo cosa arriva dal DB

      const isProfileIncomplete =
        !profile?.username ||
        !profile?.pet_name ||
        profile?.pet_name === "Il mio Pet" ||
        profile?.pet_name === "Nuovo Pet";
      const isOnboardingPage = pathname === "/onboarding";

      // Redirect Sicuro: sostituiamo la rotta e NON sblocchiamo isLoading
      if (isProfileIncomplete && !isOnboardingPage) {
        router.push("/onboarding");
      } else if (!isProfileIncomplete && isOnboardingPage) {
        router.push("/");
      } else {
        // Profilo OK e pagina corretta: sblocca Navbar, Header e Feed!
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, loading, pathname, router]);

  // Protezione Rendering (non restituisce i "children" finché non siamo sicuri)
  if (isLoading) {
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
