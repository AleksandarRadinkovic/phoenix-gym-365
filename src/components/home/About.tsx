"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

type AboutProps = {
  dict: any;
  lang: string;
};

export default function About({ dict, lang }: AboutProps) {
  const features = [
    dict.about?.feature1 || "24/7 pristup teretani",
    dict.about?.feature2 || "Besplatno vođenje treninga",
    dict.about?.feature3 || "Moderna oprema",
    dict.about?.feature4 || "Profesionalni treneri"
  ];

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff6b35]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Main image */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/about-main.jpg"
                alt="Phoenix Gym Interior"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="absolute -bottom-8 -right-8 bg-gradient-to-br from-[#ff6b35] to-red-600 rounded-2xl p-6 shadow-2xl"
            >
              <div className="text-white">
                <div className="text-4xl font-bold mb-1">10+</div>
                <div className="text-sm opacity-90">Godina iskustva</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
                <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
                  {dict.about?.badge || "O nama"}
                </span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {dict.about?.title || "Dobrodošli u Phoenix Gym 365"}
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {dict.about?.description || 
                  "Phoenix Gym 365 je moderna teretana sa više od 10 godina iskustva. Naš cilj je da vam pružimo najbolje uslove za trening i pomoć profesionalnih trenera kako biste postigli svoje fitnes ciljeve."}
              </p>

              {/* Features list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff6b35]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#ff6b35]" />
                    </div>
                    <span className="text-white font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href={`/${lang}/nas-tim`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-[#ff6b35]/50 group"
              >
                {dict.about?.cta || "Upoznaj naš tim"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
