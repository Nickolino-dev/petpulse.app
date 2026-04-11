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
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Errore durante l'upload dell'immagine:", uploadError);
        alert("Impossibile caricare l'immagine.");
        setIsUploading(false);
        return;
      }

      // 2. Recupero l'URL Pubblico
      const { data } = supabase.storage
        .from("pet-photos")
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
        ...(imageUrl ? { image: imageUrl } : {}), // Aggiunge image solo se esiste
      },
    ]);

    setIsUploading(false);

    if (error) {
      console.error("Errore durante la pubblicazione:", error);
      if (error.code === "23503") {
        alert(
          "Devi completare il tuo profilo prima di postare! Vai nelle Impostazioni.",
        );
      } else {
        alert("Errore durante la pubblicazione del post.");
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
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-[#FDFBF7] p-4 rounded-full mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h2 className="text-[#2D4A3E] font-black text-xl">
                Nuovo Ululato
              </h2>
              <p className="text-gray-400 text-xs">
                Condividi un momento speciale
              </p>
            </div>

            <textarea
              className="w-full h-32 bg-[#FDFBF7] border-none rounded-2xl p-4 text-sm text-[#2D4A3E] placeholder:text-gray-300 focus:ring-2 focus:ring-[#E67E70] resize-none disabled:opacity-50"
              placeholder="Cosa sta combinando il tuo amico oggi?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isUploading}
            ></textarea>

            {/* Anteprima Immagine */}
            {previewUrl && (
              <div className="relative mt-3 w-full h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
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
                  className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center active:scale-90 transition-transform"
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Pulsante Fotocamera e Input Nascosto */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-2xl hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
              >
                📷
              </button>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Aggiungi Foto
              </span>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="flex-1 py-3 text-[#2D4A3E] font-bold text-sm hover:bg-gray-50 rounded-2xl transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                className="flex-1 bg-[#2D4A3E] text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-[#2D4A3E]/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                onClick={handleSubmit}
                disabled={isUploading || (!content.trim() && !file)}
              >
                {isUploading ? "Invio..." : "Pubblica"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
