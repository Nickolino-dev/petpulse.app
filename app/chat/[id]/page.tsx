"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/AuthContext";
import { useRouter } from "next/navigation";

export default function ChatRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();

  // Unwrap dei params per Next.js 15
  const resolvedParams = React.use(params);
  const partnerId = resolvedParams.id;

  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !partnerId) return;

    const fetchChatData = async () => {
      // Carica profilo partner
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, pet_name, avatar_url")
        .eq("id", partnerId)
        .single();
      setPartnerProfile(profileData);

      // Carica messaggi
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
      setTimeout(scrollToBottom, 100);
    };

    fetchChatData();

    // Realtime
    const channel = supabase
      .channel(`chat-${partnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          const isForThisChat =
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id);

          if (isForThisChat) {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(scrollToBottom, 100);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage;
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: content,
    });

    if (error) console.error("Errore:", error);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFBF7] fixed inset-0 z-[9999]">
      {/* Header Fisso */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-[#2D4A3E] text-xl p-1"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full bg-[#E67E70] overflow-hidden flex-shrink-0">
          {partnerProfile?.avatar_url && (
            <img
              src={partnerProfile.avatar_url}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[#2D4A3E] font-black text-sm leading-tight">
            {partnerProfile?.pet_name || "Caricamento..."}
          </span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
            @{partnerProfile?.username || "utente"}
          </span>
        </div>
      </div>

      {/* Area Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? "bg-[#2D4A3E] text-white rounded-br-none"
                    : "bg-white text-[#2D4A3E] border border-gray-100 rounded-bl-none"
                }`}
              >
                {msg.content}
                <div
                  className={`text-[8px] mt-1 opacity-50 ${isMe ? "text-right" : "text-left"}`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra Input */}
      <div className="p-3 bg-white border-t border-gray-100 safe-area-bottom shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi a Noce..."
            className="flex-1 bg-gray-50 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-[#E67E70] text-[#2D4A3E]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#E67E70] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-50"
          >
            🚀
          </button>
        </form>
      </div>
    </div>
  );
}
