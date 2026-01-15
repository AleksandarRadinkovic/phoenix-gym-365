"use client";
import { motion } from "framer-motion";
import Image from "next/image";

type ContactHeroProps = {
  dict: any;
};

export default function ContactHero({ dict }: ContactHeroProps) {
  return (
    <section className="relative h-[50vh] lg:h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-3.jpg"
          alt="Contact Phoenix Gym"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
            <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
              {dict.contact?.badge || "Kontakt"}
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
            {dict.contact?.heroTitle || "Kontaktirajte Nas"}
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {dict.contact?.heroSubtitle || "Tu smo da odgovorimo na sva vaša pitanja. Pošaljite nam poruku ili nas posjetite!"}
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </section>
  );
}
