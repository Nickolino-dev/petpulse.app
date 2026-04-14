"use client";

import { usePet } from "../app/PetContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "../app/AuthContext";
import Link from "next/link";

export default function Header() {
  // 1. Prendiamo i dati reali dal PetContext (che ora si chiamano petData)
  const { petData, loading } = usePet();
  const { user } = useAuth();

  // Funzione per il logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Non serve il redirect manuale se OnboardingCheck è attivo,
    // lo farà lui sentendo che user è null.
  };

  // Definiamo i valori di visualizzazione con i dati del DB o fallback
  const petName = petData?.pet_name || "Il mio Pet";
  const userName = petData?.username || "Utente";
  const avatarUrl = petData?.avatar_url || null;

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-[#FDFBF7] flex justify-between items-center px-4 z-50 border-b border-[#2D4A3E]/10 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar Utente */}
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full border-2 border-[#E67E70] bg-gray-200 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[#2D4A3E]">
                {userName[0].toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        {/* Info Animale - Ora reagisce al database! */}
        <div className="flex flex-col">
          <h2 className="text-[#2D4A3E] font-bold leading-none text-base">
            {loading ? "..." : petName}
          </h2>
          <p className="text-[#2D4A3E]/60 text-[10px] uppercase font-bold tracking-tight">
            di {loading ? "..." : userName}
          </p>
        </div>
      </div>

      {/* Logo e Logout */}
      <div className="flex flex-col items-end">
        <div className="text-[#2D4A3E] font-black text-xl italic tracking-tighter">
          PetPulse
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] font-bold text-gray-400 hover:text-[#E67E70] active:scale-95 transition-all uppercase tracking-wide"
        >
          Esci
        </button>
      </div>
    </header>
  );
}
