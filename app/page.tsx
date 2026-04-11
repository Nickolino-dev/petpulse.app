"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PetCard from "../components/PetCard";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tutti" | "mio">("tutti");
  const { user, profile } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("pet_name", `%${query}%`)
      .limit(20);

    if (error) {
      console.error("Errore durante la ricerca:", error.message || error);
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
    setIsSearching(false);
  };

  // Applichiamo il filtro dinamicamente ai post
  const filteredPosts =
    filter === "tutti"
      ? posts || []
      : posts?.filter((post) => post?.user_id === user?.id) || [];

  return (
    <div className="flex flex-col w-full">
      {/* Barra di Ricerca Fissa in Cima */}
      <div className="sticky top-0 z-10 bg-[#FDFBF7] pb-4 pt-2">
        <div className="relative px-2">
          <span className="absolute inset-y-0 left-5 flex items-center text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cerca il nome di un pet..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70] shadow-sm transition-all"
          />
        </div>
      </div>

      {searchQuery.trim() !== "" ? (
        /* Risultati della Ricerca */
        <div className="flex flex-col gap-2 mt-2 px-2 pb-20">
          {isSearching && searchResults.length === 0 ? (
            <div className="text-center py-10 text-[#2D4A3E] font-bold animate-pulse">
              Fiutando le tracce... 🐾
            </div>
          ) : searchResults?.length > 0 ? (
            searchResults.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(
                    p.id === user?.id ? `/profile` : `/profile?id=${p.id}`,
                  )
                }
                className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                  {p?.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.username || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (p?.pet_name?.[0] || "P").toUpperCase()
                  )}
                </div>
                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="text-[#2D4A3E] font-black text-base truncate">
                    {p?.pet_name || "Pet Sconosciuto"}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    di {p?.username || "Utente"}
                  </p>
                  {p?.bio && (
                    <p className="text-[#2D4A3E]/70 text-xs mt-1 truncate">
                      {p.bio}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nessun pet trovato con questo nome. 😿
            </div>
          )}
        </div>
      ) : (
        /* Feed Originale */
        <>
          {/* Selettore Filtri (Tabs Stile Instagram) */}
          <div className="flex justify-center gap-8 border-b border-gray-100 mt-6 mb-4 px-2">
            <button
              onClick={() => setFilter("tutti")}
              className={`pb-3 text-sm font-bold transition-colors relative ${
                filter === "tutti"
                  ? "text-[#2D4A3E]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Esplora
              {filter === "tutti" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E67E70] rounded-t-md"></div>
              )}
            </button>
            <button
              onClick={() => setFilter("mio")}
              className={`pb-3 text-sm font-bold transition-colors relative ${
                filter === "mio"
                  ? "text-[#2D4A3E]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Seguiti
              {filter === "mio" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E67E70] rounded-t-md"></div>
              )}
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
              {filteredPosts?.length > 0 ? (
                filteredPosts?.map((post) => (
                  <PetCard
                    key={post.id}
                    id={post.id}
                    user={post.profiles?.username || post.user_name || "Utente"}
                    userId={post.user_id}
                    petName={post.profiles?.pet_name || post.pet_name}
                    avatarUrl={post.profiles?.avatar_url}
                    imageUrl={post?.image || ""}
                    caption={post.caption}
                    likes={post.likes || 0}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm font-medium">
                  {filter === "mio"
                    ? "Nessun ululato dai tuoi amici per ora. 🐾"
                    : "Nessun ululato nel branco per ora. 🐾"}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
