"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

type TestimonialsProps = {
  dict: any;
};

export default function Testimonials({ dict }: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Boba",
      role: dict.testimonials.member || "Član",
      image: "/images/testimonials/2.jpg",
      rating: 5,
      text: dict.testimonials.boba || "Posjeduju svu potrebnu opremu, a činjenica da nikad ne zatvara je pun pogodak."
    },
    {
      name: "Sergej Janjić",
      role: dict.testimonials.trainer || "Trener",
      image: "/images/testimonials/1.jpg",
      rating: 5,
      text: dict.testimonials.sergej || "Sprave su nove i kvalitetne, atmosfera je motivirajuća, a treneri su uvijek spremni za profesionalan savjet."
    },
    {
      name: "Dubravko Radić",
      role: dict.testimonials.trainer || "Trener",
      image: "/images/testimonials/3.jpg",
      rating: 5,
      text: dict.testimonials.dubravko || "Apsolutno najbolja teretana u Banjoj Luci jer radi 24/7/365, što je savršeno za moj raspored."
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
            <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
              {dict.testimonials.badge || "Recenzije"}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {dict.testimonials.title || "Šta Kažu Naši Članovi"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.testimonials.subtitle || "Prave priče, pravi rezultati"}
          </p>
        </motion.div>

        {/* Testimonials Slider */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 lg:p-12"
              >
                {/* Quote Icon */}
                <div className="flex justify-center mb-8">
                  <div className="p-4 rounded-full bg-[#ff6b35]/10">
                    <Quote className="w-12 h-12 text-[#ff6b35]" />
                  </div>
                </div>

                {/* Testimonial Text */}
                <p className="text-white text-lg lg:text-xl text-center leading-relaxed mb-8 italic">
                  "{testimonials[currentIndex].text}"
                </p>

                {/* Rating Stars */}
                <div className="flex justify-center gap-1 mb-8">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-[#ff6b35] text-[#ff6b35]" />
                  ))}
                </div>

                {/* Author Info */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#ff6b35]/30">
                    <Image
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <h4 className="text-white text-xl font-bold mb-1">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-[#ff6b35] font-medium">
                    {testimonials[currentIndex].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 bg-white/10 hover:bg-[#ff6b35] backdrop-blur-sm p-3 rounded-full transition-all duration-300 group border border-white/20"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 bg-white/10 hover:bg-[#ff6b35] backdrop-blur-sm p-3 rounded-full transition-all duration-300 group border border-white/20"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-[#ff6b35] w-8"
                    : "bg-white/30 hover:bg-white/50 w-3"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* All Testimonials Grid (mobile friendly alternative view) */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 lg:hidden">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff6b35]/30">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <h4 className="text-white font-bold">{testimonial.name}</h4>
                  <p className="text-[#ff6b35] text-sm">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#ff6b35] text-[#ff6b35]" />
                ))}
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
