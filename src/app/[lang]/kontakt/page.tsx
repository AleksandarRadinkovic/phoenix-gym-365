import { getDictionary } from "@/lib/dictionary";
import ContactHero from "@/components/contact/ContactHero";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactFormSection from "@/components/contact/ContactFormSection";
import ContactMap from "@/components/contact/ContactMap";

type ContactPageProps = {
  params: { lang: "sr" | "en" };
};

export default async function ContactPage({ params }: ContactPageProps) {
  const dict = await getDictionary(params.lang);

  return (
    <main className="min-h-screen bg-black">
      <ContactHero dict={dict} />
      <ContactInfo dict={dict} />
      <ContactFormSection dict={dict} />
      <ContactMap dict={dict} />
    </main>
  );
}
