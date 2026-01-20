// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Rajdhani } from 'next/font/google'
import './globals.css'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://phoenixgym365.com'),
  
  title: {
    default: 'Phoenix Gym 365',
    template: '%s | Phoenix Gym 365'
  },
  
  description: 'Phoenix Gym 365 - moderna teretana u Banja Luci sa 24/7 pristupom',
  
  // MAKNI icons ako ih nemaš, ili stavi samo logo
  icons: {
    icon: '/images/logo.png', // Ako imaš logo
  },
  
  // MAKNI manifest ako ga nemaš
  // manifest: '/manifest.json',
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ef4444',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={rajdhani.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
