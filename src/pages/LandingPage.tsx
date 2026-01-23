import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PricingCard } from "@/components/marketing/PricingCard";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";
import { 
  Map, ClipboardList, Users, Smartphone, 
  BarChart3, Calendar, Shield, ArrowRight,
  Building2, Wrench, FileText
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

      {/* Trust Bar */}
      <section className="border-y bg-muted/30">
        <div className="container px-4 md:px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Run Your Operations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From floor plan documentation to client delivery, Trade Atlas gives you 
            the tools to manage every aspect of your field operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link to="/features">
              View All Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and see results immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Contractors Nationwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers are saying about Trade Atlas.
          </p>
        </div>

        <TestimonialCarousel />
      </section>

      {/* Pricing Preview */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {visiblePlans.map((plan) => (
                <PricingCard key={plan.id} plan={plan} isAnnual={false} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link to="/pricing">
                See Full Pricing Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join 500+ contractors who have streamlined their field operations with Trade Atlas.
            Start your free trial today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/get-started">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
