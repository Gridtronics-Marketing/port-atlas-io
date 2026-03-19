import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageContent } from "@/hooks/usePageContent";
import { Code, Key, Zap, BookOpen, ArrowRight, Terminal, Webhook, Database } from "lucide-react";

const BASE_URL = "https://mhrekppksiekhstnteyu.supabase.co/functions/v1/api-v1";

const endpoints = [
  { method: "GET", path: "/locations", description: "List all locations (paginated)" },
  { method: "POST", path: "/locations", description: "Create a new location" },
  { method: "GET", path: "/drop-points", description: "List drop points (filterable by location_id)" },
  { method: "POST", path: "/work-orders", description: "Create a work order" },
  { method: "GET", path: "/employees", description: "List employees" },
];

const features = [
  { icon: Key, title: "API Keys", description: "Secure authentication with API keys" },
  { icon: Webhook, title: "Scoped Access", description: "Fine-grained scope controls per key" },
  { icon: Database, title: "REST API", description: "Standard RESTful JSON endpoints" },
  { icon: Zap, title: "Pagination", description: "Built-in pagination on all list endpoints" },
];

export default function APIPage() {
  const { page } = usePageContent("api");

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "API Documentation | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Integrate with Trade Atlas using our REST API."} />
        <link rel="canonical" href="https://runwithatlas.com/api" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Developers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>API <span className="text-gradient-gold">Documentation</span></>}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              {page?.hero_subtitle || "Build powerful integrations with Trade Atlas."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
                <a href="/settings"><BookOpen className="mr-2 h-5 w-5" />Get API Key</a>
              </Button>
              <Button size="lg" variant="outline" className="border-primary/50 text-white bg-white/10 hover:bg-white/20">
                <Terminal className="mr-2 h-5 w-5" />
                API Playground
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-primary/20 hover:border-primary/50 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 w-fit mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Quick <span className="text-gradient-gold">Start</span>
              </h2>
              <p className="text-muted-foreground">Get started with the Trade Atlas API in minutes.</p>
            </div>

            <Card className="border-primary/20 bg-steel-dark/50 text-white">
              <CardContent className="p-6">
                <pre className="overflow-x-auto text-sm">
                  <code>{`# Authenticate with your API key
curl -X GET "${BASE_URL}/locations" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Response
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Building A",
      "address": "123 Main St",
      "city": "Chicago",
      "state": "IL",
      "num_floors": 5,
      "created_at": "2026-01-15T..."
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 25
  }
}

# Create a work order
curl -X POST "${BASE_URL}/work-orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Install drops floor 3", "priority": "high"}'`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Available <span className="text-gradient-gold">Endpoints</span>
              </h2>
              <p className="text-muted-foreground">All endpoints require a valid API key in the Authorization header.</p>
            </div>

            <Card className="border-primary/20">
              <CardContent className="p-0">
                <div className="divide-y">
                  {endpoints.map((endpoint, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <Badge variant="outline" className={endpoint.method === "GET" ? "border-green-500 text-green-600" : "border-blue-500 text-blue-600"}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono text-foreground flex-1">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">Base URL</h4>
              <code className="text-sm text-primary break-all">{BASE_URL}</code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-dark">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to <span className="text-gradient-gold">Build</span>?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            Generate your API key in Settings and start integrating Trade Atlas into your workflow.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
            <a href="/settings">
              Get API Key
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
