"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/AuthContext";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);

      // 1. Recupera tutti i messaggi dell'utente
      const { data: messages, error } = await supabase
        .from("messages")
        .select(
          `
          sender_id,
          receiver_id,
          content,
          created_at,
          sender:profiles!sender_id(id, username, pet_name, avatar_url),
          receiver:profiles!receiver_id(id, username, pet_name, avatar_url)
        `,
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore fetch chat:", error);
      } else if (messages) {
        // 2. Logica per raggruppare i messaggi per conversazione unica
        const chatMap = new Map();

        messages.forEach((msg) => {
          // Capiamo chi è l'altra persona nella conversazione
          const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;

          if (partner && !chatMap.has(partner.id)) {
            chatMap.set(partner.id, {
              partner,
              lastMessage: msg.content,
              time: msg.created_at,
            });
          }
        });

        setChats(Array.from(chatMap.values()));
      }
      setLoading(false);
    };

    fetchChats();
  }, [user]);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">
        Annusando le tracce... 🐾
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header */}
      <div className="h-20 bg-white border-b border-gray-100 flex items-center px-6 shadow-sm shrink-0">
        <h1 className="text-[#2D4A3E] font-black text-2xl tracking-tight">
          Messaggi
        </h1>
      </div>

      {/* Lista Chat */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 px-10 text-center">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-[#2D4A3E] font-bold">Ancora nessuna chat.</p>
            <p className="text-gray-400 text-sm mt-2">
              Corri nel profilo di un amico e clicca su "Messaggio" per
              iniziare!
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.partner.id}
              onClick={() => router.push(`/chat/${chat.partner.id}`)}
              className="flex items-center gap-4 p-4 border-b border-gray-50 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[#E67E70] overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                {chat.partner.avatar_url ? (
                  <img
                    src={chat.partner.avatar_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                    {chat.partner.pet_name?.[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[#2D4A3E] font-bold truncate">
                    {chat.partner.pet_name}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(chat.time).toLocaleDateString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-gray-400 text-xs truncate pr-4 italic">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
