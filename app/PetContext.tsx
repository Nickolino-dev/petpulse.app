"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext"; // Importante per sapere chi è l'utente
import { supabase } from "../lib/supabase";

// 1. Definiamo i dati che vogliamo gestire
interface PetContextType {
  petData: any; // Conterrà tutto il rigo del profilo (username, pet_name, avatar_url, etc.)
  loading: boolean; // Per sapere se stiamo ancora scaricando i dati
  refreshPetData: () => Promise<void>; // Funzione per forzare l'aggiornamento
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export function PetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Funzione per recuperare i dati dal DB
  const fetchPetData = async () => {
    if (!user) {
      setPetData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Errore PetContext:", error.message);
      } else {
        setPetData(data);
      }
    } catch (err) {
      console.error("❌ Errore imprevisto PetContext:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Fondamentale: Ogni volta che l'utente cambia (login/refresh), scarichiamo i dati
  useEffect(() => {
    fetchPetData();
  }, [user]);

  return (
    <PetContext.Provider
      value={{ petData, loading, refreshPetData: fetchPetData }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePet deve essere usato dentro PetProvider");
  return context;
}
