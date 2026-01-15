import { getDictionary } from "@/lib/dictionary";
import TeamHero from "@/components/team/TeamHero";
import TeamGrid from "@/components/team/TeamGrid";

type TeamPageProps = {
  params: { lang: "sr" | "en" };
};

export default async function TeamPage({ params }: TeamPageProps) {
  const dict = await getDictionary(params.lang);

  return (
    <main className="min-h-screen bg-black">
      <TeamHero dict={dict} />
      <TeamGrid dict={dict} lang={params.lang} />  
    </main>
  );
}
