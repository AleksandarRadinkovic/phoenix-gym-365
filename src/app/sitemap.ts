import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://phoenixgym365.com'
  
  const routes = ['', '/nas-tim', '/kontakt']
  const locales = ['sr', 'en']
  
  const urls: MetadataRoute.Sitemap = []
  
  routes.forEach(route => {
    locales.forEach(locale => {
      urls.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })
  
  return urls
}
