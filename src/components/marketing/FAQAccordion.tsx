import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFAQs } from "@/hooks/useFAQs";

interface FAQAccordionProps {
  category?: string;
  limit?: number;
}

export function FAQAccordion({ category, limit }: FAQAccordionProps) {
  const { activeFAQs, isLoading } = useFAQs();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  let faqs = activeFAQs;
  if (category) {
    faqs = faqs.filter((f) => f.category === category);
  }
  if (limit) {
    faqs = faqs.slice(0, limit);
  }

  if (!faqs.length) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-left hover:no-underline">
            <span className="text-foreground font-medium">{faq.question}</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
