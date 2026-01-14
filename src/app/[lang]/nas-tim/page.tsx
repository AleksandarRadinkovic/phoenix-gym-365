import { getDictionary } from '@/lib/dictionary';

type Props = {
  params: { lang: 'sr' | 'en' };
};

export default async function TeamPage({ params }: Props) {
  const dict = await getDictionary(params.lang);

  return (
    <div className="min-h-screen pt-32 pb-16 bg-white">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-8">
          {dict.nav.team}
        </h1>
        <p className="text-lg text-[#4a4a4a]">
          {params.lang === 'sr' ? 'Stranica u izradi...' : 'Page under construction...'}
        </p>
      </div>
    </div>
  );
}
