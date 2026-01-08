"use client";

import { useLanguage } from "./LanguageContext";
import { cn } from "@/lib/utils/cn";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10 transition-all duration-300">
      <button
        onClick={() => setLocale("es")}
        className={cn(
          "px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300",
          locale === "es" 
            ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
            : "text-white/40 hover:text-white/70"
        )}
      >
        ES
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300",
          locale === "en" 
            ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
            : "text-white/40 hover:text-white/70"
        )}
      >
        EN
      </button>
    </div>
  );
}
