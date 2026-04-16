import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import Stats from './components/Stats/Stats';
import Footer from './components/Footer/Footer';
import './LandingPage.scss';

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero />
        <Features />
        <Stats />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
