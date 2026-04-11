"use client";
import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function AddPost() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Il file è troppo grande! Dimensione massima consentita: 5MB.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    setIsUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Devi effettuare l'accesso per pubblicare un post.");
      setIsUploading(false);
      return;
    }

    // 0. Controllo Profilo: Verifichiamo se il profilo esiste
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // Se non esiste, proviamo a crearlo al volo con i dati di base dell'auth
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: user?.email?.split("@")?.[0] || "Utente",
        })
        .select()
        .single();

      if (profileError) {
        alert(
          "Devi completare il tuo profilo prima di postare! Vai nelle Impostazioni.",
        );
        setIsUploading(false);
        return;
      }
      profile = newProfile;
    }

    let imageUrl = null;

    // 1. Logica di Upload Immagine (se selezionata)
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("posts_images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Errore durante l'upload dell'immagine:", uploadError);
        alert(
          "Impossibile caricare l'immagine. Potrebbe essere troppo grande o il formato non è supportato.",
        );
        setIsUploading(false);
        return;
      }

      // 2. Recupero l'URL Pubblico
      const { data } = supabase.storage
        .from("posts_images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    // 3. Creazione del Post nel Database
    const { error } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        pet_name: profile?.pet_name || "Il mio Pet",
        caption: content,
        emoji: "🐾",
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    ]);

    setIsUploading(false);

    if (error) {
      console.error("Errore esatto del database:", error);
      if (error.code === "23503") {
        alert(
          "Devi completare il tuo profilo prima di postare! Vai nelle Impostazioni.",
        );
      } else {
        alert(`Errore durante la pubblicazione del post: ${error.message}`);
      }
    } else {
      closeModal();
      // Grazie a Supabase Realtime, il feed si aggiornerà da solo!
    }
  };

  // Pulizia generale quando si chiude la modale
  const closeModal = () => {
    if (isUploading) return;
    setIsOpen(false);
    setContent("");
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
      {/* Il tastone nella Navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#E67E70] text-white p-3 rounded-full -mt-10 shadow-lg active:scale-90 transition-all z-50 border-4 border-[#FDFBF7]"
      >
        <span className="text-xl">➕</span>
      </button>

      {/* La Modale */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Sfondo oscurato (Overlay) - cliccando qui si chiude */}
          <div
            className="absolute inset-0 bg-[#2D4A3E]/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Box della Modale */}
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col gap-3">
            {/* Header Modale */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <h2 className="text-[#2D4A3E] font-black text-lg">
                Nuovo Ululato
              </h2>
              <div className="w-14"></div>{" "}
              {/* Spaziatore per centrare il titolo */}
            </div>

            <textarea
              className="w-full h-32 bg-transparent border-none p-2 text-lg text-[#2D4A3E] placeholder:text-gray-300 focus:ring-0 focus:outline-none resize-none disabled:opacity-50"
              placeholder="Cosa sta combinando il tuo amico oggi?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isUploading}
            ></textarea>

            {/* Anteprima Immagine */}
            {previewUrl && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <img
                  src={previewUrl}
                  alt="Anteprima"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 active:scale-90 transition-all"
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {/* Action Bar (Icone e Tasto Pubblica) */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-gray-400 text-xl px-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="hover:text-[#E67E70] transition-colors active:scale-95 disabled:opacity-50"
                  title="Aggiungi Foto"
                >
                  📷
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  className="hover:text-[#E67E70] transition-colors active:scale-95 disabled:opacity-50"
                  title="Aggiungi Luogo"
                >
                  📍
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  className="hover:text-[#E67E70] transition-colors active:scale-95 disabled:opacity-50"
                  title="Aggiungi Emoji"
                >
                  😊
                </button>
              </div>

              <button
                className="bg-[#E67E70] hover:bg-[#d66e60] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-[#E67E70]/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                onClick={handleSubmit}
                disabled={isUploading || (!content.trim() && !file)}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Invio...
                  </span>
                ) : (
                  "Pubblica"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
