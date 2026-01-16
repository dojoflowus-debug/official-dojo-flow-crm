import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function DMCAPolicy() {
  return (
    <div className="min-h-full bg-background">
      <div className="container max-w-4xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">DMCA Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: December 28, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Digital Millennium Copyright Act Notice</h2>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly to claims of copyright infringement committed using our Service. This DMCA Policy outlines the procedures for reporting copyright infringement and our process for addressing such claims.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Reporting Copyright Infringement</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible through our Service, you may notify our designated DMCA agent by providing the following information in writing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Identification of the copyrighted work:</strong> A description of the copyrighted work that you claim has been infringed, or if multiple copyrighted works are covered by a single notification, a representative list of such works</li>
              <li><strong>Identification of the infringing material:</strong> A description of where the material that you claim is infringing is located on our Service, with sufficient detail that we can locate it (e.g., URL, account name, specific page)</li>
              <li><strong>Contact information:</strong> Your name, address, telephone number, and email address</li>
              <li><strong>Statement of good faith belief:</strong> A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law</li>
              <li><strong>Statement of accuracy:</strong> A statement, made under penalty of perjury, that the information in your notification is accurate and that you are the copyright owner or authorized to act on behalf of the copyright owner</li>
              <li><strong>Physical or electronic signature:</strong> Your physical or electronic signature (typing your full legal name is sufficient)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">DMCA Agent Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Please send your DMCA takedown notice to our designated agent:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>DMCA Agent:</strong> DojoFlow Legal Team</p>
              <p className="text-muted-foreground mt-2"><strong>Email:</strong> <a href="mailto:dmca@dojoflow.com" className="text-primary hover:underline">dmca@dojoflow.com</a></p>
              <p className="text-muted-foreground mt-2"><strong>Mailing Address:</strong><br />
              DojoFlow DMCA Agent<br />
              123 Martial Arts Way, Suite 100<br />
              San Francisco, CA 94105<br />
              United States</p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please note that notices sent to any other email address or physical address will not be processed. For the fastest response, we recommend sending your notice via email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Response to DMCA Notices</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Upon receipt of a valid DMCA notice that complies with the requirements above, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Promptly investigate the claim and remove or disable access to the allegedly infringing material</li>
              <li>Notify the user who posted the material that we have removed or disabled access to it</li>
              <li>Provide the user with a copy of the DMCA notice (including your contact information)</li>
              <li>Inform the user of their right to file a counter-notification</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to terminate the accounts of users who are repeat infringers of copyright.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Filing a Counter-Notification</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you believe that material you posted was removed or disabled by mistake or misidentification, you may file a counter-notification with our DMCA agent. Your counter-notification must include the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Identification of the material:</strong> A description of the material that was removed or disabled and the location where it appeared before removal</li>
              <li><strong>Statement under penalty of perjury:</strong> A statement, made under penalty of perjury, that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
              <li><strong>Consent to jurisdiction:</strong> A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or the Northern District of California if your address is outside the United States), and that you will accept service of process from the person who provided the original DMCA notification or their agent</li>
              <li><strong>Contact information:</strong> Your name, address, telephone number, and email address</li>
              <li><strong>Physical or electronic signature:</strong> Your physical or electronic signature</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Send your counter-notification to our DMCA agent at the address listed above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Response to Counter-Notifications</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Upon receipt of a valid counter-notification, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Forward a copy of the counter-notification to the original complainant</li>
              <li>Inform the complainant that we will restore the removed material or cease disabling access to it in 10-14 business days</li>
              <li>Restore the material or cease disabling access to it in 10-14 business days, unless our DMCA agent first receives notice that the complainant has filed a court action seeking to restrain the user from engaging in infringing activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Repeat Infringer Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow has adopted a policy of terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat infringers. We may also, at our sole discretion, limit access to the Service and/or terminate the accounts of any users who infringe the intellectual property rights of others, whether or not there is any repeat infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Misrepresentations and Penalties</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing, or that material or activity was removed or disabled by mistake or misidentification, may be subject to liability. This means that if you submit a DMCA notice or counter-notification in bad faith or with false information, you could be held legally responsible for damages, including costs and attorney's fees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              DojoFlow provides a platform for martial arts schools to manage their operations, including storing student information, scheduling, and communications. While users may upload content to the Service (such as student photos, documents, or training materials), we do not actively monitor user-generated content for copyright infringement. We rely on copyright owners to notify us of alleged infringements in accordance with the DMCA procedures outlined above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Please note the following limitations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>This DMCA Policy applies only to copyright infringement claims. For other intellectual property concerns (trademarks, patents, trade secrets), please contact us separately</li>
              <li>We cannot provide legal advice regarding copyright law or DMCA procedures. If you are unsure whether material infringes your copyright, we recommend consulting with an attorney</li>
              <li>DMCA notices and counter-notifications are legal documents. False claims may result in legal liability</li>
              <li>We reserve the right to modify this policy at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Other Intellectual Property Concerns</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe that content on our Service infringes your intellectual property rights other than copyright (such as trademarks, patents, or trade secrets), please contact us at <a href="mailto:legal@dojoflow.com" className="text-primary hover:underline">legal@dojoflow.com</a> with detailed information about your claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For more information about the DMCA and copyright law, you may find the following resources helpful:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><a href="https://www.copyright.gov/legislation/dmca.pdf" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Full text of the DMCA (U.S. Copyright Office)</a></li>
              <li><a href="https://www.copyright.gov/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">U.S. Copyright Office</a></li>
              <li><a href="https://www.copyright.gov/dmca-directory/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">DMCA Designated Agent Directory</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this DMCA Policy or copyright-related matters, please contact:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>Email:</strong> <a href="mailto:dmca@dojoflow.com" className="text-primary hover:underline">dmca@dojoflow.com</a></p>
              <p className="text-muted-foreground mt-2"><strong>Legal Inquiries:</strong> <a href="mailto:legal@dojoflow.com" className="text-primary hover:underline">legal@dojoflow.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
