import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Syntrix Labs collects, uses, and protects your information.",
  alternates: { canonical: "https://syntrixlabs.in/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="1 October 2026">
      <section>
        <p>
          Syntrix Labs (&quot;Syntrix&quot;, &quot;we&quot;, &quot;us&quot;) builds websites, apps and business platforms for clients.
          This policy explains what information we collect when you use syntrixlabs.in and our client dashboard, how we use it,
          and the choices you have.
        </p>
      </section>

      <section>
        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Account details</strong> — your name, email address and password (stored only as a secure hash). Optionally your phone number and company.</li>
          <li>
            <strong>Social sign-in</strong> — if you choose &quot;Continue with Google&quot;, GitHub or LinkedIn, we receive only your
            <strong> name and email address</strong> from that provider. We do not access your contacts, files, posts or any other data.
          </li>
          <li><strong>Project information</strong> — documents you upload, consultation messages, meeting requests, project details and related notes.</li>
          <li><strong>Payment records</strong> — invoice amounts and payment status. Card and bank details are handled by our payment processor; we never store them.</li>
          <li><strong>Technical data</strong> — a sign-in token stored in your browser to keep you logged in, and basic server logs used for security and troubleshooting.</li>
        </ul>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <ul>
          <li>To create and secure your account and let you sign in.</li>
          <li>To deliver your project — track progress, share documents, schedule meetings and handle payments.</li>
          <li>To send service emails such as password resets, account notices and project updates.</li>
          <li>To keep the service safe, prevent abuse and fix problems.</li>
        </ul>
        <p className="mt-3">We do <strong>not</strong> sell your personal information or use it for third-party advertising.</p>
      </section>

      <section>
        <h2>3. Google user data</h2>
        <p>
          Syntrix Labs&apos; use and transfer of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We request only the basic profile scopes (name and email) and use them solely to sign you in
          to your Syntrix account.
        </p>
      </section>

      <section>
        <h2>4. Who we share it with</h2>
        <p>We share information only with service providers that help us run Syntrix, and only as needed:</p>
        <ul className="mt-2">
          <li>Hosting and infrastructure (Vercel, Render) and our database provider.</li>
          <li>Email delivery (Resend) for service emails.</li>
          <li>File storage for documents you upload.</li>
          <li>Our payment processor for invoices and payments.</li>
          <li>Authorities, if required by law.</li>
        </ul>
      </section>

      <section>
        <h2>5. How long we keep it</h2>
        <p>
          We keep your information while your account is active and for as long as needed to deliver your project and meet legal or
          accounting obligations. You can ask us to delete your account and associated data at any time.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          Passwords are hashed, connections use HTTPS, and access to client data is restricted by role. No system is perfectly secure,
          but we work to protect your information and will notify you of any breach that affects you as required by law.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          You can access, correct or delete your personal information, or withdraw consent, by emailing us. You can also revoke Syntrix&apos;s
          access to your Google, GitHub or LinkedIn account at any time from that provider&apos;s security settings.
        </p>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>Syntrix is a service for businesses and is not intended for children under 18.</p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>We may update this policy. We&apos;ll change the &quot;Last updated&quot; date above and, for significant changes, let account holders know.</p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </LegalPage>
  );
}
