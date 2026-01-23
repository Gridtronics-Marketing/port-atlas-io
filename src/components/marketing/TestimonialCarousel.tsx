import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.author_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <Quote className="h-8 w-8 text-primary/20 mb-4" />
        
        {/* Rating */}
        {testimonial.rating && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < testimonial.rating! 
                    ? "fill-primary text-primary" 
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}

        {/* Quote */}
        <blockquote className="text-foreground flex-1 italic">
          "{testimonial.quote}"
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t">
          <Avatar>
            <AvatarImage src={testimonial.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-foreground">
              {testimonial.author_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {testimonial.author_title}
              {testimonial.company_name && ` at ${testimonial.company_name}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialCarousel() {
  const { activeTestimonials, isLoading } = useTestimonials();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-64 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (!activeTestimonials.length) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTestimonials.slice(0, 3).map((testimonial) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  );
}
