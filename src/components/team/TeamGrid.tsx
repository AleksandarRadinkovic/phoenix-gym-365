"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Award, ChevronLeft, ChevronRight, X } from "lucide-react";

type TeamGridProps = {
  dict: any;
  lang: "sr" | "en";
};

type Trainer = {
  id: number;
  name: string;
  role: string;
  images: string[];
  socials: {
    instagram?: string;
  };
  experience: string;
};

export default function TeamGrid({ dict, lang }: TeamGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [trainerName, setTrainerName] = useState("");

  const trainers: Trainer[] = [
    {
      id: 1,
      name: "Dubravko Radić",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/1.png"],
      socials: {
        instagram: "https://www.instagram.com/dubravko_radic/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 2,
      name: "Sara Rončević",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/11.png"],
      socials: {
        instagram: "https://www.instagram.com/sara__roncevic/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 3,
      name: "Biljana Milinković",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/4.png"],
      socials: {
        instagram: "https://www.instagram.com/biljaaa.thecoach/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 4,
      name: "Nemanja Šimurdić",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/8.png"],
      socials: {
        instagram: "https://www.instagram.com/nemanja.s_fitness/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 5,
      name: "Sergej Janjić",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/6.png"],
      socials: {
        instagram: "https://www.instagram.com/janjiccsergej/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 6,
      name: "Milivoj Vrhovca",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/7.png"],
      socials: {
        instagram: "https://www.instagram.com/vrhovac_m99/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 7,
      name: "Ivana Vučković",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/5.png"],
      socials: {
        instagram: "https://www.instagram.com/ivana_ifbb_athlete/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 8,
      name: "Dajana Kovačević",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/8.jpg"],
      socials: {
        instagram: "https://www.instagram.com/dajanak_fit/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 9,
      name: "Matea Kos",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/10.jpg"],
      socials: {
        instagram: "",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 10,
      name: "Ognjen Nunić",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/10.png"],
      socials: {
        instagram: "",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 11,
      name: "Jovan Stojanović",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/9.png"],
      socials: {
        instagram: "https://www.instagram.com/jovan.s99/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
    {
      id: 12,
      name: "Ognjen Savović",
      role: dict.team?.personalTrainer || "Personalni trener",
      images: ["/images/treneri/2.png"],
      socials: {
        instagram: "https://www.instagram.com/universal_human.fit/",
      },
      experience: dict.team?.personalTrainer || "Personalni trener"
    },
  ];

  const openLightbox = (images: string[], index: number, name: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setTrainerName(name);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  return (
    <>
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
              <TrainerCard 
                key={trainer.id} 
                trainer={trainer} 
                index={index} 
                dict={dict}
                onImageClick={openLightbox}
              />
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

    {/* Lightbox Modal */}
    <AnimatePresence>
      {lightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Navigation Arrows */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-white/20 hover:bg-[#ff6b35] text-white p-4 rounded-full transition-all backdrop-blur-sm"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] bg-white/20 hover:bg-[#ff6b35] text-white p-4 rounded-full transition-all backdrop-blur-sm"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image Container - BEZ stopPropagation */}
          <motion.div
            key={lightboxIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full max-w-5xl max-h-[85vh]"
          >
            <Image
              src={lightboxImages[lightboxIndex]}
              alt={`${trainerName} - ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </motion.div>

          {/* Counter */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold border border-white/20">
            {trainerName} - {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>


    </>
  );
}

// Trainer Card Component
function TrainerCard({ 
  trainer, 
  index, 
  dict,
  onImageClick 
}: { 
  trainer: any; 
  index: number; 
  dict: any;
  onImageClick: (images: string[], index: number, name: string) => void;
}) {
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
        <div 
          className="relative h-80 overflow-hidden cursor-pointer"
          onClick={() => onImageClick(trainer.images, currentImageIndex, trainer.name)}
        >
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
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff6b35] text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff6b35] text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {trainer.images.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
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
          <p className="text-[#ff6b35] font-semibold mb-4">
            {trainer.role}
          </p>

          {/* Social Links */}
          {trainer.socials.instagram && (
            <a
              href={trainer.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-white/5 hover:bg-[#E4405F] text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 border border-white/10 hover:border-[#E4405F] w-full justify-center"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
