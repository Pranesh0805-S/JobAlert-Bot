import Navbar from "../components/shared/Navbar.jsx";
import Hero from "../components/landing/Hero.jsx";
import HowItWorks from "../components/landing/HowItWorks.jsx";
import Features from "../components/landing/Features.jsx";
import CTA from "../components/landing/CTA.jsx";
import Footer from "../components/shared/Footer.jsx";

// Unchanged from the original single-page layout - just relocated into
// pages/ now that the app has more than one route.
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </>
  );
}
