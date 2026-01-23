import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJobListings } from "@/hooks/useJobListings";
import { usePageContent } from "@/hooks/usePageContent";
import { MapPin, Clock, Briefcase, ArrowRight, Users, Heart, Zap, Globe } from "lucide-react";

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive medical, dental, and vision coverage" },
  { icon: Zap, title: "Growth", description: "Learning budget and career development opportunities" },
  { icon: Globe, title: "Remote-First", description: "Work from anywhere with flexible hours" },
  { icon: Users, title: "Team Culture", description: "Collaborative environment with regular team events" },
];

export default function CareersPage() {
  const { jobs, isLoading } = useJobListings();
  const { page } = usePageContent("careers");

  const activeJobs = jobs?.filter(j => j.is_active) || [];

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Careers | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Join the Trade Atlas team. Explore career opportunities."} />
        <link rel="canonical" href="https://runwithatlas.com/careers" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute bottom-20 left-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              We're Hiring
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Join Our <span className="text-gradient-gold">Team</span></>}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {page?.hero_subtitle || "Help us build the future of field operations technology."}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why <span className="text-gradient-gold">Trade Atlas</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer competitive compensation and benefits designed to support your well-being and growth.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="border-primary/20 hover:border-primary/50 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 w-fit mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Open <span className="text-gradient-gold">Positions</span>
            </h2>
            <p className="text-muted-foreground">
              {activeJobs.length > 0 
                ? `We have ${activeJobs.length} open position${activeJobs.length > 1 ? 's' : ''}.`
                : "No open positions right now. Check back soon!"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : activeJobs.length > 0 ? (
            <div className="grid gap-4 max-w-3xl mx-auto">
              {activeJobs.map((job) => (
                <Card key={job.id} className="border-primary/20 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.employment_type}
                          </span>
                        </div>
                      </div>
                      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                        <a href={job.application_url || `mailto:careers@runwithatlas.com?subject=Application: ${job.title}`}>
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    {job.salary_range && (
                      <Badge variant="secondary" className="mt-3">{job.salary_range}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-xl mx-auto border-primary/20">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Open Positions</h3>
                <p className="text-muted-foreground mb-4">
                  We don't have any open positions right now, but we're always looking for talented people.
                </p>
                <Button variant="outline" className="border-primary/50 text-foreground bg-white/10 hover:bg-white/20" asChild>
                  <a href="mailto:careers@runwithatlas.com">Send Your Resume</a>
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
            Don't See a Fit? <span className="text-gradient-gold">Reach Out Anyway</span>
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            We're always interested in connecting with talented individuals. Drop us a line!
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
            <a href="mailto:careers@runwithatlas.com">
              Contact Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
