import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import tradeAtlasBackground from "@/assets/trade-atlas-background.jpg";

const highlights = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container relative px-4 md:px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mx-auto lg:mx-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              New: Client Portal Now Available
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Field Operations.{" "}
              <span className="text-primary">Simplified.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Streamline jobsite tracking, work orders, and client management. 
              Trade Atlas helps contractors document, organize, and deliver 
              projects faster than ever.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild className="gap-2">
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link to="/features">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start pt-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
              <img 
                src={tradeAtlasBackground}
                alt="Trade Atlas Dashboard Preview" 
                className="w-full h-auto"
              />
              {/* Floating Stats Cards */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-lg shadow-lg p-4 border">
                <div className="text-2xl font-bold text-primary">60%</div>
                <div className="text-sm text-muted-foreground">Faster Documentation</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card rounded-lg shadow-lg p-4 border">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Active Contractors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
