"use client";

import { useState } from "react";

export default function MappePage() {
  const [filtroAttivo, setFiltroAttivo] = useState("Tutti");

  const filtri = ["Tutti", "Sgambatoi", "Veterinari", "Negozi"];

  return (
    <div className="relative h-screen w-full -mt-24 -mx-4 overflow-hidden">
      {/* 1. SFONDO: Qui caricheremo la mappa vera. Per ora usiamo un placeholder stilizzato */}
      <div className="absolute inset-0 bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-center opacity-30">
          <span className="text-9xl">🗺️</span>
          <p className="font-bold text-[#2D4A3E]">Caricamento Mappa...</p>
        </div>

        {/* Simuliamo dei PIN sulla mappa */}
        <div className="absolute top-1/3 left-1/4 bg-[#E67E70] p-2 rounded-full shadow-lg animate-bounce">
          📍
        </div>
        <div className="absolute top-1/2 right-1/3 bg-[#2D4A3E] p-2 rounded-full shadow-lg">
          📍
        </div>
      </div>

      {/* 2. FILTRI: Bottoni flottanti in alto */}
      <div className="absolute top-28 left-0 w-full px-4 flex gap-2 overflow-x-auto no-scrollbar z-10">
        {filtri.map((f) => (
          <button
            key={f}
            onClick={() => setFiltroAttivo(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all ${
              filtroAttivo === f
                ? "bg-[#2D4A3E] text-white"
                : "bg-white text-[#2D4A3E]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3. SCHEDA DETTAGLIO: In basso, sopra la navbar */}
      <div className="absolute bottom-32 left-4 right-4 bg-white p-4 rounded-3xl shadow-xl z-10 border border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
              Aperto ora
            </span>
            <h3 className="text-[#2D4A3E] font-bold text-lg">
              Parco Sempione - Area Cani
            </h3>
            <p className="text-gray-400 text-xs">A 1.2 km da te • Milano</p>
          </div>
          <div className="bg-[#FDFBF7] p-2 rounded-xl text-xl">🌳</div>
        </div>
        <button className="w-full bg-[#2D4A3E] text-white py-3 rounded-2xl font-bold text-sm mt-2 active:scale-95 transition-all">
          Portami qui 🚗
        </button>
      </div>
    </div>
  );
}
