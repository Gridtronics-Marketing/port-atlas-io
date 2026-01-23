import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PricingCard } from "@/components/marketing/PricingCard";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, ArrowRight } from "lucide-react";
import { usePricingPlans } from "@/hooks/usePricingPlans";

const allFeatures = [
  { name: "Floor Plan Management", starter: true, professional: true, business: true, enterprise: true },
  { name: "Drop Point Tracking", starter: true, professional: true, business: true, enterprise: true },
  { name: "Work Order Management", starter: true, professional: true, business: true, enterprise: true },
  { name: "Mobile App Access", starter: true, professional: true, business: true, enterprise: true },
  { name: "Email Support", starter: true, professional: true, business: true, enterprise: true },
  { name: "Client Portal", starter: false, professional: true, business: true, enterprise: true },
  { name: "Scheduling & Calendar", starter: false, professional: true, business: true, enterprise: true },
  { name: "Reporting Dashboard", starter: false, professional: true, business: true, enterprise: true },
  { name: "API Access", starter: false, professional: true, business: true, enterprise: true },
  { name: "Unlimited Locations", starter: false, professional: false, business: true, enterprise: true },
  { name: "Advanced Analytics", starter: false, professional: false, business: true, enterprise: true },
  { name: "Custom Integrations", starter: false, professional: false, business: true, enterprise: true },
  { name: "Phone Support", starter: false, professional: false, business: true, enterprise: true },
  { name: "Dedicated Account Manager", starter: false, professional: false, business: true, enterprise: true },
  { name: "White Label Options", starter: false, professional: false, business: false, enterprise: true },
  { name: "Custom Development", starter: false, professional: false, business: false, enterprise: true },
  { name: "SLA Guarantee", starter: false, professional: false, business: false, enterprise: true },
  { name: "24/7 Support", starter: false, professional: false, business: false, enterprise: true },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const { plansWithFeatures, isLoading } = usePricingPlans();
  const activePlans = plansWithFeatures.filter(p => p.is_active);

  return (
    <>
      <Helmet>
        <title>Pricing | Trade Atlas - Plans for Every Team Size</title>
        <meta 
          name="description" 
          content="Choose the right Trade Atlas plan for your team. From solo contractors to enterprise operations. Start your 14-day free trial today." 
        />
        <link rel="canonical" href="https://tradeatlas.app/pricing" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": []
          })}
        </script>
      </Helmet>

      {/* Hero Header */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        {/* Tech Lines Background */}
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        {/* Gold accent nodes */}
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute top-40 left-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Transparent Pricing
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Simple, <span className="text-gradient-gold">Transparent</span> Pricing
            </h1>
            <p className="text-lg text-secondary/80 mb-8 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial 
              with full access — no credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-steel-dark/50 border border-secondary/20 w-fit mx-auto">
              <Label 
                htmlFor="billing-toggle" 
                className={!isAnnual ? "text-white font-medium" : "text-secondary/60"}
              >
                Monthly
              </Label>
              <Switch 
                id="billing-toggle" 
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label 
                htmlFor="billing-toggle" 
                className={isAnnual ? "text-white font-medium" : "text-secondary/60"}
              >
                Annual
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary border border-primary/30">
                  Save 20%
                </span>
              </Label>
            </div>
          </div>
        </div>
        
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Pricing Cards */}
      <section className="container px-4 md:px-6 py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[500px] animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-start">
            {activePlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} isAnnual={isAnnual} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Comparison Table */}
      <section className="relative hero-dark py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 tech-lines opacity-20" />
        <div className="absolute top-0 left-0 right-0 gold-line" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Compare All <span className="text-gradient-gold">Features</span>
            </h2>
            <p className="text-secondary/70">
              See exactly what's included in each plan.
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <Table className="border border-secondary/20 rounded-xl overflow-hidden">
              <TableHeader className="bg-steel-dark/50">
                <TableRow className="border-secondary/20">
                  <TableHead className="w-[300px] text-secondary">Feature</TableHead>
                  <TableHead className="text-center text-secondary">Starter</TableHead>
                  <TableHead className="text-center text-secondary">Professional</TableHead>
                  <TableHead className="text-center text-secondary">Business</TableHead>
                  <TableHead className="text-center text-secondary">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFeatures.map((feature) => (
                  <TableRow key={feature.name} className="border-secondary/20 bg-steel-dark/30">
                    <TableCell className="font-medium text-white">{feature.name}</TableCell>
                    <TableCell className="text-center">
                      {feature.starter ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-secondary/40 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.professional ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-secondary/40 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.business ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-secondary/40 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.enterprise ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-secondary/40 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Have questions? We've got answers.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <FAQAccordion />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 md:px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-2xl hero-dark p-8 md:p-12 text-center border border-primary/30">
          <div className="absolute inset-0 tech-lines opacity-20" />
          <div className="absolute top-0 left-0 right-0 gold-line" />
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Still Have <span className="text-gradient-gold">Questions</span>?
            </h2>
            <p className="text-secondary/80 max-w-xl mx-auto mb-6">
              Our team is here to help. Schedule a demo and we'll walk you through 
              the platform and help you find the right plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
