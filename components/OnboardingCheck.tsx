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
  const [status, setStatus] = useState<
    "checking" | "authorized" | "redirecting"
  >("checking");

  useEffect(() => {
    // 1. Se l'AuthContext sta ancora caricando, non muovere un muscolo
    if (loading) return;

    const runCheck = async () => {
      // 2. Se non c'è l'utente dopo il caricamento
      if (!user) {
        if (pathname !== "/auth") {
          setStatus("redirecting");
          router.push("/auth");
        } else {
          setStatus("authorized");
        }
        return;
      }

      // 3. Se c'è l'utente, verifichiamo il profilo nel DB
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

        if (isProfileIncomplete && pathname !== "/onboarding") {
          setStatus("redirecting");
          router.push("/onboarding");
        } else if (
          !isProfileIncomplete &&
          (pathname === "/onboarding" || pathname === "/auth")
        ) {
          setStatus("redirecting");
          router.push("/");
        } else {
          // TUTTO OK: Sblocca l'interfaccia
          setStatus("authorized");
        }
      } catch (err) {
        console.error("Errore check profilazione:", err);
        setStatus("authorized"); // In caso di errore, meglio far entrare l'utente che bloccarlo
      }
    };

    runCheck();
  }, [user, loading, pathname, router]);

  // Se siamo in stato "checking" o l'auth sta ancora caricando, mostriamo lo spinner
  if (loading || status === "checking" || status === "redirecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
          🐾
        </div>
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse uppercase tracking-widest text-center">
          Verifica in corso...
          <br />
          <span className="text-[10px] lowercase font-normal opacity-50">
            Stiamo sincronizzando la cuccia
          </span>
        </div>
      </div>
    );
  }

  // Solo se lo stato è "authorized" mostriamo il contenuto
  return <>{children}</>;
}
