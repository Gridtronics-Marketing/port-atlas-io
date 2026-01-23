import { Helmet } from "react-helmet-async";
import { usePageContent } from "@/hooks/usePageContent";

export default function PrivacyPage() {
  const { page } = usePageContent("privacy");

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Privacy Policy | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Learn how Trade Atlas protects your data."} />
        <link rel="canonical" href="https://runwithatlas.com/privacy" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Privacy <span className="text-gradient-gold">Policy</span></>}
            </h1>
            <p className="text-lg text-white/70">
              {page?.hero_subtitle || "Your privacy is important to us."}
            </p>
            <p className="text-sm text-white/50 mt-4">Last updated: January 2025</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-line" />
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <article className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            <h2>Introduction</h2>
            <p>
              Trade Atlas ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              field operations management platform.
            </p>

            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Company name and job title</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely via third-party providers)</li>
            </ul>

            <h3>Usage Data</h3>
            <p>We automatically collect certain information when you use our platform:</p>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and location data</li>
              <li>Usage patterns and feature interactions</li>
              <li>Log data and analytics</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul>
              <li>Providing and maintaining our services</li>
              <li>Processing transactions and billing</li>
              <li>Sending service updates and notifications</li>
              <li>Improving our platform and user experience</li>
              <li>Customer support and communication</li>
              <li>Security and fraud prevention</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul>
              <li>Service providers who assist in operating our platform</li>
              <li>Legal authorities when required by law</li>
              <li>Business partners with your consent</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption, secure data 
              centers, and regular security audits. However, no method of transmission over the 
              Internet is 100% secure.
            </p>

            <h2>Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to 
              provide services. You may request deletion of your data at any time.
            </p>

            <h2>Your Rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. You can control 
              cookie preferences through your browser settings.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our services are not intended for users under 18 years of age. We do not knowingly 
              collect information from children.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant 
              changes via email or platform notification.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> privacy@runwithatlas.com<br />
              <strong>Address:</strong> Trade Atlas, Inc.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
