// src/components/StructuredData.tsx
export function GymStructuredData({ lang }: { lang: 'sr' | 'en' }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "GymAndSportsClub",
    "name": "Phoenix Gym 365",
    "image": "https://phoenixgym365.com/og-image.jpg",
    "description": lang === 'sr' 
      ? "Moderna teretana u Banja Luci sa 24/7 pristupom i profesionalnim trenerima"
      : "Modern gym in Banja Luka with 24/7 access and professional trainers",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Banja Luka",
      "addressRegion": "Republika Srpska",
      "addressCountry": "BA"
    },
    "url": "https://phoenixgym365.com",
    "sameAs": [
      "https://www.instagram.com/gym_phoenix_/"
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "$$",
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Personal Training",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "24/7 Access",
        "value": true
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function LocalBusinessStructuredData({ lang }: { lang: 'sr' | 'en' }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Phoenix Gym 365",
    "image": "https://phoenixgym365.com/og-image.jpg",
    "@id": "https://phoenixgym365.com",
    "url": "https://phoenixgym365.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Banja Luka",
      "addressCountry": "BA"
    },
    "sameAs": [
      "https://www.instagram.com/gym_phoenix_/"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
