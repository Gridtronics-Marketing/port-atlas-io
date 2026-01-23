import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/usePageContent";
import { Shield, Lock, Server, Eye, Key, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on SOC 2 Type II certified cloud infrastructure with redundant backups.",
  },
  {
    icon: Key,
    title: "Access Controls",
    description: "Role-based access control (RBAC) ensures users only access what they need.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description: "Comprehensive audit trails track all system access and data changes.",
  },
];

const certifications = [
  "SOC 2 Type II Compliant",
  "GDPR Compliant",
  "CCPA Compliant",
  "99.9% Uptime SLA",
];

export default function SecurityPage() {
  const { page } = usePageContent("security");

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Security | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Enterprise-grade security for your field operations."} />
        <link rel="canonical" href="https://runwithatlas.com/security" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Enterprise Security
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Your Data, <span className="text-gradient-gold">Protected</span></>}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {page?.hero_subtitle || "Enterprise-grade security for your field operations."}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Security Features */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Security <span className="text-gradient-gold">Features</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We implement multiple layers of security to protect your data.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {securityFeatures.map((feature) => (
              <Card key={feature.title} className="border-primary/20 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 w-fit mb-4">
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

      {/* Compliance */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Compliance & <span className="text-gradient-gold">Certifications</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Trade Atlas meets the highest industry standards for security and compliance.
                </p>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-foreground">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/30">
                <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground text-center mb-2">
                  Security First
                </h3>
                <p className="text-muted-foreground text-center text-sm">
                  Security is built into every layer of Trade Atlas, from infrastructure 
                  to application code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              How We Protect Your <span className="text-gradient-gold">Data</span>
            </h2>
            
            <div className="space-y-8">
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Data Encryption</h3>
                  <p className="text-muted-foreground">
                    All data is encrypted using industry-standard AES-256 encryption at rest and 
                    TLS 1.3 in transit. Encryption keys are managed using hardware security modules (HSM).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Secure Authentication</h3>
                  <p className="text-muted-foreground">
                    We support multi-factor authentication (MFA), single sign-on (SSO), and 
                    enterprise identity providers. Passwords are hashed using bcrypt.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Regular Security Audits</h3>
                  <p className="text-muted-foreground">
                    We conduct regular penetration testing and vulnerability assessments by 
                    third-party security firms. Our code undergoes continuous security scanning.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Incident Response</h3>
                  <p className="text-muted-foreground">
                    We maintain a comprehensive incident response plan with 24/7 monitoring. 
                    In the event of a security incident, we follow strict notification procedures.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-dark">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Have Security <span className="text-gradient-gold">Questions</span>?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            Our security team is happy to answer questions about our security practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]" asChild>
              <a href="mailto:security@runwithatlas.com">
                Contact Security Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 text-white bg-white/10 hover:bg-white/20" asChild>
              <Link to="/privacy">View Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
