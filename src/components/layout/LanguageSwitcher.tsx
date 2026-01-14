'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type LanguageSwitcherProps = {
  lang: 'sr' | 'en';
};

export default function LanguageSwitcher({ lang }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const pathWithoutLang = pathname.replace(/^\/(sr|en)/, '') || '';

  return (
    <div className="flex items-center gap-2 bg-[#4a4a4a] rounded-full px-3 py-1">
      <Link
        href={`/sr${pathWithoutLang}`}
        className={`text-sm font-medium transition-colors ${
          lang === 'sr' ? 'text-[#ff6b35]' : 'text-white hover:text-[#ff6b35]'
        }`}
      >
        SR
      </Link>
      <span className="text-white">|</span>
      <Link
        href={`/en${pathWithoutLang}`}
        className={`text-sm font-medium transition-colors ${
          lang === 'en' ? 'text-[#ff6b35]' : 'text-white hover:text-[#ff6b35]'
        }`}
      >
        EN
      </Link>
    </div>
  );
}
