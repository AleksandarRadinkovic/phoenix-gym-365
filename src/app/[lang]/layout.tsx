import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type Props = {
  children: React.ReactNode;
  params: { lang: 'sr' | 'en' };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dict = await getDictionary(params.lang);
  
  return {
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    openGraph: {
      title: dict.metadata.home.title,
      description: dict.metadata.home.description,
      url: 'https://phoenixgym365.com',
      siteName: 'Phoenix Gym 365',
      images: ['/images/logo.png'],
      locale: params.lang === 'sr' ? 'sr_RS' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://phoenixgym365.com/${params.lang}`,
      languages: {
        'sr': '/sr',
        'en': '/en',
      },
    },
  };
}

export default async function LangLayout({ children, params }: Props) {
  const dict = await getDictionary(params.lang);

  return (
    <>
      <Header lang={params.lang} dict={dict} />
      <main>{children}</main>
      <Footer lang={params.lang} dict={dict} />
    </>
  );
}
