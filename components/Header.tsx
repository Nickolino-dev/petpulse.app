"use client";
import { usePet } from "../app/PetContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "../app/AuthContext";
import Link from "next/link";

export default function Header() {
  const { activePet, togglePet } = usePet();
  const { user, profile } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-[#FDFBF7] flex justify-between items-center px-4 z-50 border-b border-[#2D4A3E]/10 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar Utente */}
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full border-2 border-[#E67E70] bg-gray-200 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all flex-shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[#2D4A3E]">
                {(profile?.username?.[0] || "P").toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        {/* Info Animale */}
        <div className="flex flex-col">
          <h2 className="text-[#2D4A3E] font-bold leading-none text-base">
            {profile?.pet_name || "Il mio Pet"}
          </h2>
          <p className="text-[#2D4A3E]/60 text-[10px] uppercase font-bold tracking-tight">
            di {profile?.username || "Utente"}
          </p>
        </div>
      </div>

      {/* Logo e Logout */}
      <div className="flex flex-col items-end">
        <div className="text-[#2D4A3E] font-black text-xl italic tracking-tighter">
          PetPulse
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-[10px] font-bold text-gray-400 hover:text-[#E67E70] active:scale-95 transition-all uppercase tracking-wide"
        >
          Esci
        </button>
      </div>
    </header>
  );
}
