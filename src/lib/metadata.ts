// src/lib/metadata.ts
import { Metadata } from 'next'

type Locale = 'sr' | 'en'

interface MetadataConfig {
  sr: {
    home: { title: string; description: string }
    team: { title: string; description: string }
    contact: { title: string; description: string }
  }
  en: {
    home: { title: string; description: string }
    team: { title: string; description: string }
    contact: { title: string; description: string }
  }
}

export const metadataConfig: MetadataConfig = {
  sr: {
    home: {
      title: 'Phoenix Gym 365 - Moderna Teretana u Banja Luci',
      description: 'Phoenix Gym 365 - najbolja teretana u Banja Luci. Profesionalni treneri, moderna oprema, 24/7 pristup. Postani najbolja verzija sebe!',
    },
    team: {
      title: 'Naš Tim - Profesionalni Treneri',
      description: 'Upoznajte profesionalni tim Phoenix Gym 365. Sertifikovani treneri sa više od 10 godina iskustva spremni da vam pomognu.',
    },
    contact: {
      title: 'Kontakt - Javite Nam Se',
      description: 'Kontaktirajte Phoenix Gym 365 u Banja Luci. Adresa, telefon, radno vrijeme. Posjetite nas ili nas pozovite.',
    },
  },
  en: {
    home: {
      title: 'Phoenix Gym 365 - Modern Gym in Banja Luka',
      description: 'Phoenix Gym 365 - the best gym in Banja Luka. Professional trainers, modern equipment, 24/7 access.',
    },
    team: {
      title: 'Our Team - Professional Trainers',
      description: 'Meet the professional team of Phoenix Gym 365. Certified trainers with over 10 years of experience.',
    },
    contact: {
      title: 'Contact - Get In Touch',
      description: 'Contact Phoenix Gym 365 in Banja Luka. Address, phone, opening hours.',
    },
  },
}

export function generateMetadata(locale: Locale, page: keyof MetadataConfig['sr']): Metadata {
  const baseUrl = 'https://phoenixgym365.com'
  const config = metadataConfig[locale][page]
  
  return {
    title: config.title,
    description: config.description,
    keywords: locale === 'sr' 
      ? ['teretana banja luka', 'fitness', 'phoenix gym', '24/7 teretana', 'personalni trening', 'moderna oprema']
      : ['gym banja luka', 'fitness', 'phoenix gym', '24/7 gym', 'personal training', 'modern equipment'],
    
    openGraph: {
      type: 'website',
      locale: locale === 'sr' ? 'sr_RS' : 'en_US',
      url: `${baseUrl}/${locale}${page === 'home' ? '' : `/${page === 'team' ? 'nas-tim' : 'kontakt'}`}`,
      title: config.title,
      description: config.description,
      siteName: 'Phoenix Gym 365',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Phoenix Gym 365 - Banja Luka',
        },
      ],
    },
    
    alternates: {
      canonical: `${baseUrl}/${locale}${page === 'home' ? '' : `/${page === 'team' ? 'nas-tim' : 'kontakt'}`}`,
      languages: {
        'sr': `${baseUrl}/sr${page === 'home' ? '' : `/${page === 'team' ? 'nas-tim' : 'kontakt'}`}`,
        'en': `${baseUrl}/en${page === 'home' ? '' : `/${page === 'team' ? 'nas-tim' : 'kontakt'}`}`,
      },
    },
  }
}
