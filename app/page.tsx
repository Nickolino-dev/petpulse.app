"use client"; // Fondamentale perché usiamo useEffect

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PetCard from "../components/PetCard";
import { usePet } from "./PetContext";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tutti" | "mio">("tutti");
  const { activePet } = usePet();

  useEffect(() => {
    // Funzione per andare a prendere i post dal database
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Aggiungiamo un limite per non scaricare troppi dati e bloccare il PC

      if (error) {
        console.error("Errore nel recupero post:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  // Applichiamo il filtro dinamicamente ai post
  const filteredPosts =
    filter === "tutti"
      ? posts
      : posts.filter((post) => post.pet_name === activePet);

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 px-2">
        <h1 className="text-2xl font-black text-[#2D4A3E] tracking-tight">
          Il mio Branco
        </h1>
        <p className="text-gray-500 text-sm">Post reali dal cloud ☁️</p>
      </div>

      {/* Selettore Filtri */}
      <div className="flex gap-2 px-2 mb-6">
        <button
          onClick={() => setFilter("tutti")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            filter === "tutti"
              ? "bg-[#2D4A3E] text-white shadow-md"
              : "bg-white text-[#2D4A3E] border border-[#2D4A3E]/10"
          }`}
        >
          Tutti gli Ululati
        </button>
        <button
          onClick={() => setFilter("mio")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            filter === "mio"
              ? "bg-[#2D4A3E] text-white shadow-md"
              : "bg-white text-[#2D4A3E] border border-[#2D4A3E]/10"
          }`}
        >
          Solo {activePet}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#2D4A3E] font-bold animate-pulse">
          Fiutando i post nel database... 🐾
        </div>
      ) : (
        /* Utilizzando key={filter + activePet} inganniamo React costringendolo a 
           ri-renderizzare questo div e far ripartire l'animazione in e fade-in fluidamente */
        <div
          key={filter + activePet}
          className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PetCard
                key={post.id}
                id={post.id}
                user={post.user_name}
                petName={post.pet_name}
                image={post.image || ""}
                caption={post.caption}
                likes={post.likes || 0}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              Ancora nessun post da {activePet}... 🐾
            </div>
          )}
        </div>
      )}
    </div>
  );
}
