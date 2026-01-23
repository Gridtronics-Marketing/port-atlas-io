import { Helmet } from "react-helmet-async";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@tradeatlas.app",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "(555) 123-4567",
    description: "Mon-Fri, 9am-5pm EST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "San Francisco, CA",
    description: "By appointment only",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "< 24 hours",
    description: "For all inquiries",
  },
];

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact Us | Trade Atlas - Get in Touch</title>
        <meta 
          name="description" 
          content="Have questions about Trade Atlas? Contact our team. We're here to help you streamline your field operations." 
        />
        <link rel="canonical" href="https://tradeatlas.app/contact" />
      </Helmet>

      {/* Hero Header */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        {/* Tech Lines Background */}
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        {/* Gold accent nodes */}
        <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="absolute bottom-20 left-20 w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/30 rounded-full">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Let's <span className="text-gradient-gold">Connect</span>
            </h1>
            <p className="text-lg text-secondary/80 max-w-2xl mx-auto">
              Have questions about Trade Atlas? Want to learn more about how we can 
              help your business? We'd love to hear from you.
            </p>
          </div>
        </div>
        
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      <div className="container px-4 md:px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                We're Here to Help
              </h2>
              <p className="text-muted-foreground">
                Whether you're exploring options, have technical questions, or need 
                support with your account, our team is ready to assist.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {contactInfo.map((info) => (
                <Card key={info.title} className="border-secondary/20 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-4 flex gap-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 h-fit">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{info.title}</h3>
                      <p className="text-sm font-medium text-primary">{info.value}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <Card className="border-secondary/20 bg-steel-dark/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Looking for Support?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you're an existing customer needing technical support, please 
                  log in to your account and submit a support ticket for faster assistance.
                </p>
                <p className="text-sm text-muted-foreground">
                  Enterprise customers with SLA agreements should contact their 
                  dedicated account manager directly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
