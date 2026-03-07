import Navbar          from '../components/layout/Navbar';
import Footer          from '../components/layout/Footer';
import HeroSection     from '../components/landing/HeroSection';
import PopularAreas    from '../components/landing/PopularAreas';
import FeaturedListings from '../components/landing/FeaturedListings';
import TrustBar        from '../components/landing/TrustBar';
import HowItWorks      from '../components/landing/HowItWorks';
import CTASection      from '../components/landing/CTASection';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <PopularAreas />
      <FeaturedListings />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
}
