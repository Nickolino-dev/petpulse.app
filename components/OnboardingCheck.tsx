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
      // 1. Se il context sta caricando, NON sbloccare nulla.
      if (loading) return;

      // 2. Se il caricamento è finito ma l'utente NON c'è
      if (!user) {
        // Se siamo in una pagina che richiede login, forziamo il redirect
        // Se non hai ancora una pagina di login, per ora lo mandiamo a un ipotetico /login
        // o semplicemente lo lasciamo nel caricamento finché non decide cosa fare
        console.log(
          "⚠️ Nessun utente trovato. Reindirizzamento o sblocco ospite...",
        );
        setIsLoading(false);
        return;
      }

      // 3. Se l'utente C'È, allora controlliamo il profilo
      console.log("✅ Utente confermato:", user.id);

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Errore fetch profilo:", error);
        }

        const isProfileIncomplete =
          !profile?.username ||
          !profile?.pet_name ||
          profile?.pet_name === "Il mio Pet";

        const isOnboardingPage = pathname === "/onboarding";

        if (isProfileIncomplete && !isOnboardingPage) {
          router.push("/onboarding");
        } else {
          // Se tutto è ok, sblocchiamo l'interfaccia
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Errore critico:", err);
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, loading, pathname, router]);

  // Finché isLoading è vero, mostriamo lo spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
          🐾
        </div>
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse tracking-widest uppercase text-center px-4">
          Sto controllando chi sei... <br />
          <span className="text-[10px] font-normal">Un attimo di pazienza</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
