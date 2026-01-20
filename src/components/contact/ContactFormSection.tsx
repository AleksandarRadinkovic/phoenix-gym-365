"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

type ContactFormSectionProps = {
  dict: any;
};

export default function ContactFormSection({ dict }: ContactFormSectionProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
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
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
            suppressHydrationWarning
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {dict.contact?.formTitle || "Pošaljite Nam Poruku"}
            </h2>
            <p className="text-gray-400 text-lg">
              {dict.contact?.formSubtitle || "Popunite formu i javićemo vam se uskoro"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 lg:p-12"
            suppressHydrationWarning
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-white font-medium mb-2">
                    {dict.contact?.nameLabel || "Ime i prezime"} <span className="text-[#ff6b35]">*</span>
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

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    {dict.contact?.emailLabel || "Email"} <span className="text-[#ff6b35]">*</span>
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
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-white font-medium mb-2">
                    {dict.contact?.phoneLabel || "Telefon"} <span className="text-[#ff6b35]">*</span>
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

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-white font-medium mb-2">
                    {dict.contact?.subjectLabel || "Tema"}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff6b35] transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-gray-900">{dict.contact?.subjectPlaceholder || "Izaberite temu"}</option>
                    <option value="membership" className="bg-gray-900">{dict.contact?.membershipOption || "Članarina"}</option>
                    <option value="training" className="bg-gray-900">{dict.contact?.trainingOption || "Personalni trening"}</option>
                    <option value="info" className="bg-gray-900">{dict.contact?.infoOption || "Opšte informacije"}</option>
                    <option value="other" className="bg-gray-900">{dict.contact?.otherOption || "Ostalo"}</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-white font-medium mb-2">
                  {dict.contact?.messageLabel || "Poruka"} <span className="text-[#ff6b35]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
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
