"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryProps = {
  dict: any;
};

// Dodaj svoje slike ovde
const galleryImages = [
  { src: "/images/gallery/gym-1.jpg", alt: "Gym interior 1", category: "gym" },
  { src: "/images/gallery/gym-2.jpg", alt: "Gym interior 2", category: "gym" },
  { src: "/images/gallery/cardio-1.jpg", alt: "Cardio zone", category: "cardio" },
  { src: "/images/gallery/equipment-1.jpg", alt: "Equipment", category: "equipment" },
  { src: "/images/gallery/training-1.jpg", alt: "Training session", category: "training" },
  { src: "/images/gallery/gym-3.jpg", alt: "Gym interior 3", category: "gym" },
  { src: "/images/gallery/equipment-2.jpg", alt: "Equipment 2", category: "equipment" },
  { src: "/images/gallery/training-2.jpg", alt: "Training session 2", category: "training" },
];

export default function Gallery({ dict }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: dict.gallery.all || "Sve" },
    { id: "gym", label: dict.gallery.gym || "Teretana" },
    { id: "cardio", label: dict.gallery.cardio || "Cardio" },
    { id: "equipment", label: dict.gallery.equipment || "Oprema" },
    { id: "training", label: dict.gallery.training || "Treninzi" },
  ];

  const filteredImages = filter === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === filter);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % filteredImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
            <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
              {dict.gallery.badge || "Galerija"}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {dict.gallery.title || "Naš Prostor"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.gallery.subtitle || "Pogledajte našu modernu teretanu"}
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter === category.id
                  ? "bg-gradient-to-r from-[#ff6b35] to-red-600 text-white shadow-lg shadow-[#ff6b35]/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.src}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Hover text */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-semibold text-sm">{image.alt}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-50 text-white p-3 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={32} />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 z-50 text-white p-3 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 z-50 text-white p-3 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={32} />
            </button>

            {/* Image */}
            <motion.div
              key={selectedImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-[90vw] h-[90vh] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filteredImages[selectedImage].src}
                alt={filteredImages[selectedImage].alt}
                fill
                className="object-contain"
                sizes="90vw"
                quality={95}
              />
            </motion.div>

            {/* Image counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold">
              {selectedImage + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
