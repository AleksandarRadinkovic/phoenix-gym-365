import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

const CANONICAL_HOST = 'www.phoenixgym365.com'

export default function robots(): MetadataRoute.Robots {
  const hostname = (headers().get('host') ?? '').split(':')[0].toLowerCase()

  if (hostname !== CANONICAL_HOST) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${CANONICAL_HOST}/sitemap.xml`,
  }
}
