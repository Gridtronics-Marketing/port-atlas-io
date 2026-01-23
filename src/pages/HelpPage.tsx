import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useHelpArticles } from "@/hooks/useHelpArticles";
import { usePageContent } from "@/hooks/usePageContent";
import { Search, BookOpen, MessageCircle, Mail, ArrowRight } from "lucide-react";

export default function HelpPage() {
  const { articlesByCategory, isLoading } = useHelpArticles();
  const { page } = usePageContent("help");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = articlesByCategory ? Object.keys(articlesByCategory) : [];

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Help Center | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Get help with Trade Atlas."} />
        <link rel="canonical" href="https://runwithatlas.com/help" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Support
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Help <span className="text-gradient-gold">Center</span></>}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              {page?.hero_subtitle || "Find answers and get support for Trade Atlas."}
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white/10 border-primary/30 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="container px-4 md:px-6">
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Documentation</h3>
                <p className="text-sm text-muted-foreground">Guides & tutorials</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Talk to support</p>
              </CardContent>
            </Card>
            <Link to="/contact">
              <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">Send a message</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Help Articles */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : categories.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {categories.map((category) => (
                <Card key={category} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {articlesByCategory?.[category]?.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger className="text-left hover:text-primary">
                            {article.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {article.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-xl mx-auto border-primary/20">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Help Articles Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're building our help center. In the meantime, contact us for support.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-dark">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Still Need <span className="text-gradient-gold">Help</span>?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            Our support team is here to help you get the most out of Trade Atlas.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
            <a href="mailto:support@runwithatlas.com">
              Contact Support
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
