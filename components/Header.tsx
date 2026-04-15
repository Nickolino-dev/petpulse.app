"use client";

import { usePet } from "../app/PetContext";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { MessageCircle, LogOut } from "lucide-react"; // Se non hai lucide-react, usa le emoji o icone SVG

export default function Header() {
  const { petData, loading } = usePet();

  const petName = petData?.pet_name || "Il mio Pet";
  const userName = petData?.username || "Utente";
  const avatarUrl = petData?.avatar_url || null;

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-[#FDFBF7]/90 backdrop-blur-md flex justify-between items-center px-6 z-50 border-b border-[#2D4A3E]/5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Avatar con effetto soffice */}
        <Link href="/profile">
          <div className="relative group">
            <div className="w-12 h-12 rounded-full border-2 border-[#E67E70] bg-white p-0.5 shadow-md group-active:scale-95 transition-all overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#2D4A3E] font-bold">
                  {userName[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Info Testuali più pulite */}
        <div className="flex flex-col">
          <h2 className="text-[#2D4A3E] font-black leading-none text-[15px] tracking-tight">
            {loading ? "..." : petName}
          </h2>
          <p className="text-[#E67E70] text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">
            {loading ? "..." : `Proprietario: ${userName}`}
          </p>
        </div>
      </div>

      {/* Azioni Destra: Chat e Logout */}
      <div className="flex items-center gap-5">
        <Link
          href="/chat"
          className="relative p-2 bg-[#2D4A3E]/5 rounded-xl hover:bg-[#2D4A3E]/10 transition-colors"
        >
          <MessageCircle size={22} className="text-[#2D4A3E]" />
          {/* Badge notifica opzionale */}
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E67E70] border-2 border-[#FDFBF7] rounded-full"></span>
        </Link>

        <button
          onClick={() => supabase.auth.signOut()}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Esci"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
