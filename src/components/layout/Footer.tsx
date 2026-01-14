type FooterProps = {
  lang: 'sr' | 'en';
  dict: any;
};

export default function Footer({ lang, dict }: FooterProps) {
  return (
    <footer className="bg-[#1a1a1a] text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-[#f5f5f5]">
          © 2026 Phoenix Gym 365. {lang === 'sr' ? 'Sva prava zadržana.' : 'All rights reserved.'}
        </p>
        <p className="text-xs text-[#4a4a4a] mt-2">
          {lang === 'sr' ? 'Otvoreno 0-24h, 365 dana godišnje' : 'Open 24/7, 365 days a year'}
        </p>
      </div>
    </footer>
  );
}
