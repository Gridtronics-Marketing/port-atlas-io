import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Facebook, Twitter, Linkedin, Instagram, Mail } from "lucide-react";
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";

const footerLinks = {
  product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/get-started", label: "Get Started" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/careers", label: "Careers" },
  ],
  resources: [
    { href: "/blog", label: "Blog" },
    { href: "/help", label: "Help Center" },
    { href: "/api", label: "API Docs" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
  ],
};

const socialLinks = [
  { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
];

export function PublicFooter() {
  return (
    <footer className="hero-dark border-t border-primary/20">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/home" className="flex items-center gap-3 mb-4">
              <img 
                src={tradeAtlasLogo} 
                alt="Trade Atlas" 
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold text-gradient-gold">Trade Atlas</span>
            </Link>
            <p className="text-sm text-white/60 mb-6 max-w-xs">
              Streamline your field operations with intelligent floor plan management, 
              work orders, and client collaboration tools.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Stay updated</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="max-w-[200px] bg-white/5 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
                />
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-primary/20" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Trade Atlas. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
