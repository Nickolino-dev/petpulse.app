"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { usePet } from "../app/PetContext";
import { useAuth } from "../app/AuthContext";
import Link from "next/link";

interface PetCardProps {
  id: string | number;
  user: string;
  userId?: string;
  petName: string;
  image: string;
  caption: string;
  likes: number;
  avatarUrl?: string;
}

export default function PetCard({
  id,
  user,
  userId,
  petName,
  image,
  caption,
  likes,
  avatarUrl,
}: PetCardProps) {
  const [likesCount, setLikesCount] = useState(likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [expandedComments, setExpandedComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const { activePet } = usePet();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuth();

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    const newLikesCount = isLiked
      ? Math.max(0, likesCount - 1)
      : likesCount + 1;

    // 1. Optimistic Update (aggiorna subito la UI)
    setLikesCount(newLikesCount);
    setIsLiked(newIsLiked);

    // 2. Aggiorna il database
    const { error } = await supabase
      .from("posts")
      .update({ likes: newLikesCount })
      .eq("id", id);

    if (error) {
      console.error("Errore nell'invio dell'ululato:", error);
      // Se fallisce, annulliamo l'ottimismo
      setLikesCount(likesCount);
      setIsLiked(isLiked);
    }
  };

  // Sincronizza il contatore dei like se viene aggiornato dal Realtime (dal Feed genitore)
  useEffect(() => {
    setLikesCount(likes || 0);
  }, [likes]);

  // Scarica i commenti automaticamente al caricamento della card e ascolta i nuovi in Realtime
  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-channel-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          // Filtro lato client per assicurarci che il commento sia per questo specifico post
          if (payload.new.post_id === id) {
            setComments((prev) => [...prev, payload.new]);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          // Rimuove il commento se cancellato da qualcun altro
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (!error && data) setComments(data);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser) return;

    const { error } = await supabase
      .from("comments")
      .insert([{ post_id: id, user_id: currentUser.id, text: newComment }]);

    if (!error) {
      setNewComment("");
      // Rimosso fetchComments() perché ci penserà il Realtime ad aggiungerlo istantaneamente alla lista!
    } else {
      console.error("Errore nell'invio del commento:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo ululato?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      console.error("Errore nell'eliminazione del post:", error);
    }
  };

  const visibleComments = expandedComments
    ? comments
    : comments.length > 3
      ? comments.slice(-2)
      : comments;

  return (
    <div className="bg-white active:scale-[0.98] transition-all duration-200 cursor-pointer rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
      {/* Header del post */}
      <div className="p-4 flex items-center justify-between gap-3">
        <Link
          href={userId === currentUser?.id ? `/profile` : "#"}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user}
                className="w-full h-full object-cover"
              />
            ) : (
              user[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <p className="text-[#2D4A3E] font-bold text-sm leading-none group-hover:underline">
              {petName}
            </p>
            <p className="text-gray-400 text-[10px]">Postato da {user}</p>
          </div>
        </Link>
        {currentUser?.id === userId && (
          <button
            onClick={handleDelete}
            className="text-red-400 text-xs font-bold hover:underline active:scale-95 transition-transform p-2"
          >
            Elimina
          </button>
        )}
      </div>

      {/* Corpo del Post (Immagine opzionale + Testo) */}
      <div className="px-4 pb-4">
        {image && image.trim() !== "" && (
          <img
            src={image}
            alt={`Post di ${petName}`}
            className="w-full max-h-[400px] object-contain bg-gray-100 rounded-2xl mb-4"
          />
        )}

        {/* Il testo si ingrandisce se l'immagine non è presente */}
        <p
          className={`text-[#2D4A3E] mb-4 ${image && image.trim() !== "" ? "text-sm" : "text-base leading-relaxed"}`}
        >
          <span className="font-bold mr-2">{petName}</span>
          {caption}
        </p>

        {/* Sezione Commenti (ora sopra i pulsanti) */}
        <div className="mt-2">
          {/* Lista dei Commenti */}
          {loadingComments ? (
            <p className="text-xs text-gray-400 mb-4 animate-pulse">
              Caricamento zampate...
            </p>
          ) : comments.length > 0 ? (
            <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto pr-1">
              {comments.length > 3 && !expandedComments && (
                <button
                  onClick={() => setExpandedComments(true)}
                  className="text-xs text-gray-400 font-medium text-left mb-1 hover:underline active:scale-95 transition-transform"
                >
                  Vedi tutti e {comments.length} i commenti
                </button>
              )}
              {visibleComments.map((c) => (
                <div
                  key={c.id}
                  className="bg-gray-50 p-3 rounded-2xl text-xs text-[#2D4A3E]"
                >
                  <span className="font-bold mr-2 text-[#E67E70]">
                    {c.pet_name}
                  </span>
                  {c.text}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">
              Nessuna zampata ancora. Sii il primo!
            </p>
          )}

          {/* Input per Nuovo Commento */}
          <div className="flex gap-2 items-center mb-4">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Aggiungi una zampata..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 text-xs text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-[#E67E70] text-white px-4 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
            >
              Invia
            </button>
          </div>
        </div>

        {/* Pulsanti Azione (Footer) */}
        <div className="flex justify-between border-t border-gray-50 pt-4 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-all duration-300 ${
              isLiked
                ? "text-[#E67E70] font-black scale-110"
                : "text-[#2D4A3E] font-semibold active:scale-95"
            }`}
          >
            <span className={isLiked ? "animate-bounce" : ""}>🐺</span>
            {likesCount > 0 ? likesCount : ""} Ululato
          </button>
          <button
            onClick={() => commentInputRef.current?.focus()}
            className="flex items-center gap-1 text-[#2D4A3E] text-xs font-semibold active:scale-95 transition-all"
          >
            <span>🐾</span> Zampata
          </button>
          <button className="flex items-center gap-1 text-[#2D4A3E] text-xs font-semibold">
            <span>📢</span> Condividi
          </button>
        </div>
      </div>
    </div>
  );
}
