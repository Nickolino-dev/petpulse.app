"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// 1. Definiamo cosa trasmettiamo
interface PetContextType {
  activePet: string;
  togglePet: () => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

// 2. Il componente che "avvolge" l'app e trasmette il segnale
export function PetProvider({ children }: { children: ReactNode }) {
  const [activePet, setActivePet] = useState("Thor");

  const togglePet = () => {
    setActivePet((prev) => (prev === "Thor" ? "Luna" : "Thor"));
  };

  return (
    <PetContext.Provider value={{ activePet, togglePet }}>
      {children}
    </PetContext.Provider>
  );
}

// 3. Il "ricevitore" che useremo nelle pagine
export function usePet() {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePet deve essere usato dentro PetProvider");
  return context;
}
