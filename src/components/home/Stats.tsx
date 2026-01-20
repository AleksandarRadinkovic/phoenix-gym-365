"use client";
import { useEffect, useRef, useState } from "react";
import { Dumbbell, Award, Clock, TrendingUp, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

type StatsProps = {
  dict: any;
};

function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return <div ref={ref}>{count}+</div>;
}

export default function Stats({ dict }: StatsProps) {
  const stats = [
    {
      icon: Dumbbell,
      value: 150,
      label: dict.stats.equipment || "Komada opreme",
      color: "from-[#ff6b35] to-red-500"
    },
    {
      icon: Award,
      value: 15,
      label: dict.stats.trainers || "Profesionalnih trenera",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      value: 24,
      label: dict.stats.classes || "Različitih treninga",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      value: 650,
      label: dict.stats.satisfaction || "m² Gym Space",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative group"
              >
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 lg:p-8 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Number */}
                    <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                      <CountUp end={stat.value} />
                    </div>

                    {/* Label */}
                    <p className="text-gray-400 text-sm lg:text-base font-medium">
                      {stat.label}
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
