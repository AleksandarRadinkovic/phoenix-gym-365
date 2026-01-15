"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";  // 
import { Instagram, Facebook, Twitter, Mail, Award, ChevronLeft, ChevronRight } from "lucide-react";

type TeamGridProps = {
  dict: any;
  lang: "sr" | "en";  
};

type Trainer = {
  id: number;
  name: string;
  role: string;
  specialty: string;
  images: string[];
  socials: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  email?: string;
  experience: string;
};

export default function TeamGrid({ dict, lang }: TeamGridProps) {  // ← DODAJ lang
  const trainers: Trainer[] = [
    {
      id: 1,
      name: "Marko marko",
      role: dict.team?.headTrainer || "Glavni trener",
      specialty: "Bodybuilding & Strength",
      images: [
        "/images/treneri/marko-1.jpg",
        "/images/treneri/marko-2.jpg",
        "/images/treneri/marko-3.jpg",
      ],
      socials: {
        instagram: "https://instagram.com/marko_petrovic",
      },
      email: "marko@phoenixgym365.com",
      experience: "12+ godina"
    },
    {
      id: 2,
      name: "Ana Jovanović",
      role: dict.team?.personalTrainer || "Personalni trener",
      specialty: "Functional Training & CrossFit",
      images: [
        "/images/treneri/ana-1.jpg",
        "/images/treneri/ana-2.jpg",
      ],
      socials: {
        instagram: "https://instagram.com/ana_jovanovic",
      },
      email: "ana@phoenixgym365.com",
      experience: "8+ godina"
    },

  ];

  return (
    <section className="py-20 lg:py-32 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {dict.team?.meetTeam || "Upoznajte Naš Profesionalni Tim"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.team?.description || "Svaki član našeg tima je sertifikovan profesionalac sa strašću prema fitnesu"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trainers.map((trainer, index) => (
            <TrainerCard key={trainer.id} trainer={trainer} index={index} dict={dict} />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20 text-center bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-12"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            {dict.team?.readyToStart || "Spremni za početak?"}
          </h3>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            {dict.team?.ctaText || "Zakažite besplatnu konsultaciju sa našim trenerima i započnite svoju transformaciju danas"}
          </p>
          <Link
            href={`/${lang}/kontakt`}  
            className="inline-block bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl"
          >
            {dict.team?.ctaButton || "Kontaktirajte Nas"}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Trainer Card Component sa slajderom
function TrainerCard({ trainer, index, dict }: { trainer: any; index: number; dict: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = trainer.images.length - 1;
      if (next >= trainer.images.length) next = 0;
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff6b35]/50 transition-all duration-300">
        {/* Image Slider */}
        <div className="relative h-80 overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentImageIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0"
            >
              <Image
                src={trainer.images[currentImageIndex]}
                alt={`${trainer.name} - ${currentImageIndex + 1}`}
                fill
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Navigation Arrows */}
          {trainer.images.length > 1 && (
            <>
              <button
                onClick={() => paginate(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff6b35] text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => paginate(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff6b35] text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {trainer.images.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentImageIndex ? 1 : -1);
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex
                        ? "bg-[#ff6b35] w-6"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Experience Badge */}
          <div className="absolute top-4 right-4 bg-[#ff6b35] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 z-10">
            <Award className="w-4 h-4" />
            {trainer.experience}
          </div>
        </div>

        {/* Info */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-1">
            {trainer.name}
          </h3>
          <p className="text-[#ff6b35] font-semibold mb-2">
            {trainer.role}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {trainer.specialty}
          </p>

          {/* Social Links */}
          <div className="flex flex-wrap gap-2 mb-4">
            {trainer.socials.instagram && (
              <a
                href={trainer.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white/5 hover:bg-[#E4405F] text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 border border-white/10 hover:border-[#E4405F]"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            )}
            {trainer.socials.facebook && (
              <a
                href={trainer.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white/5 hover:bg-[#1877F2] text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 border border-white/10 hover:border-[#1877F2]"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
            )}
            {trainer.socials.twitter && (
              <a
                href={trainer.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white/5 hover:bg-[#1DA1F2] text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 border border-white/10 hover:border-[#1DA1F2]"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </a>
            )}
          </div>

          {/* Email */}
          {trainer.email && (
            <a
              href={`mailto:${trainer.email}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff6b35] transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              {dict.team?.contact || "Kontakt"}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
