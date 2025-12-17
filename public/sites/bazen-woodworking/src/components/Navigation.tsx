'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gallery', label: 'Projects' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative z-10">
          <Image
            src="/images/Bazen Woodworking Logo copy.png"
            alt="Bazen Woodworking"
            width={160}
            height={50}
            className={`h-12 w-auto transition-all duration-300 ${
              isScrolled ? '' : 'brightness-0 invert'
            }`}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors relative group ${
                isScrolled
                  ? 'text-[#3d3d3d] hover:text-[#c4a35a]'
                  : 'text-white hover:text-[#c4a35a]'
              }`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#c4a35a] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <a
            href="tel:605-553-3304"
            className={`btn-primary !py-2 !px-5 text-xs ${
              isScrolled ? '' : 'bg-white/20 backdrop-blur-sm hover:bg-[#c4a35a]'
            }`}
          >
            Call Now
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden relative z-10 p-2 ${
            isScrolled || mobileMenuOpen ? 'text-[#3d3d3d]' : 'text-white'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-white transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-2xl font-light text-[#3d3d3d] hover:text-[#c4a35a] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="tel:605-553-3304"
            className="btn-primary mt-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Call 605-553-3304
          </a>
        </div>
      </div>
    </header>
  );
}
