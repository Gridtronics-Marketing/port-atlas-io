import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-steel-dark/95 backdrop-blur supports-[backdrop-filter]:bg-steel-dark/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3">
          <img 
            src={tradeAtlasLogo} 
            alt="Trade Atlas" 
            className="h-9 w-auto"
          />
          <span className="text-xl font-bold text-gradient-gold">Trade Atlas</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href) 
                  ? "text-primary" 
                  : "text-white/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-white/70 hover:text-primary hover:bg-primary/10" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
            <Link to="/get-started">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-primary">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-steel-dark border-primary/20">
            <div className="flex flex-col gap-6 mt-6">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      isActive(link.href) 
                        ? "text-primary" 
                        : "text-white/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-3 pt-4 border-t border-primary/20">
                <Button variant="outline" className="w-full border-primary/30 text-white hover:bg-primary/10 hover:border-primary" asChild>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Log In</Link>
                </Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
                  <Link to="/get-started" onClick={() => setIsOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
