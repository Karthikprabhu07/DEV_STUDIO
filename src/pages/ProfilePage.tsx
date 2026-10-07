import React, { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
  Trophy,
  Award,
  ExternalLink,
  RefreshCw,
  GitBranch,
  Star,
  Code,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { useCertificates } from '@/contexts/CertificatesContext'
import { useGitHub } from '@/contexts/GitHubContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge } from '@/components/ui/badge'
import { formatMembershipStatus } from '@/lib/utils'
import { UserAvatar } from '@/components/profile/UserAvatar'


const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

export const ProfilePage: React.FC = () => {
  const {
    profile,
    updateProfile,
    submitPhotoForModeration,
    removePhoto,
  } = useAuth()
  const { badges, memberBadges } = useCommunity()
  const { certificates } = useCertificates()
  const { linkedAccount, stats: ghStats, isSyncing: isGhSyncing, linkGitHubAccount, unlinkGitHubAccount, syncGitHubStats } = useGitHub()

  const userEarnedBadges = profile ? memberBadges.filter((mb) => mb.user_id === profile.id) : []
  const userCertificates = profile ? certificates.filter((c) => c.user_id === profile.id) : []

  const [githubInput, setGithubInput] = useState('')
  const [ghError, setGhError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [academicYear, setAcademicYear] = useState(profile?.academic_year?.toString() || '2026')
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science & Engineering')
  const [usn, setUsn] = useState(profile?.usn || '')

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setAcademicYear(profile.academic_year?.toString() || '2026')
      setBranch(profile.branch || 'Computer Science & Engineering')
      setUsn(profile.usn || '')
    }
  }, [profile?.id, profile?.updated_at])

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
      <Helmet>
        <title>My Profile | DevStudio</title>
        <meta name="robots" content="noindex" />
      </Helmet>

        <Card className="p-12 border-border-default bg-[#0A0F1D] shadow-2xl rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/25 flex items-center justify-center text-accent-teal mx-auto mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-3 font-sans tracking-tight">Sign In to Manage Profile</h2>
          <p className="text-sm text-text-muted mb-8 font-sans font-medium leading-relaxed">
            You must be signed in with your verified institutional <code className="text-accent-teal font-mono text-xs bg-accent-teal/10 px-1.5 py-0.5 rounded">@mite.ac.in</code> account to access your developer identity, pass, and settings.
          </p>
          <Button
            onClick={() => {
              const signinBtn = document.getElementById('rail-signin-btn')
              signinBtn?.click()
            }}
            className="w-full font-sans font-bold bg-accent-teal hover:bg-accent-teal/90 text-on-accent rounded-xl min-h-[48px] shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] cursor-pointer transition-all border border-transparent hover:border-white"
          >
            Sign In with MITE Email
          </Button>
        </Card>
      </div>
    )
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackSuccess(null)
    setFeedbackError(null)

    const res = await updateProfile({
      full_name: fullName,
      bio,
      academic_year: parseInt(academicYear) || null,
      branch,
      usn,
    })

    if (res.success) {
      setFeedbackSuccess('Profile updated successfully.')
    } else {
      setFeedbackError(res.error || 'Failed to update profile.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedbackError('Only JPG, PNG, and WebP images are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedbackError('File size must be under 2MB.')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUrl = reader.result as string
      const res = await submitPhotoForModeration(dataUrl)
      if (res.success) {
        setFeedbackSuccess('Photo uploaded! It is now PENDING staff moderation.')
      } else {
        setFeedbackError(res.error || 'Upload failed.')
      }
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    if (window.confirm("Remove your photo? Your monogram will be used instead.")) {
      setIsRemoving(true)
      const res = await removePhoto()
      if (res.success) {
        setFeedbackSuccess('Photo removed.')
      } else {
        setFeedbackError(res.error || 'Failed to remove photo.')
      }
      setIsRemoving(false)
    }
  }


  const handleLinkGitHub = async (e: React.FormEvent) => {
    e.preventDefault()
    setGhError(null)
    if (!githubInput.trim()) return
    const res = await linkGitHubAccount(githubInput.trim())
    if (res.success) {
      setGithubInput('')
      setFeedbackSuccess('GitHub account connected and developer statistics synchronized!')
    } else {
      setGhError(res.error || 'Failed to link GitHub account.')
    }
  }

  const handleUnlinkGitHub = async () => {
    setGhError(null)
    const res = await unlinkGitHubAccount()
    if (res.success) {
      setFeedbackSuccess('GitHub account unlinked.')
    } else {
      setGhError(res.error || 'Failed to unlink GitHub account.')
    }
  }

  const handleSyncGitHub = async () => {
    setGhError(null)
    const res = await syncGitHubStats()
    if (res.success) {
      setFeedbackSuccess('GitHub developer metrics updated.')
    } else {
      setGhError(res.error || 'Sync failed.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Profile Header Card */}
      <Card className="border-border-default bg-[#0A0F1D] p-8 sm:p-10 rounded-3xl shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          
          {/* Avatar Display */}
          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 rounded-3xl bg-bg-page border-2 border-border-default flex items-center justify-center overflow-hidden shadow-2xl">
              <UserAvatar profile={profile} className="w-full h-full text-3xl font-black text-text-muted" />
            </div>

            {/* Photo Moderation Pill */}
            {profile.avatar_type === 'photo' && (
              <div className="mt-3 text-center">
                <span className={`text-[10px] font-bold font-mono px-3 py-1 rounded-full border uppercase tracking-wider ${
                  profile.photo_moderation_status === 'approved'
                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                    : profile.photo_moderation_status === 'pending'
                    ? 'bg-status-pending/10 text-status-pending border-status-pending/30'
                    : 'bg-status-destructive/10 text-status-destructive border-status-destructive/30'
                }`}>
                  {profile.photo_moderation_status === 'pending'
                    ? 'PENDING PHOTO'
                    : profile.photo_moderation_status === 'approved'
                    ? 'APPROVED PHOTO'
                    : 'REJECTED PHOTO'}
                </span>
              </div>
            )}
          </div>

          {/* Member Details */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-black font-sans text-text-primary tracking-tight">{profile.full_name}</h1>
              <RoleBadge role={profile.role} />
            </div>

            <p className="text-sm text-text-muted font-mono font-medium bg-bg-surface inline-block px-3 py-1 rounded-lg border border-border-default/50">{profile.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs font-bold font-sans">
              <div className="px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-text-muted shadow-sm">
                ID: <span className="text-accent-teal font-black font-mono ml-1">{profile.devstudio_id || 'Pending Approval'}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-text-muted shadow-sm">
                Status: <span className="text-status-success font-black uppercase tracking-wider font-mono ml-1">{formatMembershipStatus(profile.membership_status)}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-text-muted shadow-sm">
                Graduation: <span className="text-text-primary font-black ml-1">{profile.academic_year || '2026'}</span>
              </div>
            </div>
          </div>

          {/* Photo Actions */}
          <div className="sm:ml-auto flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <input
              id="avatar-photo-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            {profile.avatar_type === 'photo' && (profile.avatar_url || profile.pending_photo_url) ? (
              <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 sm:flex-none font-sans text-xs font-bold min-h-[40px] px-5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-page hover:border-accent-teal text-text-primary transition-all shadow-sm cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 mr-2 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2 text-accent-teal" />
                      Change
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isRemoving || isUploading}
                  variant="ghost"
                  className="flex-1 sm:flex-none font-sans text-xs font-bold min-h-[40px] px-5 rounded-xl text-status-destructive hover:bg-status-destructive/10 cursor-pointer"
                >
                  {isRemoving ? (
                    <>
                      <span className="w-4 h-4 mr-2 border-2 border-status-destructive border-t-transparent rounded-full animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto font-sans text-xs font-bold min-h-[40px] px-5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-page hover:border-accent-teal text-text-primary transition-all shadow-sm cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 text-accent-teal" />
                    Add Photo
                  </>
                )}
              </Button>
            )}
            
            {profile.avatar_type === 'photo' && profile.photo_moderation_status === 'pending' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-status-pending bg-status-pending/10 px-2.5 py-1 rounded-md border border-status-pending/20">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>Pending review</span>
              </div>
            )}
          </div>

        </div>
      </Card>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
          <span className="text-sm text-status-success font-sans font-bold">{feedbackSuccess}</span>
        </div>
      )}
      {feedbackError && (
        <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/30 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-status-destructive flex-shrink-0" />
          <span className="text-sm text-status-destructive font-sans font-bold">{feedbackError}</span>
        </div>
      )}


      {/* Member Details Form */}
      <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-5 bg-bg-surface/50 border-b border-border-default pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-purple/10 rounded-lg">
              <User className="w-5 h-5 text-accent-purple" />
            </div>
            <CardTitle className="text-lg font-black font-sans text-text-primary">
              Academic & Member Information
            </CardTitle>
          </div>
          <p className="text-xs font-sans font-medium text-text-muted mt-2 pl-12">
            Personal engineering profile information displayed to club members.
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">
                  Full Name
                </label>
                <Input
                  id="profile-fullname-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">
                  USN (University Seat Number)
                </label>
                <Input
                  id="profile-usn-input"
                  type="text"
                  placeholder="e.g. 4MT23CS042"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all font-mono uppercase tracking-wider shadow-sm placeholder:text-text-muted/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">
                  Branch / Engineering Department
                </label>
                <select
                  id="profile-branch-select"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:outline-none transition-all font-sans font-medium text-sm shadow-sm appearance-none"
                >
                  <option>Computer Science & Engineering</option>
                  <option>Artificial Intelligence & Machine Learning</option>
                  <option>Information Science & Engineering</option>
                  <option>Electronics & Communication Engineering</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Mechatronics Engineering</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">
                  Expected Graduation Year
                </label>
                <Input
                  id="profile-year-input"
                  type="number"
                  min={2020}
                  max={2035}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl h-11 px-4 text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 focus:outline-none transition-all font-mono shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">
                Bio & Tech Focus
              </label>
              <textarea
                id="profile-bio-textarea"
                rows={3}
                placeholder="Share your tech interests, systems engineering experience, or vibe-coding projects..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-bg-surface border border-border-default rounded-xl p-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/50 font-sans font-medium text-sm transition-all shadow-sm resize-none"
              />
            </div>

            <div className="pt-4 border-t border-border-default/50 flex justify-end">
              <Button
                id="save-profile-btn"
                type="submit"
                className="font-sans text-xs font-bold gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white min-h-[44px] px-6 rounded-xl shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* DevStudio Badges & Achievements (Professional, Non-Gamified) */}
      <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-5 bg-bg-surface/50 border-b border-border-default pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-teal/10 rounded-lg">
                <Trophy className="w-5 h-5 text-accent-teal" />
              </div>
              <div>
                <CardTitle className="text-lg font-black font-sans text-text-primary">
                  DevStudio Engineering Badges
                </CardTitle>
                <p className="text-xs font-sans font-medium text-text-muted mt-1">
                  Official technical honors awarded upon verified milestones and codebase contributions.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1.5 bg-bg-page border border-border-default rounded-xl shadow-sm">
              <span className="text-accent-teal">{userEarnedBadges.length}</span> / {badges.length} Earned
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {badges.map((b) => {
              const earnedRecord = userEarnedBadges.find((mb) => mb.badge_id === b.id)
              const isEarned = !!earnedRecord

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isEarned
                      ? 'bg-bg-page border-border-default shadow-sm'
                      : 'bg-bg-page/40 border-border-default/50 opacity-70 grayscale-[30%]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono ${
                          isEarned
                            ? 'bg-accent-teal/10 border border-accent-teal/30 text-accent-teal'
                            : 'bg-bg-surface border border-border-default text-text-muted'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4
                          className={`font-sans font-black text-sm leading-tight ${
                            isEarned ? 'text-text-primary' : 'text-text-muted'
                          }`}
                        >
                          {b.name}
                        </h4>
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted mt-0.5 block">
                          {b.category} track
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded border uppercase tracking-wider ${
                        isEarned
                          ? 'bg-status-success/10 text-status-success border-status-success/30'
                          : 'bg-bg-surface text-text-muted border-border-default'
                      }`}
                    >
                      {isEarned ? 'VERIFIED' : 'LOCKED'}
                    </span>
                  </div>

                  <p className="text-xs font-sans font-medium text-text-muted mt-3.5 leading-relaxed line-clamp-2">
                    {b.description}
                  </p>

                  {isEarned && (
                    <div className="mt-4 pt-3 border-t border-border-default/50 text-[10px] font-bold font-mono text-accent-teal flex items-center justify-between">
                      <span>Awarded: {new Date(earnedRecord.awarded_at).toLocaleDateString()}</span>
                      {earnedRecord.reason && <span className="text-text-muted truncate ml-2">{earnedRecord.reason}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* GitHub Developer Integration */}
      <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-5 bg-bg-surface/50 border-b border-border-default pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-text-primary/10 rounded-lg">
                <GithubIcon className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black font-sans text-text-primary">
                  GitHub Developer Integration
                </CardTitle>
                <p className="text-xs font-sans font-medium text-text-muted mt-1">
                  Connect your GitHub account to showcase open-source contributions, repositories, and sync coding metrics with DevStudio sprints.
                </p>
              </div>
            </div>
            {linkedAccount && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-status-success/10 text-status-success border border-status-success/30 flex items-center gap-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                Connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {ghError && (
            <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/30 text-status-destructive text-sm font-sans font-bold flex items-center gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-status-destructive flex-shrink-0" />
              <span>{ghError}</span>
            </div>
          )}

          {linkedAccount ? (
            <div className="space-y-6">
              {/* Linked Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-bg-page border border-border-default gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src={linkedAccount.avatar_url || `https://github.com/${linkedAccount.github_username}.png`}
                    alt={linkedAccount.github_username}
                    className="w-14 h-14 rounded-full border-2 border-border-default object-cover shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-sans text-text-primary">@{linkedAccount.github_username}</span>
                      <a
                        href={`https://github.com/${linkedAccount.github_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted hover:text-accent-teal transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-[11px] text-text-muted font-bold font-mono uppercase tracking-wider mt-0.5">
                      Last synchronized: {linkedAccount.last_synced_at ? new Date(linkedAccount.last_synced_at).toLocaleTimeString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    id="sync-github-stats-btn"
                    onClick={handleSyncGitHub}
                    disabled={isGhSyncing}
                    className="text-xs font-bold font-sans min-h-[40px] px-5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-page hover:border-accent-teal text-text-primary gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGhSyncing ? 'animate-spin text-accent-teal' : ''}`} />
                    <span>{isGhSyncing ? 'Syncing...' : 'Sync Stats'}</span>
                  </Button>
                  <Button
                    id="unlink-github-btn"
                    onClick={handleUnlinkGitHub}
                    variant="ghost"
                    className="text-xs font-bold font-sans min-h-[40px] px-5 rounded-xl text-status-destructive hover:bg-status-destructive/10 cursor-pointer"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Developer Contribution Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-center shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-text-muted flex items-center justify-center gap-1.5 mb-2">
                    <GitBranch className="w-3.5 h-3.5 text-accent-teal" />
                    <span>Repositories</span>
                  </div>
                  <div className="text-2xl font-black font-sans text-text-primary">
                    {ghStats?.public_repos ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-center shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-text-muted flex items-center justify-center gap-1.5 mb-2">
                    <Star className="w-3.5 h-3.5 text-accent-amber" />
                    <span>Total Stars</span>
                  </div>
                  <div className="text-2xl font-black font-sans text-accent-amber">
                    {ghStats?.total_stars ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-center shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-text-muted flex items-center justify-center gap-1.5 mb-2">
                    <Code className="w-3.5 h-3.5 text-status-success" />
                    <span>Contributions</span>
                  </div>
                  <div className="text-2xl font-black font-sans text-status-success">
                    {ghStats?.total_contributions ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg-page border border-border-default text-center shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-text-muted flex items-center justify-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5 text-accent-purple" />
                    <span>Followers</span>
                  </div>
                  <div className="text-2xl font-black font-sans text-accent-purple">
                    {ghStats?.followers ?? 0}
                  </div>
                </div>
              </div>

              {/* Top Programming Languages */}
              {ghStats?.top_languages && ghStats.top_languages.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Top Tech Stack & Languages</div>
                  <div className="flex flex-wrap gap-2">
                    {ghStats.top_languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold font-sans bg-bg-page border border-border-default text-text-primary flex items-center gap-2 shadow-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-accent-teal" />
                        <span>{lang}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLinkGitHub} className="space-y-4">
              <div className="p-5 rounded-2xl bg-bg-page border border-border-default text-sm font-sans font-medium text-text-muted leading-relaxed shadow-sm">
                Connect your public GitHub username to automatically fetch public repositories, star counts, contributions, and link your code with DEVSTUDIO sprint challenges.
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono font-bold text-xs uppercase tracking-wider">github.com/</span>
                  <Input
                    id="github-username-input"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder="octocat"
                    className="pl-[104px] bg-bg-surface border-border-default font-mono font-bold text-sm text-text-primary h-12 rounded-xl focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/50 shadow-sm"
                  />
                </div>
                <Button
                  id="connect-github-btn"
                  type="submit"
                  disabled={!githubInput.trim() || isGhSyncing}
                  className="font-sans text-xs font-bold gap-2 min-h-[48px] px-8 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>{isGhSyncing ? 'Connecting...' : 'Connect GitHub'}</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Digital Certificates & Credentials */}
      <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-5 bg-bg-surface/50 border-b border-border-default pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-amber/10 rounded-lg">
              <Award className="w-5 h-5 text-accent-amber" />
            </div>
            <div>
              <CardTitle className="text-lg font-black font-sans text-text-primary">
                Digital Certificates & Credentials ({userCertificates.length})
              </CardTitle>
              <p className="text-xs font-sans font-medium text-text-muted mt-1">
                Cryptographically signed institutional credentials issued by Dev Directors, verifiable publicly via SHA-256 tokens.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {userCertificates.length === 0 ? (
            <div className="py-12 text-center text-text-muted font-sans font-medium text-sm border-2 border-dashed border-border-default rounded-2xl bg-bg-surface/30">
              No certificates issued yet. Complete club hackathons, sprint challenges, or serve in leadership to earn verified digital credentials.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {userCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-bg-page border border-border-default hover:border-accent-amber/40 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)] transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/30">
                        {cert.certificate_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          cert.status === 'valid'
                            ? 'bg-status-success/10 text-status-success border-status-success/30'
                            : 'bg-status-destructive/10 text-status-destructive border-status-destructive/30'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </div>

                    <h4 className="text-base font-black font-sans text-text-primary group-hover:text-accent-amber transition-colors leading-tight">
                      {cert.title}
                    </h4>
                    <p className="text-xs font-sans font-medium text-text-muted mt-2 line-clamp-2 leading-relaxed">
                      {cert.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-default flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      Issued: <span className="text-text-primary">{new Date(cert.issue_date).toLocaleDateString()}</span>
                    </span>

                    {cert.verification_token && (
                      <Link
                        to={`/verify-certificate/${cert.verification_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-primary hover:text-accent-primary/80 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
