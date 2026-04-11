"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // 1. Recupero notifiche
        const { data: notifsData, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) {
          console.error("Errore nel recupero notifiche:", error);
          setLoading(false);
          return;
        }

        if (notifsData && notifsData.length > 0) {
          // 2. Recupero manuale dei profili (100% Anti-Crash SQL)
          const senderIds = [...new Set(notifsData.map((n) => n.sender_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, pet_name, avatar_url")
            .in("id", senderIds);

          const profileMap = new Map();
          profilesData?.forEach((p) => profileMap.set(p.id, p));

          const enrichedNotifs = notifsData.map((n) => ({
            ...n,
            sender: profileMap.get(n.sender_id) || null,
          }));

          setNotifications(enrichedNotifs);

          // 3. Segniamo le notifiche come lette nel Database
          const unreadIds = notifsData
            .filter((n) => !n.is_read)
            .map((n) => n.id);
          if (unreadIds.length > 0) {
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .in("id", unreadIds);
          }
        }
      } catch (err) {
        console.error("Eccezione durante il caricamento delle notifiche:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#2D4A3E] font-bold animate-pulse">
        Fiutando gli avvisi... 🐾
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-300">
      <div className="sticky top-0 z-10 bg-[#FDFBF7] pb-4 pt-2 px-4">
        <h1 className="text-2xl font-black text-[#2D4A3E] tracking-tight mb-2">
          Avvisi
        </h1>
        <p className="text-gray-500 text-sm">Le ultime novità per te 🔔</p>
      </div>

      <div className="flex flex-col gap-2 mt-2 px-2 pb-24">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border cursor-pointer active:scale-[0.98] transition-transform ${
                !notif.is_read
                  ? "border-[#E67E70]/30 bg-[#E67E70]/5"
                  : "border-gray-100"
              }`}
              onClick={() =>
                router.push(
                  notif.type === "follow"
                    ? `/profile?id=${notif.sender_id}`
                    : "/",
                )
              }
            >
              <div className="w-14 h-14 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                {notif.sender?.avatar_url ? (
                  <img
                    src={notif.sender.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (notif.sender?.pet_name?.[0] || "P").toUpperCase()
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-[#2D4A3E] text-sm leading-snug">
                  <span className="font-bold mr-1">
                    {notif.sender?.pet_name || "Un pet"}
                  </span>
                  {notif.type === "like"
                    ? "piace il tuo post! 🐺"
                    : notif.type === "comment"
                      ? "ha lasciato una zampata al tuo post! 🐾"
                      : "ha iniziato a seguirti! 🐕"}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                  {new Date(notif.created_at).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            Nessun nuovo avviso. Tutto tranquillo nel branco! 💤
          </div>
        )}
      </div>
    </div>
  );
}
