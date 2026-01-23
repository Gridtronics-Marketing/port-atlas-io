import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, Shield, BarChart3 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const stats = [
  { value: "500+", label: "Active Contractors" },
  { value: "60%", label: "Faster Documentation" },
  { value: "99.9%", label: "Uptime Guarantee" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-steel-dark/95 via-steel-dark/90 to-steel-dark/85" />
      {/* Tech Lines Background Pattern */}
      <div className="absolute inset-0 tech-lines opacity-[0.03]" />
      
      {/* Animated Circuit Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Horizontal gold accent lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Vertical tech lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        
        {/* Corner accent nodes */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-primary/40 blur-sm" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/30 blur-sm" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-primary/20 blur-sm" />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />

      <div className="container relative px-4 md:px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
            <Zap className="h-4 w-4" />
            <span>We Marry Tech to the Trades</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-card mb-6">
            They Track Jobs.
            <br />
            <span className="text-gradient-gold">We Map Reality.</span>
          </h1>

          {/* Decorative Gold Line */}
          <div className="gold-line mx-auto mb-8" />

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-secondary/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Trade Atlas is built for infrastructure-driven teams who need more than 
            scheduling, invoices, and checklists. We document the physical world — 
            so nothing is ever lost, guessed, or rebuilt twice.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-gold" asChild>
              <Link to="/get-started">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-base font-semibold border-primary/50 text-white bg-white/10 hover:bg-white/20 hover:border-primary" 
              asChild
            >
              <Link to="/features">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm mb-16">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>24/7 Support</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={stat.label} className="relative">
                {index > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-silver" />
                )}
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
