import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using syntrixlabs.in and the Syntrix Labs client dashboard.",
  alternates: { canonical: "https://syntrixlabs.in/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="1 October 2026">
      <section>
        <p>
          These terms apply to your use of syntrixlabs.in and the Syntrix Labs client dashboard. By creating an account or signing in,
          you agree to them. The specific scope, price, timeline and ownership terms of any project are set out in the separate
          agreement or proposal we sign with you; if that agreement conflicts with these terms, the agreement wins.
        </p>
      </section>

      <section>
        <h2>1. Your account</h2>
        <ul>
          <li>Give accurate details and keep your login (or your Google, GitHub or LinkedIn account) secure.</li>
          <li>You are responsible for activity under your account. Tell us promptly if you suspect unauthorised access.</li>
        </ul>
      </section>

      <section>
        <h2>2. Using the service</h2>
        <p>Don&apos;t use Syntrix to upload unlawful or infringing content, attempt to break or overload the service, or access data that isn&apos;t yours.</p>
      </section>

      <section>
        <h2>3. Projects and payments</h2>
        <p>
          Deliverables, milestones, fees and payment schedules are defined in your project agreement. Invoices shown in your dashboard are
          payable as agreed there.
        </p>
      </section>

      <section>
        <h2>4. Content and ownership</h2>
        <p>
          You keep ownership of the material you give us. Ownership of the work we build for you transfers as described in your project
          agreement. You give us permission to use your material only to deliver your project.
        </p>
      </section>

      <section>
        <h2>5. Availability and liability</h2>
        <p>
          We work hard to keep the service running but provide it &quot;as is&quot; without guarantees of uninterrupted availability. To the extent
          allowed by law, our total liability for any claim relating to the dashboard is limited to the fees you paid us in the three months before
          the claim.
        </p>
      </section>

      <section>
        <h2>6. Ending your account</h2>
        <p>You can ask us to close your account at any time. We may suspend accounts that break these terms.</p>
      </section>

      <section>
        <h2>7. Law</h2>
        <p>These terms are governed by the laws of India.</p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · See also our <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>
    </LegalPage>
  );
}
