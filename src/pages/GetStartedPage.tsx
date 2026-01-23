import { Helmet } from "react-helmet-async";
import { OnboardingWizard } from "@/components/marketing/OnboardingWizard";

export default function GetStartedPage() {
  return (
    <>
      <Helmet>
        <title>Get Started | Trade Atlas - Start Your Free Trial</title>
        <meta 
          name="description" 
          content="Start your 14-day free trial of Trade Atlas. Tell us about your business and we'll customize your experience." 
        />
        <link rel="canonical" href="https://tradeatlas.app/get-started" />
      </Helmet>

      {/* Hero Header */}
      <section className="relative overflow-hidden hero-dark py-16 md:py-20">
        {/* Tech Lines Background */}
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        {/* Gold accent nodes */}
        <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        <div className="absolute bottom-10 left-1/4 w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-500" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Free 14-Day Trial
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Let's Get You <span className="text-gradient-gold">Started</span>
            </h1>
            <p className="text-secondary/80">
              Answer a few quick questions so we can tailor Trade Atlas to your needs. 
              This takes about 2 minutes.
            </p>
          </div>
        </div>
        
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Wizard */}
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <OnboardingWizard />
      </div>
    </>
  );
}
