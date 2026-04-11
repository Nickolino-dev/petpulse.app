"use client";

import { usePet } from "../PetContext";

export default function Profilo() {
  const { activePet } = usePet();

  // Dati dinamici basati sul pet attivo
  const emoji = activePet === "Thor" ? "🐶" : "🐱";
  const bio =
    activePet === "Thor"
      ? "Il re del parchetto • 3 anni"
      : "La principessa del divano • 2 anni";

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Profilo */}
      <div className="mt-6 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-[#E67E70]/20 flex items-center justify-center text-6xl mb-4 shadow-sm border-4 border-white">
          {emoji}
        </div>

        {/* Info Bio */}
        <h1 className="font-black text-3xl text-[#2D4A3E] tracking-tight">
          {activePet}
        </h1>
        <p className="text-[#2D4A3E]/60 text-sm mt-2 font-medium">{bio}</p>
      </div>

      {/* Statistiche (Grid) */}
      <div className="grid grid-cols-3 gap-3 w-full mt-10">
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">15</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Post
          </span>
        </div>
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">42</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Amici
          </span>
        </div>
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">128</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Zampate
          </span>
        </div>
      </div>

      {/* Logout/Settings */}
      <button className="mt-16 px-6 py-3 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-black/5 transition-colors active:scale-95">
        ⚙️ Impostazioni
      </button>
    </div>
  );
}
