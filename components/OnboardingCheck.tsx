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
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const check = async () => {
      // 1. CRITICO: Se AuthContext sta ancora caricando, non fare ASSOLUTAMENTE nulla.
      // Aspettiamo che Supabase dica la sua.
      if (loading) {
        return;
      }

      // 2. Se loading è finito e NON c'è l'utente
      if (!user) {
        if (pathname !== "/auth") {
          console.log("👋 Nessun utente, vai al login");
          router.push("/auth");
        } else {
          setIsVerifying(false);
        }
        return;
      }

      // 3. Se c'è l'utente, controlliamo il profilo
      try {
        console.log("👤 Utente trovato, controllo profilo...");
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, pet_name")
          .eq("id", user.id)
          .single();

        const isProfileIncomplete =
          !profile?.username ||
          !profile?.pet_name ||
          profile?.pet_name === "Il mio Pet";

        if (isProfileIncomplete && pathname !== "/onboarding") {
          router.push("/onboarding");
        } else if (
          !isProfileIncomplete &&
          (pathname === "/onboarding" || pathname === "/auth")
        ) {
          router.push("/");
        } else {
          // Tutto ok, sblocchiamo la vista
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("Errore profilo:", err);
        setIsVerifying(false);
      }
    };

    check();
  }, [user, loading, pathname, router]);

  // Mostriamo lo spinner solo se stiamo effettivamente verificando o se l'auth è in corso
  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
          🐾
        </div>
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse uppercase tracking-widest">
          Riconoscendo l'odore...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
