import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Target, Heart, Zap, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Built for the Trade",
    description: "We understand contractors because we've worked alongside them. Every feature is designed with real field challenges in mind.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Your success is our success. We're committed to providing exceptional support and continuously improving based on your feedback.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We're constantly pushing boundaries to bring you the latest technology in a simple, accessible package.",
  },
  {
    icon: Users,
    title: "Partnership",
    description: "We see ourselves as an extension of your team, working together to help you grow your business.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | Trade Atlas - Our Story</title>
        <meta 
          name="description" 
          content="Learn about Trade Atlas, our mission to empower contractors with modern field operations software, and the team behind the platform." 
        />
        <link rel="canonical" href="https://tradeatlas.app/about" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        {/* Tech Lines Background */}
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        {/* Gold accent nodes */}
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute bottom-20 right-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Empowering Contractors to{" "}
              <span className="text-gradient-gold">Build the Future</span>
            </h1>
            <p className="text-lg text-secondary/80 max-w-2xl mx-auto">
              Trade Atlas was founded with a simple mission: give contractors the tools 
              they need to run their operations as efficiently as any modern business.
            </p>
          </div>
        </div>
        
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Story */}
      <section className="relative hero-dark py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 tech-lines opacity-20" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our <span className="text-gradient-gold">Story</span></h2>
              <div className="space-y-4 text-secondary/80">
                <p>
                  Trade Atlas was born from frustration. After years of watching 
                  skilled contractors struggle with outdated tools — paper floor plans, 
                  endless spreadsheets, and miscommunication — we knew there had to be 
                  a better way.
                </p>
                <p>
                  We started by listening. We spent months in the field, shadowing 
                  technicians, sitting in project meetings, and understanding the 
                  real challenges contractors face every day.
                </p>
                <p>
                  The result is Trade Atlas: a platform designed from the ground up 
                  for the unique needs of low voltage, telecom, electrical, HVAC, 
                  plumbing, and specialty contractors. Every feature exists because 
                  a contractor asked for it.
                </p>
                <p>
                  Today, we're proud to serve hundreds of contractors across the 
                  country, helping them save time, reduce errors, and deliver 
                  exceptional results to their clients.
                </p>
              </div>
            </div>
            <div className="bg-steel-dark/50 rounded-xl p-8 border border-secondary/20 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="p-4 rounded-lg bg-steel-dark/50 border border-primary/20">
                  <div className="text-4xl font-bold text-gradient-gold mb-2">2021</div>
                  <div className="text-sm text-secondary/70">Founded</div>
                </div>
                <div className="p-4 rounded-lg bg-steel-dark/50 border border-primary/20">
                  <div className="text-4xl font-bold text-gradient-gold mb-2">500+</div>
                  <div className="text-sm text-secondary/70">Customers</div>
                </div>
                <div className="p-4 rounded-lg bg-steel-dark/50 border border-primary/20">
                  <div className="text-4xl font-bold text-gradient-gold mb-2">15+</div>
                  <div className="text-sm text-secondary/70">Team Members</div>
                </div>
                <div className="p-4 rounded-lg bg-steel-dark/50 border border-primary/20">
                  <div className="text-4xl font-bold text-gradient-gold mb-2">50k+</div>
                  <div className="text-sm text-secondary/70">Work Orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These principles guide everything we do at Trade Atlas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {values.map((value) => (
            <Card key={value.title} className="text-center border-secondary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-gold-glow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container px-4 md:px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-2xl hero-dark p-8 md:p-12 text-center border border-primary/30">
          <div className="absolute inset-0 tech-lines opacity-20" />
          <div className="absolute top-0 left-0 right-0 gold-line" />
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Join the Trade Atlas <span className="text-gradient-gold">Community</span>
            </h2>
            <p className="text-secondary/80 max-w-xl mx-auto mb-6">
              Ready to transform how you manage field operations? 
              Start your free trial today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
