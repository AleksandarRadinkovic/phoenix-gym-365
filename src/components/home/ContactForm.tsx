"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from "lucide-react";


type ContactFormProps = {
  dict: any;
};


export default function ContactForm({ dict }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = dict.contact?.errors?.name || "Ime je obavezno";
    }

    if (!formData.email.trim()) {
      newErrors.email = dict.contact?.errors?.email || "Email je obavezan";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = dict.contact?.errors?.emailInvalid || "Email nije validan";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = dict.contact?.errors?.phone || "Telefon je obavezan";
    }

    if (!formData.message.trim()) {
      newErrors.message = dict.contact?.errors?.message || "Poruka je obavezna";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: dict.contact?.phone || "Telefon",
      value: "+387 65 123 456",
      href: "tel:+38765123456"
    },
    {
      icon: Mail,
      label: dict.contact?.email || "Email",
      value: "info@phoenixgym365.com",
      href: "mailto:info@phoenixgym365.com"
    },
    {
      icon: MapPin,
      label: dict.contact?.address || "Adresa",
      value: "Trg srpskih junaka 1, Banja Luka 78000",
      href: "https://maps.google.com/?q=Trg+srpskih+junaka+1+Banja+Luka"
    }
  ];

  return (
    <section id="contact" className="relative py-20 lg:py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 opacity-5" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
          suppressHydrationWarning
        >
          <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
            <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
              {dict.contact?.badge || "Kontakt"}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {dict.contact?.title || "Kontaktirajte Nas"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.contact?.subtitle || "Imate pitanja? Pošaljite nam poruku i javićemo vam se uskoro"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left - Contact Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              suppressHydrationWarning
            >
              <h3 className="text-3xl font-bold text-white mb-4">
                {dict.contact?.getInTouch || "Stupite u kontakt"}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                {dict.contact?.description || "Naš tim je tu da odgovori na sva vaša pitanja o članarinama, treninzima i uslugama koje nudimo."}
              </p>
            </motion.div>

            {/* Contact Info Cards */}
            <div className="space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.a
                    key={index}
                    href={info.href}
                    target={info.icon === MapPin ? "_blank" : undefined}
                    rel={info.icon === MapPin ? "noopener noreferrer" : undefined}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-4 p-5 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl hover:border-[#ff6b35]/50 transition-all duration-300 group"
                    suppressHydrationWarning
                  >
                    <div className="flex-shrink-0 p-3 rounded-lg bg-[#ff6b35]/10 group-hover:bg-[#ff6b35]/20 transition-colors">
                      <Icon className="w-6 h-6 text-[#ff6b35]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{info.label}</p>
                      <p className="text-white font-semibold">{info.value}</p>
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Google Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="relative h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              suppressHydrationWarning
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

          {/* Right - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 lg:p-10"
            suppressHydrationWarning
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-white font-medium mb-2">
                  {dict.contact?.nameLabel || "Ime i prezime"}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border ${
                    errors.name ? "border-red-500" : "border-white/10"
                  } rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] transition-colors`}
                  placeholder={dict.contact?.namePlaceholder || "Vaše ime"}
                />
                {errors.name && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-white font-medium mb-2">
                  {dict.contact?.emailLabel || "Email"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border ${
                    errors.email ? "border-red-500" : "border-white/10"
                  } rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] transition-colors`}
                  placeholder={dict.contact?.emailPlaceholder || "vas@email.com"}
                />
                {errors.email && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-white font-medium mb-2">
                  {dict.contact?.phoneLabel || "Telefon"}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border ${
                    errors.phone ? "border-red-500" : "border-white/10"
                  } rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] transition-colors`}
                  placeholder={dict.contact?.phonePlaceholder || "+387 65 123 456"}
                />
                {errors.phone && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Message Textarea */}
              <div>
                <label htmlFor="message" className="block text-white font-medium mb-2">
                  {dict.contact?.messageLabel || "Poruka"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full bg-white/5 border ${
                    errors.message ? "border-red-500" : "border-white/10"
                  } rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none`}
                  placeholder={dict.contact?.messagePlaceholder || "Vaša poruka..."}
                />
                {errors.message && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.message}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {dict.contact?.sending || "Šaljem..."}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {dict.contact?.send || "Pošalji Poruku"}
                  </>
                )}
              </button>

              {/* Success/Error Messages */}
              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3"
                  suppressHydrationWarning
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="text-green-500 font-medium">
                    {dict.contact?.success || "Poruka uspješno poslata! Javićemo vam se uskoro."}
                  </div>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                  suppressHydrationWarning
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="text-red-500 font-medium">
                    {dict.contact?.error || "Greška pri slanju. Pokušajte ponovo."}
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
