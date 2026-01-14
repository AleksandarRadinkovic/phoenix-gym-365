import { getDictionary } from '@/lib/dictionary';
import HeroCarousel from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import About from '@/components/home/About';
import Services from '@/components/home/Services';
import Gallery from '@/components/home/Gallery';
import BMICalculator from '@/components/home/BMICalculator';
import Testimonials from '@/components/home/Testimonials';
import ContactForm from '@/components/home/ContactForm';



type Props = {
  params: { lang: 'sr' | 'en' };
};

export default async function HomePage({ params }: Props) {
  const dict = await getDictionary(params.lang);

  return (
    <>
      <HeroCarousel dict={dict} />
      <Stats dict={dict} />
      <About dict={dict} lang={params.lang} />
      <Services dict={dict} />
      <Gallery dict={dict} />
      <BMICalculator dict={dict} />
      <Testimonials dict={dict} />
      <ContactForm dict={dict} />
    </>
  );
}
