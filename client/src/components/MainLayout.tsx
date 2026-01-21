import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { CookieNotice } from '@/components/CookieNotice';
import { BrandLogo } from '@/components/BrandLogo';

interface MainLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  transparentHeader?: boolean;
}

export default function MainLayout({ 
  children, 
  hideFooter = false,
  transparentHeader = false 
}: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: '/schools', label: 'Schools' },
    { href: '/fitness', label: 'Fitness Facilities' },
    { href: '/studios', label: 'Studios' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !transparentHeader
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 h-16' 
            : 'bg-transparent h-20'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link 
              to="/"
              className="flex items-center cursor-pointer transition-opacity hover:opacity-80 duration-200"
            >
              <BrandLogo 
                size={isScrolled || !transparentHeader ? 'sm' : 'md'} 
                forceVariant="light" 
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-all duration-200 relative group ${
                    isActive(link.href) 
                      ? 'text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-white transition-all duration-200 ${
                    isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              ))}
            </div>
            
            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/owner">
                <Button 
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/owner">
                <Button 
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl px-8 py-2.5 rounded-full transition-all duration-200 hover:scale-105"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
            <BrandLogo size="sm" forceVariant="light" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-2xl font-medium transition-colors duration-200 ${
                  isActive(link.href) 
                    ? 'text-white' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Links */}
            <div className="flex flex-col items-center gap-4 mt-8">
              <Link to="/owner" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 px-12 py-4 text-lg rounded-full"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/owner" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-xl px-12 py-6 text-lg rounded-full transition-all duration-200 hover:scale-105"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && (
        <footer className="py-12 sm:py-16 md:py-20 bg-[#1a1a1a] relative overflow-hidden">
          {/* Animated geometric shapes background */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 mb-10 sm:mb-12 md:mb-16">
              {/* Left Column - Navigation Links */}
              <div className="space-y-6">
                <Link to="/schools" className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                  Schools
                </Link>
                <Link to="/fitness" className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                  Fitness Facilities
                </Link>
                <Link to="/studios" className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                  Studios
                </Link>
                <Link to="/pricing" className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                  Pricing
                </Link>
              </div>

              {/* Right Column - Newsletter */}
              <div className="space-y-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Sign up to our newsletter for all the latest news and updates.
                </h3>
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Thanks for subscribing!");
                }}>
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                  />
                  <Button
                    type="submit"
                    className="bg-white text-gray-900 hover:bg-white/90 font-bold px-6 sm:px-8"
                  >
                    Submit
                  </Button>
                </form>
                
                {/* Social Icons */}
                <div className="flex gap-4 pt-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo */}
                <div className="flex items-center">
                  <BrandLogo size="md" forceVariant="light" />
                </div>
                
                {/* Legal Links */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                  <Link to="/terms" className="hover:text-white transition-colors uppercase tracking-wide">Terms</Link>
                  <Link to="/privacy" className="hover:text-white transition-colors uppercase tracking-wide">Privacy</Link>
                  <Link to="/cookies" className="hover:text-white transition-colors uppercase tracking-wide">Cookies</Link>
                </div>

                {/* Copyright */}
                <div className="text-sm text-white/60">
                  © 2025 DojoFlow, Inc.
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
      
      {/* Cookie Notice */}
      <CookieNotice />
    </div>
  );
}
