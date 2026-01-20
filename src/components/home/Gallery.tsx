"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

type GalleryProps = {
  dict: any;
};

const generateGalleryImages = () => {
  const images = [];
  
  for (let i = 1; i <= 12; i++) {
    const ext = i === 12 ? 'jpeg' : 'jpg';
    images.push({
      src: `/images/galerija1/${i}.${ext}`,
      alt: `Teretana ${i}`,
      category: "teretana"
    });
  }
  
  for (let i = 1; i <= 10; i++) {
    images.push({
      src: `/images/galerija2/${i}.jpeg`,
      alt: `Sprave ${i}`,
      category: "sprave"
    });
  }
  
  const trenerImages = [
    '/images/treneri/1.png',
    '/images/treneri/2.png',
    '/images/treneri/3.png',
    '/images/treneri/4.png',
    '/images/treneri/5.png',
    '/images/treneri/6.png',
    '/images/treneri/7.png',
    '/images/treneri/8.jpg',
    '/images/treneri/8.png',
    '/images/treneri/9.png',
    '/images/treneri/10.jpg',
    '/images/treneri/10.png',
    '/images/treneri/11.png',
  ];

  trenerImages.forEach((path, i) => {
    images.push({
      src: path,
      alt: `Trener ${i + 1}`,
      category: "treneri"
    });
  });

  return images;
};


const galleryImages = generateGalleryImages();

export default function Gallery({ dict }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);

  const categories = [
    { id: "all", label: dict.gallery?.all || "Sve" },
    { id: "teretana", label: dict.gallery?.teretana || "Teretana" },
    { id: "sprave", label: dict.gallery?.sprave || "Sprave" },
    { id: "treneri", label: dict.gallery?.treneri || "Treneri" },
  ];

  const filteredImages = filter === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === filter);

  const displayedImages = showAll ? filteredImages : filteredImages.slice(0, 16);
  const hasMore = filteredImages.length > 16;

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

  // Resetuj showAll kad se promeni filter
  const handleFilterChange = (categoryId: string) => {
    setFilter(categoryId);
    setShowAll(false);
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
              {dict.gallery?.badge || "Galerija"}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {dict.gallery?.title || "Naš Prostor"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.gallery?.subtitle || "Pogledajte našu modernu teretanu"}
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleFilterChange(category.id)}
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
            {displayedImages.map((image, index) => (
              <motion.div
                key={image.src}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl bg-gray-800"
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

        {/* Show More Button */}
        {hasMore && !showAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <button
              onClick={() => setShowAll(true)}
              className="group px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2"
            >
              {dict.gallery?.showMore || "Prikaži Sve"} ({filteredImages.length - 16})
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Show Less Button */}
        {showAll && hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <button
              onClick={() => {
                setShowAll(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-2"
            >
              {dict.gallery?.showLess || "Prikaži Manje"}
              <ChevronDown className="w-5 h-5 rotate-180 group-hover:-translate-y-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>

  {/* Lightbox */}
  <AnimatePresence>
    {selectedImage !== null && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
        onClick={closeLightbox}
      >
        {/* Close button - VEĆI I VIDLJIVIJI */}
        <button
          onClick={closeLightbox}
          className="fixed top-4 right-4 z-[60] bg-[#ff6b35] hover:bg-red-600 text-white p-4 rounded-full transition-all shadow-2xl"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Navigation buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-white/20 hover:bg-[#ff6b35] backdrop-blur-sm text-white p-4 rounded-full transition-all"
          aria-label="Previous"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] bg-white/20 hover:bg-[#ff6b35] backdrop-blur-sm text-white p-4 rounded-full transition-all"
          aria-label="Next"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Image - UKLONI stopPropagation */}
        <motion.div
          key={selectedImage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full max-w-6xl max-h-[85vh]"
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-lg font-semibold border border-white/20">
          {selectedImage + 1} / {filteredImages.length}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

    </section>
  );
}
