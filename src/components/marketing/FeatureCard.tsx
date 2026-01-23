import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
}

export function FeatureCard({ icon: Icon, title, description, highlight }: FeatureCardProps) {
  return (
    <Card className="group hover:shadow-gold-glow transition-all duration-300 border-secondary/20 hover:border-primary/50 h-full bg-card">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4 rounded-lg bg-primary/10 border border-primary/30 p-3 w-fit group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm flex-1">{description}</p>
        {highlight && (
          <div className="mt-4 pt-4 border-t border-secondary/20">
            <span className="text-xs font-medium text-primary">{highlight}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
