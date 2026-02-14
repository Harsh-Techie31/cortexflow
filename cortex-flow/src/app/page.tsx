import { Navbar } from '@/client/components/landing/navbar';
import { Hero } from '@/client/components/landing/hero';
import { Features } from '@/client/components/landing/features';
import { Footer } from '@/client/components/landing/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
