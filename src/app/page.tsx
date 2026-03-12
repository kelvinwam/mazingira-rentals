import Navbar          from '../components/layout/Navbar';
import Footer          from '../components/layout/Footer';
import HeroSection     from '../components/landing/HeroSection';
import PopularAreas    from '../components/landing/PopularAreas';
import TrustBar        from '../components/landing/TrustBar';
import HowItWorks      from '../components/landing/HowItWorks';
import Testimonials    from '../components/landing/Testimonials';
import CTASection      from '../components/landing/CTASection';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <HowItWorks />
      <PopularAreas />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
