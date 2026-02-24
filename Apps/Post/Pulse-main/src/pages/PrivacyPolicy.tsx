import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import pulseLogo from "@/assets/pulse-logo.png";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/landing" className="flex items-center gap-2.5">
            <img src={pulseLogo} alt="Pulse Posting" className="h-9" />
          </Link>
          <Link to="/landing" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: February 20, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_ul]:space-y-1 [&_ol]:space-y-1">

          <h2>1. Introduction</h2>
          <p>Lotly Automotive Solutions LLC ("Company," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Pulse: Post platform ("Service"). This policy applies to all users, including dealership administrators ("Admins") and staff members ("Staff").</p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-6">
            <li><strong>Account Information:</strong> Full name, email address, password, and phone number provided during registration</li>
            <li><strong>Dealership Information:</strong> Business name, address, phone number, website URL, logo, and DBA (doing business as) name</li>
            <li><strong>Vehicle Data:</strong> VINs, make, model, year, trim, mileage, pricing, exterior color, vehicle images, and listing descriptions</li>
            <li><strong>Staff Information:</strong> Names, email addresses, phone numbers, Facebook account identifiers, and roles of staff members added by Admins</li>
            <li><strong>Lead Data:</strong> Names, email addresses, phone numbers, and messages from prospective buyers captured through marketplace inquiries</li>
            <li><strong>Payment Information:</strong> Billing details processed through our third-party payment processor (we do not store full payment card numbers)</li>
            <li><strong>DMS Credentials:</strong> SFTP usernames and connection details for dealer management system integrations</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6">
            <li><strong>Usage Data:</strong> Pages visited, features used, actions taken (posts created, leads managed, vehicles listed), timestamps, and session duration</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, IP address, and screen resolution</li>
            <li><strong>Performance Data:</strong> Vehicle listing performance metrics including click counts, days live, renewal dates, and engagement statistics</li>
            <li><strong>Log Data:</strong> Ingestion logs, sync history, error logs, and API interaction records</li>
            <li><strong>Cookies & Similar Technologies:</strong> Session cookies for authentication, preference cookies, and analytics tracking</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul className="list-disc pl-6">
            <li><strong>Facebook Marketplace:</strong> Lead information, listing performance data, and post identifiers</li>
            <li><strong>DMS Providers:</strong> Vehicle inventory data, pricing updates, and sold status information synced from your dealer management system</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-6">
            <li><strong>Service Delivery:</strong> Creating and managing vehicle listings, generating AI descriptions, processing images, syncing inventory, and managing leads</li>
            <li><strong>Account Management:</strong> Managing user accounts, dealership profiles, staff invitations, role assignments, and authentication</li>
            <li><strong>Communication:</strong> Sending sold alerts, price drop notifications, lead notifications, system updates, and support responses</li>
            <li><strong>Analytics & Improvement:</strong> Tracking usage patterns, posting activity, staff performance metrics, and feature adoption to improve the Service</li>
            <li><strong>AI Processing:</strong> Using vehicle data to generate optimized listing descriptions, sort images, and provide compliance checks</li>
            <li><strong>Security:</strong> Detecting and preventing fraud, unauthorized access, and abuse of the Service</li>
            <li><strong>Legal Compliance:</strong> Meeting regulatory requirements, responding to legal requests, and enforcing our Terms of Service</li>
          </ul>

          <h2>4. How We Share Your Information</h2>
          <h3>4.1 Within Your Dealership</h3>
          <p>Admins can view activity and data associated with all Staff members within their dealership, including posting statistics, lead assignments, and vehicle management actions. Staff members can only view data relevant to their assigned duties.</p>
          <h3>4.2 Third-Party Service Providers</h3>
          <p>We share information with trusted third-party providers who assist us in operating the Service:</p>
          <ul className="list-disc pl-6">
            <li><strong>Cloud Infrastructure:</strong> Hosting, database management, and content delivery</li>
            <li><strong>AI Providers:</strong> Vehicle description generation and image analysis (vehicle data only, no personal information)</li>
            <li><strong>Payment Processors:</strong> Subscription billing and payment processing</li>
            <li><strong>Analytics Providers:</strong> Usage analytics and performance monitoring</li>
            <li><strong>Communication Services:</strong> Email delivery and notification services</li>
          </ul>
          <h3>4.3 Facebook Marketplace</h3>
          <p>When you post vehicle listings, we transmit vehicle data (images, descriptions, pricing, specifications) to Facebook Marketplace according to their API requirements. This data becomes subject to Facebook's privacy practices.</p>
          <h3>4.4 Legal Requirements</h3>
          <p>We may disclose your information when required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</p>
          <h3>4.5 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change via email or prominent notice on the Service.</p>

          <h2>5. Data Retention</h2>
          <ul className="list-disc pl-6">
            <li><strong>Account Data:</strong> Retained for as long as your account is active, plus 90 days after account closure</li>
            <li><strong>Vehicle Listings:</strong> Retained for 12 months after a vehicle is marked as sold or removed</li>
            <li><strong>Lead Data:</strong> Retained for 24 months from the date of capture</li>
            <li><strong>Usage Logs:</strong> Retained for 12 months</li>
            <li><strong>Payment Records:</strong> Retained for 7 years as required by tax and accounting regulations</li>
            <li><strong>Invitation Links:</strong> Expired or used invitation tokens are retained for 90 days for audit purposes</li>
          </ul>
          <p>You may request deletion of your data at any time by contacting us at privacy@pulseposting.com.</p>

          <h2>6. Data Security</h2>
          <p>We implement industry-standard security measures to protect your information:</p>
          <ul className="list-disc pl-6">
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>Row-level security (RLS) policies ensuring multi-tenant data isolation</li>
            <li>Role-based access control separating Admin and Staff permissions</li>
            <li>Secure password hashing and token-based authentication</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>DMS credentials are stored using one-way hashing (SFTP passwords are never stored in plaintext)</li>
          </ul>
          <p>While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</p>

          <h2>7. Your Rights & Choices</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc pl-6">
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
            <li><strong>Portability:</strong> Request a machine-readable copy of your data</li>
            <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
            <li><strong>Withdrawal of Consent:</strong> Withdraw previously given consent at any time</li>
            <li><strong>Opt-Out of Communications:</strong> Unsubscribe from non-essential emails and notifications</li>
          </ul>
          <p>To exercise any of these rights, contact us at privacy@pulseposting.com. We will respond within 30 days.</p>

          <h2>8. California Privacy Rights (CCPA/CPRA)</h2>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
          <ul className="list-disc pl-6">
            <li>Right to know what personal information is collected, used, and shared</li>
            <li>Right to delete personal information (with certain exceptions)</li>
            <li>Right to opt out of the sale or sharing of personal information</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
            <li>Right to correct inaccurate personal information</li>
            <li>Right to limit use of sensitive personal information</li>
          </ul>
          <p>We do not sell personal information. To submit a CCPA request, contact us at privacy@pulseposting.com or call our toll-free number.</p>

          <h2>9. Children's Privacy</h2>
          <p>The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we discover that we have collected information from a child under 18, we will promptly delete it.</p>

          <h2>10. International Data Transfers</h2>
          <p>Your data is primarily stored and processed in the United States. If you access the Service from outside the United States, your information may be transferred to and processed in the United States, where data protection laws may differ from your jurisdiction. By using the Service, you consent to this transfer.</p>

          <h2>11. Cookies & Tracking Technologies</h2>
          <p>We use the following types of cookies:</p>
          <ul className="list-disc pl-6">
            <li><strong>Essential Cookies:</strong> Required for authentication, session management, and core Service functionality</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Service</li>
          </ul>
          <p>You can manage cookie preferences through your browser settings. Disabling essential cookies may impair Service functionality.</p>

          <h2>12. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or through the Service with at least 30 days' notice. Your continued use after the effective date constitutes acceptance of the updated policy.</p>

          <h2>13. Contact Us</h2>
          <p>For questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:</p>
          <p>Lotly Automotive Solutions LLC<br />Privacy Team<br />Email: privacy@pulseposting.com<br />Address: 430 E 8th St #5157, Holland, MI 49423</p>
        </div>
      </main>
    </div>
  );
}
