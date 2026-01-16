import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-full bg-background">
      <div className="container max-w-4xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: December 28, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and provide information to website owners. Cookies allow websites to remember your actions and preferences over time, so you don't have to re-enter information each time you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How DojoFlow Uses Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              DojoFlow uses cookies and similar tracking technologies to provide, secure, and improve our Service. We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Authentication:</strong> To keep you logged in and verify your identity across sessions</li>
              <li><strong>Security:</strong> To detect and prevent fraudulent activity and security threats</li>
              <li><strong>Preferences:</strong> To remember your settings, language preferences, and customization choices</li>
              <li><strong>Analytics:</strong> To understand how users interact with our Service and identify areas for improvement</li>
              <li><strong>Performance:</strong> To monitor Service performance and optimize loading times</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>

            <h3 className="text-xl font-medium mb-3 mt-6">Essential Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These cookies are strictly necessary for the Service to function and cannot be disabled. They enable core functionality such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Session Management:</strong> Maintains your login session and authentication state</li>
              <li><strong>Security Tokens:</strong> Protects against cross-site request forgery (CSRF) attacks</li>
              <li><strong>Load Balancing:</strong> Ensures requests are routed to the correct server</li>
            </ul>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground"><strong>Cookie Name:</strong> dojoflow_session</p>
              <p className="text-sm text-muted-foreground"><strong>Purpose:</strong> Authentication and session management</p>
              <p className="text-sm text-muted-foreground"><strong>Duration:</strong> 30 days</p>
              <p className="text-sm text-muted-foreground"><strong>Type:</strong> HTTP-only, Secure</p>
            </div>

            <h3 className="text-xl font-medium mb-3 mt-6">Analytics Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These cookies help us understand how visitors use our Service by collecting anonymous information about page visits, user flows, and feature usage. We use this data to improve the Service and user experience.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground"><strong>Cookie Name:</strong> _ga, _gid</p>
              <p className="text-sm text-muted-foreground"><strong>Purpose:</strong> Google Analytics tracking</p>
              <p className="text-sm text-muted-foreground"><strong>Duration:</strong> 2 years (_ga), 24 hours (_gid)</p>
              <p className="text-sm text-muted-foreground"><strong>Type:</strong> Third-party</p>
            </div>

            <h3 className="text-xl font-medium mb-3 mt-6">Preference Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These cookies remember your preferences and settings to provide a personalized experience, such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Language and region preferences</li>
              <li>Theme selection (light/dark mode)</li>
              <li>Dashboard layout customizations</li>
              <li>Notification preferences</li>
            </ul>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground"><strong>Cookie Name:</strong> dojoflow_prefs</p>
              <p className="text-sm text-muted-foreground"><strong>Purpose:</strong> Store user preferences</p>
              <p className="text-sm text-muted-foreground"><strong>Duration:</strong> 1 year</p>
              <p className="text-sm text-muted-foreground"><strong>Type:</strong> First-party</p>
            </div>

            <h3 className="text-xl font-medium mb-3 mt-6">Performance Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              These cookies collect information about how the Service performs, including page load times, error messages, and server response times. This helps us identify and fix technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use trusted third-party services that may set their own cookies when you use our Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Stripe:</strong> Payment processing and fraud prevention (essential for billing)</li>
              <li><strong>Google Analytics:</strong> Website traffic analysis and user behavior insights</li>
              <li><strong>Cloud Infrastructure Providers:</strong> Content delivery and performance optimization</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These third parties have their own privacy policies and cookie practices. We recommend reviewing their policies to understand how they use cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How Long Do Cookies Last?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Cookies can be either session cookies or persistent cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser. Used for essential functions like maintaining your login session.</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a specified period (from days to years) and are activated each time you visit our Service. Used for preferences and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Your Cookie Preferences</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Browser Settings</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>View and delete existing cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (not recommended, as this will prevent you from using the Service)</li>
              <li>Clear cookies when you close your browser</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please note that blocking essential cookies will prevent you from logging in and using core features of the Service.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Browser-Specific Instructions</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Opt-Out of Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">
              To opt out of Google Analytics tracking across all websites, you can install the <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Do Not Track Signals</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some browsers offer a "Do Not Track" (DNT) signal that requests websites not to track your browsing activity. Currently, there is no industry standard for how websites should respond to DNT signals. DojoFlow does not currently respond to DNT signals, but we are committed to respecting your privacy choices and will update our practices as standards evolve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Cookie Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices, technologies, or legal requirements. We will notify you of material changes by posting the updated policy on our website and updating the "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">More Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For more information about how we collect, use, and protect your personal information, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
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
