import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, CalendarClock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export const TermsPage: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const contactEmail = 'devstudio@mite.ac.in'

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center p-4 py-12 md:py-16">
      <Helmet>
        <title>Terms & Conditions | DevStudio</title>
        <meta name="description" content="Terms and Conditions for DevStudio members." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/terms" />
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
            <FileText className="w-4 h-4 text-accent-teal" />
            <span>Legal & Trust</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-sans tracking-tight text-text-primary mb-4">Terms & Conditions</h1>
          <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
            <CalendarClock className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>

        <Card className="border-border-default bg-[#0A0F1D] shadow-2xl relative overflow-hidden rounded-3xl">
          <CardContent className="pt-8 sm:p-10 space-y-8 font-sans">
            <p className="text-sm md:text-base text-text-muted leading-relaxed font-medium">
              Welcome to DevStudio, the official technology club platform of Mangalore Institute of Technology & Engineering (MITE). By creating an account or using this platform, you agree to these Terms & Conditions.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">1. Eligibility</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                DevStudio membership and access to this platform are limited to individuals with a valid <strong className="text-white">@mite.ac.in</strong> institutional email address, or others explicitly approved by a DevStudio Admin.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">2. Your Account</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li>You are responsible for keeping your account credentials secure.</li>
                <li>Your Digital ID (including its QR code) is personal to you and must not be shared, transferred, or used to impersonate another member.</li>
                <li>You must provide accurate information when applying for membership, including your name and profile photo.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">3. Membership Status</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li>Membership applications are reviewed and approved or rejected by Admins and Organizers.</li>
                <li>Admins may promote, demote, or remove members, and may suspend or revoke membership for violations of these Terms or the club's code of conduct.</li>
                <li>Attendance at DevStudio events and sessions is recorded manually by Organizers.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">4. Acceptable Use</h2>
              <p className="text-sm text-text-muted">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                <li>Use the platform for any unlawful purpose or in violation of MITE's policies.</li>
                <li>Attempt to forge, duplicate, or tamper with another member's Digital ID or QR code.</li>
                <li>Attempt to gain unauthorized access to accounts, data, or systems within the platform.</li>
                <li>Upload profile photos or content that is offensive, harassing, or violates others' rights.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">5. Content and Projects</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Any projects, resources, or content you submit through the platform (e.g. for Challenges, Projects, or Resources) remain your intellectual property unless otherwise agreed, but you grant DevStudio a license to display and share them within the club and MITE community for club-related purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">6. Suspension & Termination</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Admins may suspend or terminate a member's access for violating these Terms, the club's code of conduct, or MITE's institutional policies. You may request account/membership deletion at any time (see our Privacy Policy for how to do this).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">7. Disclaimer</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                This platform is provided "as is" by student club organizers on a best-effort basis. DevStudio and its Admins are not liable for any loss or damage arising from use of the platform, to the fullest extent permitted by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">8. Changes to These Terms</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider font-mono border-b border-border-default/50 pb-2">9. Contact</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Questions about these Terms can be directed to <a href={`mailto:${contactEmail}`} className="text-accent-teal hover:underline font-bold">{contactEmail}</a>.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
