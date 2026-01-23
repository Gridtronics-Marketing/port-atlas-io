import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STEPS = [
  { number: 1, name: "about_you", title: "About You", description: "Let's get to know you" },
  { number: 2, name: "company", title: "Your Company", description: "Tell us about your business" },
  { number: 3, name: "needs", title: "Your Needs", description: "What challenges are you facing?" },
  { number: 4, name: "team", title: "Your Team", description: "How big is your operation?" },
  { number: 5, name: "timeline", title: "Timeline", description: "When do you need a solution?" },
  { number: 6, name: "complete", title: "All Set!", description: "Create your account" },
];

const INDUSTRIES = [
  "Telecommunications",
  "Low Voltage",
  "Electrical",
  "HVAC",
  "Fire & Security",
  "Audio Visual",
  "Solar",
  "General Contracting",
  "Other",
];

const COMPANY_SIZES = [
  "1-5 employees",
  "6-15 employees",
  "16-50 employees",
  "51-100 employees",
  "100+ employees",
];

const NEEDS = [
  { id: "floor_plans", label: "Interactive floor plan management" },
  { id: "work_orders", label: "Work order tracking" },
  { id: "client_portal", label: "Client collaboration portal" },
  { id: "scheduling", label: "Team scheduling & dispatch" },
  { id: "documentation", label: "Project documentation" },
  { id: "mobile", label: "Mobile field access" },
  { id: "reporting", label: "Reporting & analytics" },
  { id: "inventory", label: "Inventory management" },
];

const TIMELINES = [
  "Immediately",
  "Within 1 month",
  "1-3 months",
  "3-6 months",
  "Just exploring",
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createLead, saveOnboardingResponse } = useLeads();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1 - About You
    first_name: "",
    last_name: "",
    email: searchParams.get("email") || "",
    phone: "",
    // Step 2 - Company
    company_name: "",
    industry: "",
    company_size: "",
    website: "",
    // Step 3 - Needs
    needs: [] as string[],
    other_needs: "",
    // Step 4 - Team
    technicians: "",
    managers: "",
    admins: "",
    // Step 5 - Timeline
    timeline: "",
    message: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNeed = (needId: string) => {
    setFormData((prev) => ({
      ...prev,
      needs: prev.needs.includes(needId)
        ? prev.needs.filter((n) => n !== needId)
        : [...prev.needs, needId],
    }));
  };

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = async () => {
    setIsSubmitting(true);
    
    try {
      // On step 1, create the lead
      if (currentStep === 1 && !leadId) {
        const result = await createLead.mutateAsync({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          source: "onboarding_wizard",
          status: "new",
          company_name: null,
          industry: null,
          company_size: null,
          message: null,
          utm_source: searchParams.get("utm_source"),
          utm_medium: searchParams.get("utm_medium"),
          utm_campaign: searchParams.get("utm_campaign"),
          notes: null,
          assigned_to: null,
        });
        setLeadId(result.id);
      }

      // Save step response
      if (leadId || currentStep === 1) {
        const stepData = getStepData(currentStep);
        await saveOnboardingResponse.mutateAsync({
          lead_id: leadId!,
          step_number: currentStep,
          step_name: STEPS[currentStep - 1].name,
          response_data: stepData,
          completed_at: new Date().toISOString(),
        });
      }

      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Notify super admins that onboarding is complete
    if (leadId) {
      try {
        await supabase.functions.invoke("notify-new-lead", {
          body: { lead_id: leadId, notification_type: "onboarding_complete" },
        });
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
      }
    }
    navigate(`/auth?signup=true&email=${encodeURIComponent(formData.email)}`);
  };

  const getStepData = (step: number) => {
    switch (step) {
      case 1:
        return { first_name: formData.first_name, last_name: formData.last_name, email: formData.email, phone: formData.phone };
      case 2:
        return { company_name: formData.company_name, industry: formData.industry, company_size: formData.company_size, website: formData.website };
      case 3:
        return { needs: formData.needs, other_needs: formData.other_needs };
      case 4:
        return { technicians: formData.technicians, managers: formData.managers, admins: formData.admins };
      case 5:
        return { timeline: formData.timeline, message: formData.message };
      default:
        return {};
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name && formData.email;
      case 2:
        return formData.company_name && formData.industry;
      case 3:
        return formData.needs.length > 0;
      case 4:
        return true; // Optional
      case 5:
        return formData.timeline;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              step.number < currentStep
                ? "bg-primary text-primary-foreground"
                : step.number === currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.number < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              step.number
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="Acme Contractors"
                />
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company Size</Label>
                <Select value={formData.company_size} onValueChange={(v) => updateField("company_size", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                <Label>What challenges are you looking to solve? *</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {NEEDS.map((need) => (
                    <div
                      key={need.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.needs.includes(need.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleNeed(need.id)}
                    >
                      <Checkbox checked={formData.needs.includes(need.id)} />
                      <span className="text-sm">{need.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_needs">Anything else?</Label>
                <Textarea
                  id="other_needs"
                  value={formData.other_needs}
                  onChange={(e) => updateField("other_needs", e.target.value)}
                  placeholder="Tell us about any other specific needs..."
                  rows={3}
                />
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <p className="text-muted-foreground text-sm">
                Help us understand your team structure (optional)
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technicians">Field Technicians</Label>
                  <Input
                    id="technicians"
                    type="number"
                    value={formData.technicians}
                    onChange={(e) => updateField("technicians", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managers">Project Managers</Label>
                  <Input
                    id="managers"
                    type="number"
                    value={formData.managers}
                    onChange={(e) => updateField("managers", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admins">Admins/Office Staff</Label>
                  <Input
                    id="admins"
                    type="number"
                    value={formData.admins}
                    onChange={(e) => updateField("admins", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="space-y-2">
                <Label>When do you need a solution? *</Label>
                <Select value={formData.timeline} onValueChange={(v) => updateField("timeline", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((timeline) => (
                      <SelectItem key={timeline} value={timeline}>
                        {timeline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Any additional comments?</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Tell us anything else we should know..."
                  rows={4}
                />
              </div>
            </>
          )}

          {currentStep === 6 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You're all set, {formData.first_name}!</h3>
              <p className="text-muted-foreground mb-6">
                We've learned a lot about your needs. Now let's create your account 
                and get you started with your 14-day free trial.
              </p>
              <Button size="lg" onClick={handleComplete} className="gap-2">
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 6 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
