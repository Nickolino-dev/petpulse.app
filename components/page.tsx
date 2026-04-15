"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import PetCard from "../components/PetCard";
import { ArrowLeft } from "lucide-react";

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postId = params?.id;
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(username, pet_name, avatar_url)")
        .eq("id", postId)
        .single();

      if (error) {
        console.error("Errore fetch singolo post:", error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#2D4A3E] font-bold animate-pulse">
        Fiutando il post... 🐾
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400 text-sm text-center px-4">
        <p className="text-4xl mb-4">😿</p>
        <p>
          Questo ululato sembra essere svanito nel nulla o è stato eliminato.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 bg-[#E67E70] text-white px-6 py-3 rounded-full font-bold active:scale-95 transition-all shadow-md shadow-[#E67E70]/30"
        >
          Torna Indietro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-300 pb-20">
      {/* Header con Pulsante Indietro */}
      <div className="sticky top-0 z-10 bg-[#FDFBF7]/90 backdrop-blur-md pb-4 pt-2 px-2 flex items-center gap-4 border-b border-gray-100 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-[#2D4A3E] hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-[#2D4A3E] tracking-tight">
          Ululato
        </h1>
      </div>

      {/* Contenuto Post */}
      <div className="px-2">
        <PetCard
          id={post.id}
          user={post.profiles?.username || post.user_name || "Utente"}
          userId={post.user_id}
          petName={post.profiles?.pet_name || post.pet_name}
          avatarUrl={post.profiles?.avatar_url}
          imageUrl={post.image || post.image_url || ""}
          caption={post.caption}
          likes={post.likes || 0}
        />
      </div>
    </div>
  );
}
