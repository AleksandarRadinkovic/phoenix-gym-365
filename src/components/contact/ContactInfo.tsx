"use client";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

type ContactInfoProps = {
  dict: any;
};

export default function ContactInfo({ dict }: ContactInfoProps) {
  const contactDetails = [
    {
      icon: Phone,
      title: dict.contact?.phoneTitle || "Telefon",
      value: "+387 65 123 456",
      href: "tel:+38765123456",
      description: dict.contact?.phoneDesc || "Pozovite nas radnim danima"
    },
    {
      icon: Mail,
      title: dict.contact?.emailTitle || "Email",
      value: "info@phoenixgym365.com",
      href: "mailto:info@phoenixgym365.com",
      description: dict.contact?.emailDesc || "Odgovaramo u roku od 24h"
    },
    {
      icon: MapPin,
      title: dict.contact?.addressTitle || "Adresa",
      value: "Trg srpskih junaka 1",
      valueExtra: "Banja Luka 78000",
      href: "https://maps.google.com/?q=Trg+srpskih+junaka+1+Banja+Luka",
      description: dict.contact?.addressDesc || "Posetite nas"
    },
    {
      icon: Clock,
      title: dict.contact?.hoursTitle || "Radno vrijeme",
      value: "Pon - Ned: 00:00 - 23:59",
      description: dict.contact?.hoursDesc || "Otvoreni 7 dana u sedmici"
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactDetails.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                {detail.href ? (
                  <a
                    href={detail.href}
                    target={detail.icon === MapPin ? "_blank" : undefined}
                    rel={detail.icon === MapPin ? "noopener noreferrer" : undefined}
                    className="block h-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 hover:border-[#ff6b35]/50 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-xl bg-[#ff6b35]/10 group-hover:bg-[#ff6b35]/20 transition-colors">
                        <Icon className="w-6 h-6 text-[#ff6b35]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">{detail.title}</h3>
                        <p className="text-white font-bold mb-1">{detail.value}</p>
                        {detail.valueExtra && (
                          <p className="text-white font-bold mb-2">{detail.valueExtra}</p>
                        )}
                        <p className="text-gray-400 text-sm">{detail.description}</p>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="h-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-xl bg-[#ff6b35]/10">
                        <Icon className="w-6 h-6 text-[#ff6b35]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">{detail.title}</h3>
                        <p className="text-white font-bold mb-1">{detail.value}</p>
                        {detail.valueExtra && (
                          <p className="text-white font-bold mb-2">{detail.valueExtra}</p>
                        )}
                        <p className="text-gray-400 text-sm">{detail.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
