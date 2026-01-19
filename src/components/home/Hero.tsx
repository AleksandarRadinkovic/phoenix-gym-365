"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    desktop: "/images/hero-1.jpg",
    mobile: "/images/hero-1-mobile.jpg",
    titleKey: "slide1",
    subtitleKey: "slide1"
  },
  {
    desktop: "/images/hero-2.jpg",
    mobile: "/images/hero-2-mobile.jpg",
    titleKey: "slide2",
    subtitleKey: "slide2"
  },
  {
    desktop: "/images/hero-3.jpg",
    mobile: "/images/hero-3-mobile.jpg",
    titleKey: "slide3",
    subtitleKey: "slide3"
  }
];

type HeroCarouselProps = {
  dict: any;
};

export default function HeroCarousel({ dict }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, 5000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / 50);
      });
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Funkcija za scroll do kontakt sekcije
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />

      <div
        className="relative h-full w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="hidden md:block absolute inset-0">
              <Image
                src={slides[currentSlide].desktop}
                alt={dict.hero[slides[currentSlide].titleKey].title}
                fill
                className="object-cover"
                priority
                quality={85}
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>

            <div className="block md:hidden absolute inset-0">
              <Image
                src={slides[currentSlide].mobile}
                alt={dict.hero[slides[currentSlide].titleKey].title}
                fill
                className="object-cover"
                priority
                quality={85}
                sizes="100vw"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 z-10">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl md:text-7xl font-bold mb-4 tracking-tight drop-shadow-2xl"
              >
                {dict.hero[slides[currentSlide].titleKey].title}
              </motion.h1>
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg md:text-2xl mb-8 max-w-2xl drop-shadow-lg"
              >
                {dict.hero[slides[currentSlide].subtitleKey].subtitle}
              </motion.p>
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                onClick={scrollToContact}
                className="bg-[#ff6b35] hover:bg-[#ff8555] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-[#ff6b35]/50"
              >
                {dict.hero.cta}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hidden md:block">
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-[#ff6b35] backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-[#ff6b35] backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Progress Bar umjesto tackica */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-64 md:w-96">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setProgress(0);
              }}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden group hover:bg-white/40 transition-colors"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`h-full bg-[#ff6b35] rounded-full transition-all duration-100 ${
                  index === currentSlide ? 'animate-progress' : ''
                }`}
                style={{
                  width: index === currentSlide ? `${progress}%` : index < currentSlide ? '100%' : '0%'
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
