// src/app/[lang]/kontakt/page.tsx
import type { Metadata } from 'next'; // DODAJ
import { getDictionary } from "@/lib/dictionary";
import ContactHero from "@/components/contact/ContactHero";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactFormSection from "@/components/contact/ContactFormSection";
import ContactMap from "@/components/contact/ContactMap";
import { LocalBusinessStructuredData } from '@/components/StructuredData'; // DODAJ

type ContactPageProps = {
  params: { lang: "sr" | "en" };
};

// DODAJ OVU FUNKCIJU:
export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const dict = await getDictionary(params.lang);
  
  return {
    title: dict.contact.heroTitle || (params.lang === 'sr' ? 'Kontakt' : 'Contact'),
    description: dict.contact.heroSubtitle || (params.lang === 'sr' 
      ? 'Kontaktirajte Phoenix Gym 365 u Banja Luci. Posjetite nas ili nas pozovite.'
      : 'Contact Phoenix Gym 365 in Banja Luka. Visit us or call us.'),
    openGraph: {
      title: params.lang === 'sr' ? 'Kontakt | Phoenix Gym 365' : 'Contact | Phoenix Gym 365',
      description: dict.contact.heroSubtitle,
      url: `https://phoenixgym365.com/${params.lang}/kontakt`,
      siteName: 'Phoenix Gym 365',
      images: [
        {
          url: 'https://phoenixgym365.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Phoenix Gym 365 Contact',
        }
      ],
      locale: params.lang === 'sr' ? 'sr_RS' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://phoenixgym365.com/${params.lang}/kontakt`,
      languages: {
        'sr': '/sr/kontakt',
        'en': '/en/kontakt',
      },
    },
    keywords: params.lang === 'sr'
      ? ['phoenix gym kontakt', 'teretana banja luka adresa', 'phoenix gym 365 telefon']
      : ['phoenix gym contact', 'gym banja luka address', 'phoenix gym 365 phone'],
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const dict = await getDictionary(params.lang);

  return (
    <main className="min-h-screen bg-black">
      <LocalBusinessStructuredData lang={params.lang} /> {/* DODAJ OVO */}
      <ContactHero dict={dict} />
      <ContactInfo dict={dict} />
      <ContactFormSection dict={dict} />
      <ContactMap dict={dict} />
    </main>
  );
}
