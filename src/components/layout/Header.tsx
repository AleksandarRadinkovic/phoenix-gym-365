"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HeaderProps = {
  lang: 'sr' | 'en';
  dict: any;
};

export default function Header({ lang, dict }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // JEDNOSTAVNO - samo overflow hidden, БЕЗ position fixed!
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  const menuItems = [
    { href: `/${lang}`, label: dict.nav?.home || "Početna" },
    { href: `/${lang}/nas-tim`, label: dict.nav?.team || "Naš Tim" },
    { href: `/${lang}/kontakt`, label: dict.nav?.contact || "Kontakt" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? "bg-black/90 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href={`/${lang}`} className="flex items-center z-[101]">
              <Image
                src="/images/logo.png"
                alt="Phoenix Gym 365"
                width={120}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white hover:text-[#ff6b35] transition-colors duration-300 font-medium"
                >
                  {item.label}
                </Link>
              ))}

              {/* Language Switcher */}
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href="/sr"
                  className={`px-3 py-1 rounded transition-colors duration-300 ${
                    lang === 'sr'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  SR
                </Link>
                <Link
                  href="/en"
                  className={`px-3 py-1 rounded transition-colors duration-300 ${
                    lang === 'en'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  EN
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors z-[101] relative"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - IZVAN headera! */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-gradient-to-b from-gray-900 to-black shadow-2xl z-[95] md:hidden overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <Image
                  src="/images/logo.png"
                  alt="Phoenix Gym 365"
                  width={100}
                  height={50}
                  className="h-10 w-auto"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex flex-col p-6 space-y-2">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block text-white text-xl font-medium py-4 px-4 rounded-lg hover:bg-[#ff6b35] transition-all duration-300"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Language Switcher */}
              <div className="absolute bottom-8 left-6 right-6">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-white/60 text-sm font-medium">
                    Jezik:
                  </span>
                  <Link
                    href="/sr"
                    onClick={() => setIsOpen(false)}
                    className={`flex-1 text-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      lang === 'sr'
                        ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    SR
                  </Link>
                  <Link
                    href="/en"
                    onClick={() => setIsOpen(false)}
                    className={`flex-1 text-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      lang === 'en'
                        ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    EN
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
