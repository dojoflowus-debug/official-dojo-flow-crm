import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: December 28, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Use ("Terms") constitute a legally binding agreement between you and DojoFlow ("Company," "we," "our," or "us") governing your access to and use of the DojoFlow platform, including our website, mobile applications, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years old to create an account and use the Service. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Account Registration and Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information to keep it accurate</li>
              <li>Maintain the security of your password and accept responsibility for all activities under your account</li>
              <li>Immediately notify us of any unauthorized access or security breach</li>
              <li>Not share your account credentials with others or allow others to access your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms or are used for fraudulent or illegal activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Subscription Plans and Billing</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Subscription Tiers</h3>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow offers multiple subscription plans (Starter, Growth, Pro, Enterprise) with varying features, student limits, and AI credit allowances. Current pricing and plan details are available on our Pricing page.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Billing and Payment</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Subscriptions are billed monthly or annually based on your selected plan</li>
              <li>Payment is due at the beginning of each billing cycle</li>
              <li>All payments are processed securely through Stripe</li>
              <li>You authorize us to charge your payment method for all fees incurred</li>
              <li>Prices are subject to change with 30 days' notice</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">AI Credits</h3>
            <p className="text-muted-foreground leading-relaxed">
              Each subscription plan includes a monthly allowance of AI credits used for Kai assistant interactions, SMS notifications, emails, and phone calls. Credits reset monthly and do not roll over. Additional credits can be purchased as needed.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Cancellation and Refunds</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You may cancel your subscription at any time from your account settings</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>No refunds are provided for partial months or unused AI credits</li>
              <li>Upon cancellation, you will retain access to the Service until the end of your paid period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Transmit harmful, offensive, or illegal content</li>
              <li>Impersonate others or misrepresent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service or other systems</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or modify any proprietary notices or labels</li>
              <li>Use the Service to compete with us or develop competing products</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Our Intellectual Property</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including all content, features, functionality, software, and design, is owned by DojoFlow and protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for your internal business purposes only.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of all data, information, and content you submit to the Service ("Your Content"). By submitting Your Content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, process, and display Your Content solely to provide and improve the Service. We will not share Your Content with third parties except as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">AI Assistant (Kai) Usage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kai is an AI-powered assistant designed to help manage your martial arts school. While Kai strives for accuracy, AI-generated responses may contain errors or inaccuracies. You are responsible for reviewing and verifying all information provided by Kai before taking action. We are not liable for decisions made based on Kai's recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Privacy and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We implement industry-standard security measures to protect your data, but we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of sensitive information stored in your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service may integrate with third-party services (e.g., payment processors, communication providers). Your use of these third-party services is subject to their respective terms and conditions. We are not responsible for the availability, accuracy, or content of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Service Availability</h3>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE RESERVE THE RIGHT TO MODIFY, SUSPEND, OR DISCONTINUE THE SERVICE AT ANY TIME WITHOUT NOTICE.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Limitation of Liability</h3>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DOJOFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless DojoFlow and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or related to: (a) your use of the Service, (b) your violation of these Terms, (c) your violation of any third-party rights, or (d) Your Content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your access to the Service immediately, without prior notice, for any reason, including violation of these Terms. Upon termination, your right to use the Service will cease immediately. You may terminate your account at any time by contacting us. Provisions that by their nature should survive termination (including intellectual property rights, disclaimers, and limitation of liability) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Governing Law</h3>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Arbitration</h3>
            <p className="text-muted-foreground leading-relaxed">
              Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. Arbitration will take place in San Francisco, California. You waive your right to participate in class action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Miscellaneous</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and DojoFlow</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions will remain in effect</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right or provision does not constitute a waiver</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our consent; we may assign them freely</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>Email:</strong> <a href="mailto:legal@dojoflow.com" className="text-primary hover:underline">legal@dojoflow.com</a></p>
              <p className="text-muted-foreground mt-2"><strong>Address:</strong> DojoFlow Legal Team, 123 Martial Arts Way, Suite 100, San Francisco, CA 94105</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
