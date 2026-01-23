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

      <div className="container px-4 md:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Let's Get You Started
          </h1>
          <p className="text-muted-foreground">
            Answer a few quick questions so we can tailor Trade Atlas to your needs. 
            This takes about 2 minutes.
          </p>
        </div>

        {/* Wizard */}
        <OnboardingWizard />
      </div>
    </>
  );
}
