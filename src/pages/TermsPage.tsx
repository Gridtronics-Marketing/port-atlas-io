import { Helmet } from "react-helmet-async";
import { usePageContent } from "@/hooks/usePageContent";

export default function TermsPage() {
  const { page } = usePageContent("terms");

  return (
    <>
      <Helmet>
        <title>{page?.page_title || "Terms of Service | Trade Atlas"}</title>
        <meta name="description" content={page?.meta_description || "Trade Atlas Terms of Service."} />
        <link rel="canonical" href="https://runwithatlas.com/terms" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden hero-dark py-20 md:py-28">
        <div className="absolute inset-0 tech-lines opacity-30" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {page?.hero_title || <>Terms of <span className="text-gradient-gold">Service</span></>}
            </h1>
            <p className="text-lg text-white/70">
              {page?.hero_subtitle || "Please read these terms carefully before using Trade Atlas."}
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
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using Trade Atlas ("the Service"), you agree to be bound by these Terms 
              of Service. If you do not agree to these terms, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Trade Atlas provides a field operations management platform that enables contractors 
              and businesses to document, manage, and collaborate on location-based projects. 
              Features include floor plan management, work order tracking, and team collaboration tools.
            </p>

            <h2>3. User Accounts</h2>
            <h3>3.1 Registration</h3>
            <p>
              To use certain features, you must create an account. You agree to provide accurate, 
              current, and complete information during registration and to update such information 
              to keep it accurate.
            </p>
            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Upload malicious code or attempt to breach security</li>
              <li>Interfere with other users' access to the Service</li>
              <li>Attempt to reverse engineer the Service</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2>5. Intellectual Property</h2>
            <h3>5.1 Our Property</h3>
            <p>
              The Service, including its design, features, and content, is owned by Trade Atlas 
              and protected by intellectual property laws. You may not copy, modify, or distribute 
              our intellectual property without permission.
            </p>
            <h3>5.2 Your Content</h3>
            <p>
              You retain ownership of content you upload to the Service. By uploading content, 
              you grant us a license to store, display, and process that content to provide the Service.
            </p>

            <h2>6. Subscription and Payment</h2>
            <h3>6.1 Fees</h3>
            <p>
              Certain features require a paid subscription. Fees are billed in advance and are 
              non-refundable except as required by law.
            </p>
            <h3>6.2 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Access continues until the end of the 
              current billing period.
            </p>

            <h2>7. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. By using the Service, 
              you consent to our collection and use of data as described therein.
            </p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADE ATLAS SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM 
              YOUR USE OF THE SERVICE.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Trade Atlas from any claims, damages, or 
              expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these Terms 
              or for any other reason at our discretion. Upon termination, your right to use the 
              Service ceases immediately.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Service after changes 
              constitutes acceptance of the modified Terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, without regard to 
              conflict of law principles.
            </p>

            <h2>14. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p>
              <strong>Email:</strong> legal@runwithatlas.com<br />
              <strong>Address:</strong> Trade Atlas, Inc.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
