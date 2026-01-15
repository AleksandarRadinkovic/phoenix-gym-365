"use client";
import { motion } from "framer-motion";

type ContactMapProps = {
  dict: any;
};

export default function ContactMap({ dict }: ContactMapProps) {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {dict.contact?.mapTitle || "Naša Lokacija"}
          </h2>
          <p className="text-gray-400 text-lg">
            {dict.contact?.mapSubtitle || "Posjetite nas na adresi"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.9567890123456!2d17.1907!3d44.7722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475e035d7b5e5f65%3A0x123456789!2sTrg%20srpskih%20junaka%201%2C%20Banja%20Luka%2078000!5e0!3m2!1sen!2sba!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale hover:grayscale-0 transition-all duration-500"
          />
        </motion.div>
      </div>
    </section>
  );
}
