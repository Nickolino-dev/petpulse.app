"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PetCard from "../components/PetCard";
import { useAuth } from "./AuthContext";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tutti" | "mio">("tutti");
  const { user, profile } = useAuth();

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(username, pet_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50); // Aggiungiamo un limite per non scaricare troppi dati e bloccare il PC

      if (error) {
        console.error("Errore nel recupero post:", error.message || error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();

    // Creazione del canale Realtime per ascoltare i cambiamenti sulla tabella "posts"
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === payload.new.id ? payload.new : post,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
        },
      )
      .subscribe();

    // Cleanup: smonta il canale quando il componente viene chiuso
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Applichiamo il filtro dinamicamente ai post
  const filteredPosts =
    filter === "tutti"
      ? posts
      : posts.filter((post) => post.user_id === user?.id);

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
          Solo {profile?.pet_name || "i tuoi"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#2D4A3E] font-bold animate-pulse">
          Fiutando i post nel database... 🐾
        </div>
      ) : (
        <div
          key={filter}
          className="flex flex-col animate-in fade-in duration-300"
        >
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PetCard
                key={post.id}
                id={post.id}
                user={post.profiles?.username || post.user_name || "Utente"}
                userId={post.user_id}
                petName={post.profiles?.pet_name || post.pet_name}
                avatarUrl={post.profiles?.avatar_url}
                image={post.image || ""}
                caption={post.caption}
                likes={post.likes || 0}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              {filter === "mio"
                ? "Non hai ancora pubblicato nessun ululato. 🐾"
                : "Nessun ululato nel branco per ora. 🐾"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
