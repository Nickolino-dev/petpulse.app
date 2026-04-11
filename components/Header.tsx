"use client";
import { usePet } from "../app/PetContext";

export default function Header() {
  const { activePet, togglePet } = usePet();

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-[#FDFBF7] flex justify-between items-center px-4 z-50 border-b border-[#2D4A3E]/10 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar/Toggle */}
        <div
          onClick={togglePet}
          className="w-12 h-12 rounded-full border-2 border-[#E67E70] bg-white flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <span className="text-2xl">{activePet === "Thor" ? "🐶" : "🐱"}</span>
        </div>

        {/* Info Animale */}
        <div className="flex flex-col">
          <h2 className="text-[#2D4A3E] font-bold leading-none text-base">
            {activePet}
          </h2>
          <p className="text-[#2D4A3E]/60 text-[10px] uppercase font-bold tracking-tight">
            Profilo Attivo
          </p>
        </div>
      </div>

      {/* Logo */}
      <div className="text-[#2D4A3E] font-black text-xl italic tracking-tighter">
        PetPulse
      </div>
    </header>
  );
}
