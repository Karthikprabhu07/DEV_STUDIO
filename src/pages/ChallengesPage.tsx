import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Trophy,
  Plus,
  ExternalLink,
  Clock,
  Medal,
  Award,
  X,
  Send,
} from 'lucide-react'

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { Challenge, ChallengeSubmission, SubmissionStatus } from '@/types'

export const ChallengesPage: React.FC = () => {
  const { profile, isActiveMember, isStaff } = useAuth()
  const {
    challenges,
    submissions,
    createChallenge,
    submitChallenge,
    gradeSubmission,
  } = useCommunity()

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)

  // Announce Challenge Modal (Staff)
  const [isNewChallengeOpen, setIsNewChallengeOpen] = useState(false)
  const [challengeTitle, setChallengeTitle] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')
  const [challengeReqs, setChallengeReqs] = useState('')
  const [challengeBounty, setChallengeBounty] = useState('')
  const [challengeStart, setChallengeStart] = useState('')
  const [challengeEnd, setChallengeEnd] = useState('')
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false)
  const [challengeError, setChallengeError] = useState<string | null>(null)

  // Submit Entry Modal (Member)
  const [isSubmitEntryOpen, setIsSubmitEntryOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [writeup, setWriteup] = useState('')
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)

  // Grading Modal (Staff)
  const [gradingSubmission, setGradingSubmission] = useState<ChallengeSubmission | null>(null)
  const [gradeScore, setGradeScore] = useState<number>(85)
  const [gradeRank, setGradeRank] = useState<number>(1)
  const [gradeStatus, setGradeStatus] = useState<SubmissionStatus>('awarded')

  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === 'all') return true
    return c.status === activeTab
  })

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeTitle.trim() || !challengeDesc.trim() || !challengeReqs.trim()) {
      setChallengeError('Title, description, and requirements are required.')
      return
    }

    setIsSubmittingChallenge(true)
    setChallengeError(null)

    const now = new Date()
    const startDate = challengeStart ? new Date(challengeStart).toISOString() : now.toISOString()
    const endDate = challengeEnd
      ? new Date(challengeEnd).toISOString()
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const res = await createChallenge({
      title: challengeTitle.trim(),
      description: challengeDesc.trim(),
      requirements: challengeReqs.trim(),
      bounty_or_prize: challengeBounty.trim() || undefined,
      start_time: startDate,
      end_time: endDate,
    })

    setIsSubmittingChallenge(false)
    if (res.success && res.challenge) {
      setIsNewChallengeOpen(false)
      setChallengeTitle('')
      setChallengeDesc('')
      setChallengeReqs('')
      setChallengeBounty('')
      setSelectedChallenge(res.challenge)
    } else {
      setChallengeError(res.error || 'Failed to create challenge.')
    }
  }

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChallenge) return
    if (!teamName.trim() || !githubUrl.trim() || !writeup.trim()) {
      setEntryError('Team name, GitHub repo URL, and writeup are required.')
      return
    }

    setIsSubmittingEntry(true)
    setEntryError(null)

    const res = await submitChallenge(selectedChallenge.id, {
      team_name: teamName.trim(),
      github_url: githubUrl.trim(),
      demo_url: demoUrl.trim() || undefined,
      writeup: writeup.trim(),
    })

    setIsSubmittingEntry(false)
    if (res.success) {
      setIsSubmitEntryOpen(false)
      setTeamName('')
      setGithubUrl('')
      setDemoUrl('')
      setWriteup('')
    } else {
      setEntryError(res.error || 'Failed to submit project.')
    }
  }

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingSubmission) return

    await gradeSubmission(gradingSubmission.id, gradeScore, gradeRank, gradeStatus)
    setGradingSubmission(null)
  }

  const challengeSubmissions = selectedChallenge
    ? submissions
        .filter((s) => s.challenge_id === selectedChallenge.id)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
    : []

  const userSubmitted = selectedChallenge
    ? submissions.some((s) => s.challenge_id === selectedChallenge.id && s.user_id === profile?.id)
    : false

  return (
    <div className="space-y-6 pb-12">
      <Helmet>
        <title>Challenges | DevStudio</title>
        <meta name="description" content="Participate in coding challenges and level up your skills." />
        <link rel="canonical" href="https://devstudio.mite.ac.in/challenges" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40 text-[11px] font-mono text-amber-400 mb-2">
            <Trophy className="w-3 h-3" />
            <span>Competitive Sprints & Hackathons</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Build Challenges
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Competitive software sprints, vibe-coding bounties, and technical hackathons.
          </p>
        </div>

        {isStaff && (
          <Button
            id="new-challenge-btn"
            onClick={() => setIsNewChallengeOpen(true)}
            size="sm"
            variant="default"
            className="gap-2 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Challenge</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-lg border border-border-default self-start">
        {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-all ${
              activeTab === tab
                ? 'bg-bg-page text-accent-primary border border-border-default shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Challenges List / Empty State */}
      {filteredChallenges.length === 0 ? (
        <Card className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-2xl">
          <CardContent className="pt-12 pb-12">
            <EmptyState
              icon={Trophy}
              title={
                activeTab !== 'all' ? `No ${activeTab} Challenges` : 'No Active Challenges'
              }
              description={
                activeTab !== 'all'
                  ? `No build sprints currently match the "${activeTab}" filter status.`
                  : 'Build challenges will appear here once announced by Dev Directors or Captains. Submissions and live leaderboards will be available for all active participants.'
              }
              actionLabel={
                isStaff && activeTab === 'all'
                  ? 'Launch First Challenge'
                  : undefined
              }
              onAction={
                isStaff && activeTab === 'all'
                  ? () => setIsNewChallengeOpen(true)
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((c) => {
            const subsCount = submissions.filter((s) => s.challenge_id === c.id).length
            const isEnded = new Date(c.end_time) < new Date()

            return (
              <Card
                key={c.id}
                className="bg-[#0A0F1D] border-border-default rounded-3xl shadow-xl flex flex-col justify-between hover:border-accent-purple/50 transition-all group overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-sans font-black text-xl text-text-primary group-hover:text-accent-purple transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted mt-2 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent-purple" />
                          <span>Ends: {new Date(c.end_time).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span className="text-text-muted">{subsCount} Teams</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 text-[10px] font-bold font-mono rounded border uppercase tracking-wider ${
                        c.status === 'active'
                          ? 'bg-status-success/15 text-status-success border-status-success/40'
                          : c.status === 'upcoming'
                          ? 'bg-accent-teal/15 text-accent-teal border-accent-teal/40'
                          : 'bg-bg-page text-text-muted border-border-default'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted line-clamp-2 mb-6 leading-relaxed font-sans font-medium">
                    {c.description}
                  </p>

                  {c.bounty_or_prize && (
                    <div className="p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/30 text-[11px] text-accent-purple font-mono font-bold tracking-wider uppercase flex items-center gap-2 mb-4">
                      <Medal className="w-4 h-4 text-accent-purple flex-shrink-0" />
                      <span className="truncate">{c.bounty_or_prize}</span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-bg-surface/50 border-t border-border-default flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    {isEnded ? 'Sprint Concluded' : 'Submissions Active'}
                  </span>

                  <Button
                    onClick={() => setSelectedChallenge(c)}
                    variant="outline"
                    className="font-sans text-xs font-bold min-h-[36px] px-4 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer gap-2"
                  >
                    <span>Leaderboard</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Challenge Detail & Leaderboard Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-border-default flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent-purple/10 rounded-xl">
                    <Trophy className="w-6 h-6 text-accent-purple" />
                  </div>
                  <h2 className="text-2xl font-black font-sans text-text-primary">
                    {selectedChallenge.title}
                  </h2>
                  <span
                    className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded uppercase tracking-wider border ${
                      selectedChallenge.status === 'active'
                        ? 'bg-status-success/10 text-status-success border-status-success/30'
                        : 'bg-bg-page text-text-muted border-border-default'
                    }`}
                  >
                    {selectedChallenge.status}
                  </span>
                </div>
                <p className="text-sm font-sans font-medium text-text-muted mt-3">
                  Timeline: {new Date(selectedChallenge.start_time).toLocaleDateString()} —{' '}
                  {new Date(selectedChallenge.end_time).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-2.5 rounded-xl bg-bg-page hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors border border-border-default"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Problem Brief */}
              <div className="bg-bg-page p-6 rounded-3xl border border-border-default shadow-xl space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-text-muted tracking-wider flex items-center gap-2">
                  <Medal className="w-4 h-4 text-accent-purple" />
                  Challenge Brief & Problem Statement
                </h4>
                <p className="text-sm font-sans font-medium text-text-primary leading-relaxed whitespace-pre-line">
                  {selectedChallenge.description}
                </p>

                <div className="pt-4 mt-4 border-t border-border-default space-y-4">
                  <h4 className="text-xs font-bold font-mono uppercase text-text-muted tracking-wider">
                    Evaluation Requirements & Constraints
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line bg-bg-surface p-4 rounded-xl border border-border-default">
                    {selectedChallenge.requirements}
                  </p>
                </div>

                {selectedChallenge.bounty_or_prize && (
                  <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30 text-xs font-bold font-mono text-accent-purple tracking-wider uppercase flex items-center gap-3">
                    <Award className="w-5 h-5 text-accent-purple" />
                    <span>Awards & Recognition: {selectedChallenge.bounty_or_prize}</span>
                  </div>
                )}
              </div>

              {/* Submit Action Banner */}
              {isActiveMember && selectedChallenge.status === 'active' && (
                <div className="p-6 rounded-3xl bg-bg-surface border border-border-default shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="text-lg font-black font-sans text-text-primary">
                      {userSubmitted ? 'Entry Already Submitted' : 'Ready to Ship Your Solution?'}
                    </h4>
                    <p className="text-xs font-sans font-medium text-text-muted mt-1.5">
                      {userSubmitted
                        ? 'Your submission is recorded on the sprint board.'
                        : 'Submit your GitHub repository, deployed demo URL, and architecture writeup.'}
                    </p>
                  </div>

                  {!userSubmitted && (
                    <Button
                      onClick={() => setIsSubmitEntryOpen(true)}
                      className="font-sans text-xs font-bold gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all cursor-pointer border border-transparent hover:border-white whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Solution</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Leaderboard Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-accent-purple" />
                    <span>Sprint Leaderboard</span>
                  </h4>
                  <span className="text-[10px] font-bold font-mono text-text-muted uppercase tracking-wider">
                    {challengeSubmissions.length} Total Entries
                  </span>
                </div>

                {challengeSubmissions.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-bg-surface border border-border-default shadow-xl text-text-muted font-mono font-bold text-xs uppercase tracking-wider">
                    No submissions registered yet for this challenge. Be the first to ship a solution!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {challengeSubmissions.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-3xl bg-bg-page border border-border-default shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-accent-purple/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-black shadow-inner border ${
                              idx === 0
                                ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/40'
                                : idx === 1
                                ? 'bg-bg-surface text-text-primary border-border-default'
                                : idx === 2
                                ? 'bg-bg-surface text-text-muted border-border-default'
                                : 'bg-bg-surface text-text-muted border-border-default'
                            }`}
                          >
                            #{sub.rank || idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-sans font-black text-base text-text-primary">
                                {sub.team_name}
                              </span>
                              <span
                                className={`px-2 py-1 text-[10px] font-bold font-mono rounded uppercase tracking-wider border ${
                                  sub.status === 'awarded'
                                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                                    : 'bg-status-pending/10 text-status-pending border-status-pending/30'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-xs font-sans font-medium text-text-muted line-clamp-1 mt-1">
                              {sub.writeup}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-end">
                          {sub.score !== undefined && sub.score !== null && (
                            <div className="text-right">
                              <span className="text-sm font-black font-mono text-accent-purple">
                                {sub.score} pts
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {sub.github_url && (
                              <a
                                href={sub.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-bg-surface hover:bg-bg-page text-text-muted hover:text-text-primary border border-border-default transition-colors"
                                title="View Solution Code"
                              >
                                <GithubIcon className="w-4 h-4" />
                              </a>
                            )}
                            {sub.demo_url && (
                              <a
                                href={sub.demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-bg-surface hover:bg-bg-page text-text-muted hover:text-accent-purple border border-border-default transition-colors"
                                title="Open Live Demo"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {isStaff && (
                              <Button
                                onClick={() => {
                                  setGradingSubmission(sub)
                                  setGradeScore(sub.score || 85)
                                  setGradeRank(sub.rank || idx + 1)
                                  setGradeStatus(sub.status || 'awarded')
                                }}
                                variant="outline"
                                className="font-sans text-xs font-bold min-h-[36px] px-4 ml-2 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                              >
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Challenge Modal (Staff) */}
      {isNewChallengeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <Trophy className="w-5 h-5 text-accent-purple" />
                 </div>
                <span>Launch Build Challenge</span>
              </h3>
              <button
                onClick={() => setIsNewChallengeOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {challengeError && (
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/20 text-xs text-status-destructive font-mono font-bold uppercase tracking-wider">
                {challengeError}
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Challenge Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 48hr Vibe-Coding LLM Agent Sprint"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Problem Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the engineering challenge, problem space, and target goals..."
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Technical Requirements *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Must include automated tests, live Vercel URL, and clean commit history."
                  value={challengeReqs}
                  onChange={(e) => setChallengeReqs(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Bounty / Perks</label>
                <input
                  type="text"
                  placeholder="e.g. Merit Badge + DevStudio Featured Repo"
                  value={challengeBounty}
                  onChange={(e) => setChallengeBounty(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Start Date</label>
                  <input
                    type="date"
                    value={challengeStart}
                    onChange={(e) => setChallengeStart(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-mono text-xs uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">End Date</label>
                  <input
                    type="date"
                    value={challengeEnd}
                    onChange={(e) => setChallengeEnd(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewChallengeOpen(false)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingChallenge}
                  className="font-sans text-xs font-bold gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  {isSubmittingChallenge ? 'Launching...' : 'Launch Challenge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Entry Modal (Member) */}
      {isSubmitEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <Send className="w-5 h-5 text-accent-purple" />
                 </div>
                <span>Submit Challenge Project</span>
              </h3>
              <button
                onClick={() => setIsSubmitEntryOpen(false)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {entryError && (
              <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/20 text-xs text-status-destructive font-mono font-bold uppercase tracking-wider">
                {entryError}
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Team / Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NeuralCoders"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">GitHub Repository URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Live Demo URL</label>
                <input
                  type="url"
                  placeholder="https://my-demo.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Architecture & Solution Writeup *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize your tech stack, core algorithms, and how AI-assisted workflows were applied..."
                  value={writeup}
                  onChange={(e) => setWriteup(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl p-3.5 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all resize-none placeholder:text-text-muted/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitEntryOpen(false)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="font-sans text-xs font-bold gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  {isSubmittingEntry ? 'Submitting...' : 'Submit Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Grade Submission Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0F1D] border border-border-default rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h3 className="text-lg font-black font-sans text-text-primary flex items-center gap-3">
                 <div className="p-2 bg-accent-purple/10 rounded-lg">
                   <Award className="w-5 h-5 text-accent-purple" />
                 </div>
                <span>Evaluate: {gradingSubmission.team_name}</span>
              </h3>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-5 text-sm font-sans font-medium">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Score (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Rank Placement</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={gradeRank}
                  onChange={(e) => setGradeRank(Number(e.target.value))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Status</label>
                <select
                  value={gradeStatus}
                  onChange={(e) => setGradeStatus(e.target.value as SubmissionStatus)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-mono text-xs uppercase tracking-wider appearance-none"
                >
                  <option value="under_review">Under Review</option>
                  <option value="awarded">Awarded / Ranked</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGradingSubmission(null)}
                  className="font-sans text-xs font-bold min-h-[44px] px-6 rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="font-sans text-xs font-bold bg-accent-purple hover:bg-accent-purple/90 text-white min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
