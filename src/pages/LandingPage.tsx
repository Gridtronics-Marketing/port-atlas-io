import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PricingCard } from "@/components/marketing/PricingCard";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";
import { 
  Map, ClipboardList, Users, Smartphone, 
  ArrowRight, Building2, Wrench, FileText,
  Cpu, Cable, Network, Layers
} from "lucide-react";
import { usePricingPlans } from "@/hooks/usePricingPlans";

const features = [
  {
    icon: Map,
    title: "Interactive Floor Plans",
    description: "Upload floor plans, place drop points, and track cable runs with precision. Your team always knows exactly where to work.",
    highlight: "50% faster site documentation",
  },
  {
    icon: ClipboardList,
    title: "Work Order Management",
    description: "Create, assign, and track work orders from start to finish. Real-time status updates keep everyone aligned.",
    highlight: "Never miss a task",
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Give clients visibility into their projects. Share progress, documentation, and reports in a branded portal.",
    highlight: "Improve client satisfaction",
  },
  {
    icon: Smartphone,
    title: "Mobile Field Access",
    description: "Technicians capture photos, update statuses, and access drawings from any device, even offline.",
    highlight: "Works without internet",
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Building2,
    title: "Set Up Your Locations",
    description: "Add your job sites, upload floor plans, and configure your drop points and equipment.",
  },
  {
    step: 2,
    icon: Wrench,
    title: "Dispatch Your Team",
    description: "Create work orders, assign technicians, and track progress in real-time from anywhere.",
  },
  {
    step: 3,
    icon: FileText,
    title: "Deliver & Document",
    description: "Capture photos, generate reports, and share deliverables with clients automatically.",
  },
];

const techFeatures = [
  { icon: Cpu, label: "AI-Powered" },
  { icon: Cable, label: "Cable Management" },
  { icon: Network, label: "Network Mapping" },
  { icon: Layers, label: "Multi-Floor" },
];

export default function LandingPage() {
  const { plansWithFeatures, isLoading } = usePricingPlans();
  const visiblePlans = plansWithFeatures.filter(p => p.is_active).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>Trade Atlas | Field Operations Management Software for Contractors</title>
        <meta 
          name="description" 
          content="Streamline jobsite tracking, work orders, and client management with Trade Atlas. Built for low voltage, telecom, and electrical contractors." 
        />
        <meta name="keywords" content="field operations, work order management, contractor software, floor plan management, low voltage, telecom" />
        <link rel="canonical" href="https://tradeatlas.app/home" />
      </Helmet>

      {/* Hero Section */}
      <HeroSection />

      {/* Tech Bar - Silver Strip */}
      <section className="relative border-y border-border bg-gradient-to-r from-muted via-background to-muted">
        <div className="absolute inset-0 tech-lines-gold opacity-30" />
        <div className="container relative px-4 md:px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-12">
            {techFeatures.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container px-4 md:px-6 py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary/50 to-transparent" />
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-4">
            <div className="w-8 h-px bg-primary" />
            Features
            <div className="w-8 h-px bg-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-primary">Run Operations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From floor plan documentation to client delivery, Trade Atlas gives you 
            industrial-grade tools for every aspect of field operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="border-primary/30 hover:border-primary hover:bg-primary/5" asChild>
            <Link to="/features">
              Explore All Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works - Dark Section */}
      <section className="relative hero-dark py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 tech-lines opacity-[0.02]" />
        
        {/* Gold accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container relative px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-4">
              <div className="w-8 h-px bg-primary" />
              Process
              <div className="w-8 h-px bg-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Get operational in minutes. See results immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-primary/10" />
                )}
                
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container px-4 md:px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-4">
            <div className="w-8 h-px bg-primary" />
            Testimonials
            <div className="w-8 h-px bg-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Trusted by <span className="text-primary">Industry Leaders</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See why contractors nationwide choose Trade Atlas.
          </p>
        </div>

        <TestimonialCarousel />
      </section>

      {/* Pricing Preview */}
      <section className="relative bg-muted/50 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 tech-lines-gold opacity-20" />
        
        <div className="container relative px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-4">
              <div className="w-8 h-px bg-primary" />
              Pricing
              <div className="w-8 h-px bg-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Simple, <span className="text-primary">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that scales with your business. All plans include a 14-day free trial.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 animate-pulse bg-muted rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {visiblePlans.map((plan) => (
                <PricingCard key={plan.id} plan={plan} isAnnual={false} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" className="glow-gold" asChild>
              <Link to="/pricing">
                View Full Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative hero-dark py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 tech-lines opacity-[0.02]" />
        
        {/* Gold accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        {/* Glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="container relative px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="gold-line mx-auto mb-8" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              Join 500+ contractors who have streamlined their field operations with Trade Atlas.
              Start your free trial today — no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-base font-semibold glow-gold" asChild>
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-base font-semibold border-gray-600 text-white hover:bg-white/5 hover:border-primary/50" 
                asChild
              >
                <Link to="/contact">
                  Talk to Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
