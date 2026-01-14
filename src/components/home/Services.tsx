"use client";
import { motion } from "framer-motion";
import { Dumbbell, Users, Heart, Zap, Trophy, Clock } from "lucide-react";

type ServicesProps = {
  dict: any;
};

export default function Services({ dict }: ServicesProps) {
  const services = [
    {
      icon: Dumbbell,
      title: dict.services.gym.title || "Gym Prostor",
      description: dict.services.gym.desc || "Moderna oprema za sve vrste treninga",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: dict.services.personal.title || "Personalni Treninzi",
      description: dict.services.personal.desc || "Individualan pristup sa profesionalnim trenerima",
      color: "from-[#ff6b35] to-red-500"
    },
    {
      icon: Heart,
      title: dict.services.cardio.title || "Cardio Zona",
      description: dict.services.cardio.desc || "Oprema za kardiovaskularne vježbe",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Zap,
      title: dict.services.functional.title || "Funkcionalni Trening",
      description: dict.services.functional.desc || "Kompletan program za poboljšanje funkcionalnosti",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Trophy,
      title: dict.services.group.title || "Grupni Treninzi",
      description: dict.services.group.desc || "Motivišuća grupna atmosfera",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Clock,
      title: dict.services.availability.title || "24/7 Dostupnost",
      description: dict.services.availability.desc || "Pristup teretani u bilo koje doba",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />

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
              {dict.services.badge || "Naše usluge"}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {dict.services.title || "Što Nudimo"}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dict.services.subtitle || "Sve što vam treba za postizanje vaših fitnes ciljeva"}
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative"
              >
                <div className="relative h-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  {/* Gradient glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${service.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
