import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { 
  Map, ClipboardList, Users, Smartphone, BarChart3, Calendar,
  Building2, FileText, Camera, Wrench, Shield, Zap, Globe, 
  Bell, Database, Layers, ArrowRight
} from "lucide-react";

const featureCategories = {
  field: {
    title: "Field Operations",
    description: "Tools for your technicians in the field",
    features: [
      {
        icon: Map,
        title: "Interactive Floor Plans",
        description: "Upload CAD drawings, PDFs, or images. Place drop points, draw cable runs, and measure distances with precision.",
        highlight: "Supports CAD, PDF, PNG, JPG",
      },
      {
        icon: Camera,
        title: "Photo Documentation",
        description: "Capture before/after photos with annotations. Tag photos to specific locations and work orders.",
        highlight: "360° panorama support",
      },
      {
        icon: Smartphone,
        title: "Offline Mobile Access",
        description: "Your team can access plans, update statuses, and capture photos even without internet connection.",
        highlight: "Auto-sync when online",
      },
      {
        icon: Layers,
        title: "Drop Point Management",
        description: "Track every outlet, patch panel, and endpoint. Color-coded status indicators show progress at a glance.",
        highlight: "Custom drop point types",
      },
    ],
  },
  project: {
    title: "Project Management",
    description: "Manage projects from start to finish",
    features: [
      {
        icon: ClipboardList,
        title: "Work Order Management",
        description: "Create, assign, and track work orders. Set priorities, deadlines, and get notified of status changes.",
        highlight: "Automated workflows",
      },
      {
        icon: Calendar,
        title: "Scheduling & Dispatch",
        description: "Visual calendar for team scheduling. Drag-and-drop assignments and automated conflict detection.",
        highlight: "Route optimization",
      },
      {
        icon: Building2,
        title: "Multi-Location Support",
        description: "Manage multiple job sites from a single dashboard. Quick switching and global search across all locations.",
        highlight: "Unlimited locations on Business+",
      },
      {
        icon: BarChart3,
        title: "Reporting & Analytics",
        description: "Track project progress, team productivity, and resource utilization with customizable dashboards.",
        highlight: "Export to PDF/Excel",
      },
    ],
  },
  client: {
    title: "Client Portal",
    description: "Collaborate with your clients",
    features: [
      {
        icon: Users,
        title: "Client Access Portal",
        description: "Give clients a branded portal to view project progress, approve work, and access documentation.",
        highlight: "White-label available",
      },
      {
        icon: FileText,
        title: "Documentation Sharing",
        description: "Share floor plans, photos, test results, and reports with clients securely.",
        highlight: "Secure file sharing",
      },
      {
        icon: Bell,
        title: "Automated Notifications",
        description: "Keep clients informed with automated email updates on project milestones and status changes.",
        highlight: "Customizable templates",
      },
      {
        icon: Shield,
        title: "Access Controls",
        description: "Fine-grained permissions control what clients can see. Hide sensitive information as needed.",
        highlight: "Role-based access",
      },
    ],
  },
  integrations: {
    title: "Integrations",
    description: "Connect with your existing tools",
    features: [
      {
        icon: Database,
        title: "API Access",
        description: "Full REST API for custom integrations. Build workflows that connect Trade Atlas to your existing systems.",
        highlight: "Webhooks available",
      },
      {
        icon: Globe,
        title: "Third-Party Integrations",
        description: "Connect with QuickBooks, Google Workspace, Microsoft 365, and more popular business tools.",
        highlight: "Growing ecosystem",
      },
      {
        icon: Zap,
        title: "Automation",
        description: "Set up automated workflows triggered by events. Create work orders, send notifications, and more.",
        highlight: "Zapier compatible",
      },
      {
        icon: Wrench,
        title: "Custom Development",
        description: "Enterprise customers get access to our development team for custom integrations and features.",
        highlight: "Enterprise only",
      },
    ],
  },
};

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>Features | Trade Atlas - Powerful Tools for Field Operations</title>
        <meta 
          name="description" 
          content="Explore Trade Atlas features: interactive floor plans, work order management, client portal, mobile access, and more." 
        />
        <link rel="canonical" href="https://tradeatlas.app/features" />
      </Helmet>

      {/* Hero Header */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        {/* Tech Lines Background */}
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        {/* Gold accent nodes */}
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-500" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Platform Capabilities
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Powerful Features for{" "}
              <span className="text-gradient-gold">Modern Contractors</span>
            </h1>
            <p className="text-lg text-secondary/80 mb-8 max-w-2xl mx-auto">
              Everything you need to streamline field operations, manage projects, 
              and delight your clients — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Feature Categories */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <Tabs defaultValue="field" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-steel-dark/50 border border-secondary/20">
            <TabsTrigger value="field" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Field Operations</TabsTrigger>
            <TabsTrigger value="project" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Project Management</TabsTrigger>
            <TabsTrigger value="client" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Client Portal</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Integrations</TabsTrigger>
          </TabsList>

          {Object.entries(featureCategories).map(([key, category]) => (
            <TabsContent key={key} value={key}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">{category.title}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Stats Section */}
      <section className="relative hero-dark py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 tech-lines opacity-20" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 border border-secondary/20 rounded-xl bg-steel-dark/30 backdrop-blur-sm">
              <div className="text-4xl font-bold text-gradient-gold mb-2">500+</div>
              <div className="text-secondary/70">Active Contractors</div>
            </div>
            <div className="p-6 border border-secondary/20 rounded-xl bg-steel-dark/30 backdrop-blur-sm">
              <div className="text-4xl font-bold text-gradient-gold mb-2">10k+</div>
              <div className="text-secondary/70">Locations Managed</div>
            </div>
            <div className="p-6 border border-secondary/20 rounded-xl bg-steel-dark/30 backdrop-blur-sm">
              <div className="text-4xl font-bold text-gradient-gold mb-2">50k+</div>
              <div className="text-secondary/70">Work Orders Completed</div>
            </div>
            <div className="p-6 border border-secondary/20 rounded-xl bg-steel-dark/30 backdrop-blur-sm">
              <div className="text-4xl font-bold text-gradient-gold mb-2">99.9%</div>
              <div className="text-secondary/70">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 md:px-6 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-2xl hero-dark p-8 md:p-12 text-center border border-primary/30">
          <div className="absolute inset-0 tech-lines opacity-20" />
          <div className="absolute top-0 left-0 right-0 gold-line" />
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to See It in <span className="text-gradient-gold">Action</span>?
            </h2>
            <p className="text-secondary/80 max-w-xl mx-auto mb-6">
              Start your 14-day free trial and experience how Trade Atlas 
              can transform your field operations.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/get-started">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
