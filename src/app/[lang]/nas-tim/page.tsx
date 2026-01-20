// src/app/[lang]/nas-tim/page.tsx
import type { Metadata } from 'next'; // DODAJ
import { getDictionary } from "@/lib/dictionary";
import TeamHero from "@/components/team/TeamHero";
import TeamGrid from "@/components/team/TeamGrid";

type TeamPageProps = {
  params: { lang: "sr" | "en" };
};

// DODAJ OVU FUNKCIJU:
export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const dict = await getDictionary(params.lang);
  
  return {
    title: dict.team.title || (params.lang === 'sr' ? 'Naš Tim' : 'Our Team'),
    description: dict.team.subtitle || (params.lang === 'sr' 
      ? 'Upoznajte profesionalni tim Phoenix Gym 365. Sertifikovani treneri sa iskustvom.'
      : 'Meet the professional team of Phoenix Gym 365. Certified trainers with experience.'),
    openGraph: {
      title: params.lang === 'sr' ? 'Naš Tim | Phoenix Gym 365' : 'Our Team | Phoenix Gym 365',
      description: dict.team.subtitle,
      url: `https://phoenixgym365.com/${params.lang}/nas-tim`,
      siteName: 'Phoenix Gym 365',
      images: [
        {
          url: 'https://phoenixgym365.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Phoenix Gym 365 Team',
        }
      ],
      locale: params.lang === 'sr' ? 'sr_RS' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://phoenixgym365.com/${params.lang}/nas-tim`,
      languages: {
        'sr': '/sr/nas-tim',
        'en': '/en/nas-tim',
      },
    },
    keywords: params.lang === 'sr'
      ? ['phoenix gym treneri', 'profesionalni treneri banja luka', 'fitness instruktori']
      : ['phoenix gym trainers', 'professional trainers banja luka', 'fitness instructors'],
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const dict = await getDictionary(params.lang);

  return (
    <main className="min-h-screen bg-black">
      <TeamHero dict={dict} />
      <TeamGrid dict={dict} lang={params.lang} />  
    </main>
  );
}
