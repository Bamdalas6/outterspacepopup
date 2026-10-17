import Hero from "@/components/Hero";
import { Nav, Bento, Lookbook, Collection, GuestList, Footer } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Bento />
        <Lookbook />
        <Collection />
        <GuestList />
      </main>
      <Footer />
    </>
  );
}
