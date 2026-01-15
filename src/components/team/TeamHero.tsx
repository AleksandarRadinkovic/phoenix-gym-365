"use client";
import { motion } from "framer-motion";
import Image from "next/image";

type TeamHeroProps = {
  dict: any;
};

export default function TeamHero({ dict }: TeamHeroProps) {
  return (
    <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-2.jpg"
          alt="Phoenix Gym Team"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
            <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
              {dict.team?.badge || "Naš Tim"}
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
            {dict.team?.title || "Upoznajte Naš Tim"}
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {dict.team?.subtitle || "Profesionalni treneri sa više od 10 godina iskustva, spremni da vam pomognu da postignete svoje fitnes ciljeve"}
          </p>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </section>
  );
}
