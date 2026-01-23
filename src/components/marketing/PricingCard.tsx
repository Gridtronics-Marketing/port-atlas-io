import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { PlanWithFeatures } from "@/hooks/usePricingPlans";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: PlanWithFeatures;
  isAnnual: boolean;
}

export function PricingCard({ plan, isAnnual }: PricingCardProps) {
  const price = isAnnual ? plan.price_yearly : plan.price_monthly;
  const period = isAnnual ? "/year" : "/month";
  
  const annualSavings = plan.price_monthly && plan.price_yearly 
    ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
    : 0;

  return (
    <Card className={cn(
      "relative flex flex-col h-full transition-all duration-300",
      plan.is_popular && "border-primary shadow-lg scale-105 z-10"
    )}>
      {plan.is_popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="pb-4">
        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Pricing */}
        <div className="mb-6">
          {plan.is_enterprise ? (
            <div className="text-3xl font-bold text-foreground">Custom</div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                ${price}
              </span>
              <span className="text-muted-foreground">{period}</span>
            </div>
          )}
          {isAnnual && annualSavings > 0 && (
            <p className="text-sm text-primary mt-1">
              Save {annualSavings}% with annual billing
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Locations</span>
            <span className="font-medium text-foreground">
              {plan.max_locations || "Unlimited"}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Users</span>
            <span className="font-medium text-foreground">
              {plan.max_users || "Unlimited"}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-2">
              {feature.is_included ? (
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={cn(
                "text-sm",
                feature.is_included ? "text-foreground" : "text-muted-foreground line-through"
              )}>
                {feature.feature_name}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-6">
          <Button 
            className="w-full" 
            variant={plan.is_popular ? "default" : "outline"}
            asChild
          >
            <Link to={plan.is_enterprise ? "/contact" : "/get-started"}>
              {plan.is_enterprise ? "Contact Sales" : "Start Free Trial"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
