import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-full bg-background">
      <div className="container max-w-4xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: December 28, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow ("we," "our," or "us") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our martial arts school management platform and related services (collectively, the "Service"). By accessing or using the Service, you agree to the terms of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Information You Provide Directly</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information that you voluntarily provide when using our Service, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile details when you create an account</li>
              <li><strong>School Information:</strong> School name, address, timezone, programs offered, and organizational details</li>
              <li><strong>Student Information:</strong> Student names, contact details, belt ranks, membership status, attendance records, and guardian information</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through our payment processor (Stripe)</li>
              <li><strong>Communications:</strong> Messages, support requests, and feedback you send to us</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Information Collected Automatically</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you access our Service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, and interaction patterns</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Cookies and Tracking Technologies:</strong> Session cookies, authentication tokens, and analytics data (see our Cookie Policy for details)</li>
              <li><strong>Log Data:</strong> Server logs including access times, error messages, and system activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve the DojoFlow platform and its features</li>
              <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
              <li><strong>Communication:</strong> To send service notifications, updates, security alerts, and respond to inquiries</li>
              <li><strong>AI Features:</strong> To power Kai (our AI assistant) for student management, scheduling, and administrative tasks</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, improve user experience, and develop new features</li>
              <li><strong>Payment Processing:</strong> To process subscription payments and manage billing</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Share Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., Stripe for payment processing, cloud hosting providers, analytics services)</li>
              <li><strong>Within Your Organization:</strong> With authorized users within your martial arts school (owners, staff, instructors) based on role permissions</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (you will be notified via email)</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption in transit (TLS/SSL), secure password hashing, role-based access controls, and regular security audits. However, no method of transmission over the internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy. When you close your account, we will delete or anonymize your personal information within 90 days, except where we are required to retain it for legal, regulatory, or security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your personal information for certain purposes</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for processing where we rely on consent as the legal basis</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@dojoflow.com" className="text-primary hover:underline">privacy@dojoflow.com</a>. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow is designed for use by martial arts school administrators, staff, and parents/guardians. While our platform may store information about minor students, we do not knowingly collect personal information directly from children under 13 without parental consent. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from your jurisdiction. By using the Service, you consent to the transfer of your information to the United States and other countries where we operate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>Email:</strong> <a href="mailto:privacy@dojoflow.com" className="text-primary hover:underline">privacy@dojoflow.com</a></p>
              <p className="text-muted-foreground mt-2"><strong>Address:</strong> DojoFlow Privacy Team, 123 Martial Arts Way, Suite 100, San Francisco, CA 94105</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
