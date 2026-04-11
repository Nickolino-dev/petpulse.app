"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log(
        "Debug Auth:",
        user ? `Utente loggato: ${user.id}` : "Utente nullo",
      );

      if (!user) return;

      // 1. Prendiamo le notifiche CON la Join diretta tramite Foreign Key
      console.log("Debug DB: Avvio fetch notifiche...");
      const { data: notifs, error: notifError } = await supabase
        .from("notifications")
        .select(
          "*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notifError) {
        console.error("Debug DB (Errore):", notifError.message);
        setLoading(false);
        return;
      }

      console.log("Debug DB: Notifiche recuperate con successo!", notifs);
      setNotifications(notifs || []);
      setLoading(false);

      // 2. Segna come lette
      const unreadIds =
        notifs?.filter((n) => !n.is_read).map((n) => n.id) || [];
      if (unreadIds.length === 0) return;

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
    };

    getData();
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-24">
      <Header title="Notifiche" />

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D4A3E]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 opacity-40">
            <span className="text-5xl mb-3">🐾</span>
            <p className="text-center font-medium">Ancora nessuna zampata!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="relative">
                  <img
                    src={
                      n.actor?.avatar_url || "https://via.placeholder.com/150"
                    }
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2D4A3E]/10"
                    alt="avatar"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                    {n.type === "like" ? "❤️" : "💬"}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-[#2D4A3E]">
                      {n.actor?.username || "Qualcuno"}
                    </span>
                    {n.type === "like"
                      ? " ha apprezzato il tuo post"
                      : " ha risposto al tuo post"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />
    </main>
  );
}
