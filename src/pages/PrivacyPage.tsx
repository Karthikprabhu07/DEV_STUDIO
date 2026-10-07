import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, CalendarClock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export const PrivacyPage: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const contactEmail = 'devstudio@mite.ac.in'

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center p-4 py-12 md:py-16">
      <Helmet>
        <title>Privacy Policy | DevStudio</title>
        <meta name="description" content="Privacy Policy and Data Protection at DevStudio." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/privacy" />
      </Helmet>

      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2 text-xs font-sans font-bold text-text-muted hover:text-text-primary hover:bg-bg-surface min-h-[44px] px-4 rounded-xl transition-all cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A0F1D] border border-border-default text-xs font-mono font-bold uppercase tracking-wider text-accent-teal mb-4 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-accent-teal" />
            <span>Legal & Trust</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-sans tracking-tight text-text-primary mb-4">Privacy Policy</h1>
          <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
            <CalendarClock className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>

        <Card className="border-border-default bg-[#0A0F1D] shadow-2xl relative overflow-hidden rounded-3xl">
          <CardContent className="pt-8 sm:p-10 space-y-8 font-sans">
            <p className="text-sm md:text-base text-text-muted leading-relaxed font-medium">
              This Privacy Policy explains what information DevStudio collects, how it is used, and your rights regarding that information.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">1. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li><strong className="text-white">Account information:</strong> your name, institutional email address (@mite.ac.in), and role/membership status.</li>
                <li><strong className="text-white">Digital ID data:</strong> a unique DevStudio ID and QR code used to verify your identity. The QR links to a public verification page.</li>
                <li><strong className="text-white">Profile photo:</strong> submitted by you and reviewed before being shown on your Digital ID and profile.</li>
                <li><strong className="text-white">Attendance records:</strong> timestamps and event details recorded by an Organizer when they mark attendance.</li>
                <li><strong className="text-white">GitHub data:</strong> if you link your GitHub account, we pull public repository stats and contribution activity to display on your profile.</li>
                <li><strong className="text-white">Usage data:</strong> basic technical data (e.g. browser local storage) used to keep the app working on your device; this is not shared with other members or third parties.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">2. How We Use Your Information</h2>
              <p className="text-sm text-text-muted">We use this information to:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li>Verify your membership and eligibility.</li>
                <li>Operate the Digital ID and attendance-tracking features.</li>
                <li>Manage club roles, applications, and internal administration (visible to Admins and Organizers).</li>
                <li>Maintain an internal audit log of administrative actions (e.g. approvals, role changes) for accountability.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">3. Who Can See Your Information</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Your name, role, and status are visible to Admins and Organizers for club administration.<br />
                We do not sell your data or share it with third parties outside of MITE/DevStudio administration, except where required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">4. Data Processors</h2>
              <p className="text-sm text-text-muted">We use the following third-party services to operate the platform:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li><strong className="text-white">Supabase</strong> — authentication, database, and file storage.</li>
                <li><strong className="text-white">Vercel</strong> — hosting and deployment.</li>
                <li><strong className="text-white">GitHub</strong> — public repository data, only if you connect your account.</li>
              </ul>
              <div className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/30 text-xs text-text-muted font-sans font-medium flex items-start gap-3 shadow-sm mt-4">
                <ShieldCheck className="w-5 h-5 text-accent-teal flex-shrink-0" />
                <div className="leading-relaxed">
                  Note: Clerk has been fully removed from this application. Authentication is handled natively by Supabase Auth.
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">5. Data Storage & Security</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Your data is stored in a managed cloud database with access controls restricting who can view or modify it. We take reasonable technical measures to protect your data, but no system is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">6. Your Rights</h2>
              <p className="text-sm text-text-muted mb-2">Under India's Digital Personal Data Protection Act (DPDP Act, 2023), you can:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li>Request a copy of the personal data we hold about you.</li>
                <li>Request correction of inaccurate information.</li>
                <li>Request deletion of your account and associated data, subject to records DevStudio needs to retain for legitimate administrative purposes (e.g. audit logs).</li>
              </ul>
              <p className="text-sm text-text-muted mt-2">
                To exercise these rights, contact <a href={`mailto:${contactEmail}`} className="text-accent-teal hover:underline">{contactEmail}</a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">7. Data Retention</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                We retain your data for as long as you are an active or alumni member, or as needed for legitimate club administration, after which it may be deleted or anonymized.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">8. Children's Privacy</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                This platform is intended for college students and is not directed at children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">9. Changes to This Policy</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                We may update this Privacy Policy from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">10. Contact / Grievance Officer</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Questions or grievance requests regarding this Privacy Policy can be directed to <a href={`mailto:${contactEmail}`} className="text-accent-teal hover:underline font-bold">{contactEmail}</a>.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
