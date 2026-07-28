import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Features from "./components/Features.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-slate-100 font-body">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}
