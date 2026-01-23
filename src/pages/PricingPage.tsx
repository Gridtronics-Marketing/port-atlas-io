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

      {/* Header */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that fits your business. All plans include a 14-day free trial 
            with full access — no credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label 
              htmlFor="billing-toggle" 
              className={!isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}
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
              className={isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}
            >
              Annual
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Save 20%
              </span>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container px-4 md:px-6 pb-16">
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
      <section className="container px-4 md:px-6 py-16 md:py-24 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Compare All Features
          </h2>
          <p className="text-muted-foreground">
            See exactly what's included in each plan.
          </p>
        </div>

        <div className="max-w-5xl mx-auto overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Feature</TableHead>
                <TableHead className="text-center">Starter</TableHead>
                <TableHead className="text-center">Professional</TableHead>
                <TableHead className="text-center">Business</TableHead>
                <TableHead className="text-center">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFeatures.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell className="text-center">
                    {feature.starter ? (
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.professional ? (
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.business ? (
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.enterprise ? (
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Still Have Questions?
          </h2>
          <p className="opacity-90 max-w-xl mx-auto mb-6">
            Our team is here to help. Schedule a demo and we'll walk you through 
            the platform and help you find the right plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/get-started">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
