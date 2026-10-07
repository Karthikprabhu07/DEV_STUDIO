import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Shield,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Camera,
  History,
  X,
  Check,
  Award,
  GraduationCap,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCertificates } from '@/contexts/CertificatesContext'
import { useCommunity } from '@/contexts/CommunityContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoleBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TechnicalRole, MembershipStatus, CertificateType } from '@/types'
import { formatMembershipStatus } from '@/lib/utils'

export const DirectorConsolePage: React.FC = () => {
  const {
    profile,
    isAdmin,
    members,
    auditLogs,
    updateMemberRole,
    updateMembershipStatus,
    moderatePhoto,
    addMember,
    removeMember,
    syncMembersDirectory,
    isLoaded,
  } = useAuth()
  const { awardBadge } = useCommunity()

  const {
    certificates,
    issueCertificate,
    revokeCertificate,
    rotateCertificateToken,
    rotateMemberIdToken,
  } = useCertificates()

  const [selectedTab, setSelectedTab] = useState<'roles' | 'applications' | 'photos' | 'certificates' | 'alumni' | 'audit'>('roles')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<TechnicalRole>('member')
  const [newMemberBranch, setNewMemberBranch] = useState('Computer Science & Engineering')
  const [newMemberUsn, setNewMemberUsn] = useState('')
  const [newMemberYear, setNewMemberYear] = useState('2026')
  const [isAddingMember, setIsAddingMember] = useState(false)

  // Issue Certificate Modal
  const [isIssueCertOpen, setIsIssueCertOpen] = useState(false)
  const [certRecipientId, setCertRecipientId] = useState('')
  const [certTitle, setCertTitle] = useState('')
  const [certDesc, setCertDesc] = useState('')
  const [isRefreshingApps, setIsRefreshingApps] = useState(false)
  const [processingMemberIds, setProcessingMemberIds] = useState<string[]>([])

  const handleRefreshApplications = async () => {
    setIsRefreshingApps(true)
    setActionSuccess(null)
    setActionError(null)
    try {
      await syncMembersDirectory()
      setActionSuccess('Refreshed application queue and member directory.')
    } catch {
      setActionError('Failed to refresh applications.')
    } finally {
      setIsRefreshingApps(false)
    }
  }
  const [certType, setCertType] = useState<CertificateType>('merit')
  const [isIssuing, setIsIssuing] = useState(false)
  const [issuedRawToken, setIssuedRawToken] = useState<string | null>(null)

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionSuccess(null)
    setActionError(null)

    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setActionError('Full name and @mite.ac.in email are required.')
      return
    }

    setIsAddingMember(true)
    const res = await addMember({
      full_name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      branch: newMemberBranch.trim(),
      usn: newMemberUsn.trim(),
      academic_year: parseInt(newMemberYear, 10) || 2026,
    })
    setIsAddingMember(false)

    if (res.success && res.member) {
      setActionSuccess(`Member ${res.member.full_name} (${res.member.devstudio_id}) added successfully! Synced in real-time.`)
      setIsAddMemberOpen(false)
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberUsn('')
    } else {
      setActionError(res.error || 'Failed to add member.')
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from DevStudio? This will revoke their access and credentials in real time across the platform.`
    )
    if (!confirmed) return

    setActionSuccess(null)
    setActionError(null)
    const res = await removeMember(userId, 'Director removed member from console')
    if (res.success) {
      setActionSuccess(`Member ${memberName} removed from DevStudio. Synced in real-time.`)
    } else {
      setActionError(res.error || 'Failed to remove member.')
      await syncMembersDirectory()
    }
  }

  // Strict role guard: Only Dev Director permitted
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
      <Helmet>
        <title>Director Console | DevStudio</title>
        <meta name="robots" content="noindex" />
      </Helmet>

        <Card className="border-red-500/30 bg-red-950/20 p-8">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            This console is strictly restricted to platform <strong className="text-purple-300">Dev Directors</strong>. Dev Captains and Dev Mates do not have administrative privileges.
          </p>
        </Card>
      </div>
    )
  }

  const handleRoleChange = async (userId: string, newRole: TechnicalRole, memberName: string) => {
    setActionSuccess(null)
    setActionError(null)
    const res = await updateMemberRole(userId, newRole)
    if (res.success) {
      const roleLabel = newRole === 'admin' ? 'Dev Director' : newRole === 'organizer' ? 'Dev Captain' : 'Dev Mate'
      setActionSuccess(`Updated ${memberName}'s role to ${roleLabel}. Audit log recorded.`)
      if (newRole === 'organizer') {
        awardBadge(userId, 'DEV_CAPTAIN_MERIT', 'Appointed as Dev Captain — Leadership & Mentorship at MITE')
      }
    } else {
      setActionError(res.error || 'Failed to update role.')
      await syncMembersDirectory()
    }
  }

  const handleStatusChange = async (userId: string, status: MembershipStatus, memberName: string) => {
    setActionSuccess(null)
    setActionError(null)
    setProcessingMemberIds((prev) => [...prev, userId])
    try {
      const res = await updateMembershipStatus(userId, status)
      if (res.success) {
        setActionSuccess(`Updated ${memberName}'s status to ${formatMembershipStatus(status)}. Audit log recorded.`)
      } else {
        setActionError(res.error || 'Failed to update status.')
        await syncMembersDirectory()
      }
    } finally {
      setProcessingMemberIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handlePhotoModerate = async (userId: string, approved: boolean, memberName: string) => {
    setActionSuccess(null)
    setActionError(null)
    const res = await moderatePhoto(userId, approved, approved ? undefined : 'Photo does not meet institutional quality requirements.')
    if (res.success) {
      setActionSuccess(`${approved ? 'Approved' : 'Rejected'} photo for ${memberName}. Audit log recorded.`)
    } else {
      setActionError(res.error || 'Failed to moderate photo.')
    }
  }

  const handleRotateIdToken = async (userId: string, memberName: string) => {
    setActionSuccess(null)
    setActionError(null)
    const res = await rotateMemberIdToken(userId)
    if (res.success) {
      setActionSuccess(`Rotated cryptographic ID QR token for ${memberName}. Previous cards invalidated.`)
    } else {
      setActionError(res.error || 'Failed to rotate token.')
    }
  }

  const handleIssueCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certRecipientId || !certTitle.trim() || !certDesc.trim()) {
      setActionError('Recipient, title, and description are required.')
      return
    }

    setIsIssuing(true)
    const res = await issueCertificate({
      user_id: certRecipientId,
      title: certTitle.trim(),
      description: certDesc.trim(),
      certificate_type: certType,
    })
    setIsIssuing(false)

    if (res.success && res.rawToken) {
      setIssuedRawToken(res.rawToken)
      setActionSuccess(`Certificate "${certTitle}" issued successfully. Verification link active.`)
      setCertTitle('')
      setCertDesc('')
    } else {
      setActionError(res.error || 'Failed to issue certificate.')
    }
  }

  const handleRevokeCert = async (certId: string, title: string) => {
    const reason = prompt('Enter justification reason for credential revocation:')
    if (!reason) return
    const res = await revokeCertificate(certId, reason)
    if (res.success) {
      setActionSuccess(`Revoked certificate "${title}". Verification page will now report revoked.`)
    } else {
      setActionError(res.error || 'Failed to revoke.')
    }
  }

  const handleRotateCertToken = async (certId: string, title: string) => {
    const res = await rotateCertificateToken(certId)
    if (res.success) {
      setActionSuccess(`Rotated verification token for "${title}".`)
    } else {
      setActionError(res.error || 'Failed to rotate token.')
    }
  }

  const pendingMembers = members.filter((m) => m.membership_status === 'pending')
  const pendingPhotos = members.filter((m) => m.photo_moderation_status === 'pending' && m.pending_photo_url)

  // Alumni Graduation Queue (Section 6): Students whose expected academic year has passed (e.g. <= 2025)
  const currentAcademicThreshold = 2025
  const graduationCandidates = members.filter(
    (m) =>
      m.membership_status === 'active' &&
      m.academic_year !== null &&
      m.academic_year !== undefined &&
      m.academic_year <= currentAcademicThreshold
  )
  const activeAlumni = members.filter((m) => m.membership_status === 'alumni')

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent-primary font-bold">
              Executive Administration
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary font-sans">
            Dev Director Console
          </h1>
          <p className="text-sm text-text-muted mt-1 font-sans">
            Manage club roles, review MITE student applications, moderate ID photos, issue verifiable certificates, and monitor audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RoleBadge role="admin" />
          <span className="text-xs font-mono text-accent-primary font-bold bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-xl shadow-inner">
            Session: {profile?.full_name || 'Dev Director'}
          </span>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
            <span className="text-xs sm:text-sm text-status-success font-mono">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-status-success/70 hover:text-status-success">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-status-destructive/10 border border-status-destructive/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-status-destructive flex-shrink-0" />
            <span className="text-xs sm:text-sm text-status-destructive font-mono">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-status-destructive/70 hover:text-status-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-default pb-4">
        {[
          { id: 'roles', label: `Role Management (${members.length})`, icon: Users },
          { id: 'applications', label: `Applications (${pendingMembers.length})`, icon: UserCheck, pulse: pendingMembers.length > 0 },
          { id: 'photos', label: `Photo Queue (${pendingPhotos.length})`, icon: Camera },
          { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award, color: 'text-accent-amber' },
          { id: 'alumni', label: `Alumni Queue (${graduationCandidates.length})`, icon: GraduationCap },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = selectedTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all font-bold ${
                isActive
                  ? 'bg-bg-page text-text-primary shadow-sm border border-border-default/50'
                  : 'text-text-muted hover:text-text-primary border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${tab.color || ''}`} />
                {tab.pulse && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-status-destructive animate-pulse" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: Role Management */}
      {selectedTab === 'roles' && (
        <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-5 border-b border-border-default bg-bg-surface/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <UserPlus className="w-5 h-5 text-accent-primary" />
                 </div>
                 <div>
                   <CardTitle className="text-lg font-black text-text-primary font-sans">
                     Club Member Directory & Executive Permissions
                   </CardTitle>
                   <p className="text-xs text-text-muted mt-0.5 font-sans">
                     Manage memberships, promote roles, and provision credentials. Real-time updates synced automatically.
                   </p>
                 </div>
              </div>
              <Button
                id="btn-open-add-member"
                onClick={() => setIsAddMemberOpen(true)}
                className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent min-h-[44px] rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all cursor-pointer border border-transparent hover:border-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Add Member</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[#111827] text-text-muted border-b border-border-default uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-4 px-6">Member Identity</th>
                    <th className="py-4 px-6">DevStudio ID</th>
                    <th className="py-4 px-6">Assigned Role</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Security & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-text-muted">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-bg-page/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-bold text-text-primary font-sans text-sm">{m.full_name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 font-mono opacity-70 group-hover:opacity-100 transition-opacity">{m.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1A2333] border border-border-default text-accent-primary font-bold">
                           <Shield className="w-3 h-3" />
                           {m.devstudio_id || 'ID Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <RoleBadge role={m.role} />
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                            m.membership_status === 'active'
                              ? 'bg-status-success/10 text-status-success border border-status-success/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                              : m.membership_status === 'alumni'
                              ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                              : 'bg-status-pending/10 text-status-pending border border-status-pending/30 animate-pulse'
                          }`}
                        >
                          {m.membership_status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-status-success" />}
                          {formatMembershipStatus(m.membership_status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {m.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-accent-primary bg-accent-primary/10 border border-accent-primary/30 px-3 py-1.5 rounded-lg">
                            <Shield className="w-3.5 h-3.5 text-accent-primary" />
                            <span>ROOT EXECUTIVE</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {m.role === 'member' && (
                              <Button
                                id={`promote-organizer-${m.id}`}
                                onClick={() => handleRoleChange(m.id, 'organizer', m.full_name)}
                                size="sm"
                                variant="outline"
                                className="text-[10px] font-bold tracking-wider h-8 px-3 rounded-lg text-accent-primary border-accent-primary/30 hover:bg-accent-primary/10 hover:border-accent-primary transition-all cursor-pointer"
                              >
                                SET CAPTAIN
                              </Button>
                            )}
                            {m.role === 'organizer' && (
                              <Button
                                id={`demote-member-${m.id}`}
                                onClick={() => handleRoleChange(m.id, 'member', m.full_name)}
                                size="sm"
                                variant="outline"
                                className="text-[10px] font-bold tracking-wider h-8 px-3 rounded-lg text-slate-300 border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                DEMOTE
                              </Button>
                            )}
                            <Button
                              id={`promote-admin-${m.id}`}
                              onClick={() => handleRoleChange(m.id, 'admin', m.full_name)}
                              size="sm"
                              variant="outline"
                              className="text-[10px] font-bold tracking-wider h-8 px-3 rounded-lg text-accent-purple border-accent-purple/30 hover:bg-accent-purple/10 hover:border-accent-purple transition-all cursor-pointer"
                            >
                              MAKE DIRECTOR
                            </Button>
                            <div className="h-4 w-px bg-border-default mx-1" />
                            <Button
                              onClick={() => handleRotateIdToken(m.id, m.full_name)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-white hover:bg-[#1A2333] transition-colors cursor-pointer"
                              title="Rotate QR Token (Security Incident)"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              id={`remove-member-${m.id}`}
                              onClick={() => handleRemoveMember(m.id, m.full_name)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-status-destructive hover:text-white hover:bg-status-destructive transition-colors cursor-pointer"
                              title={`Remove ${m.full_name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked-Row Pattern */}
            <div className="md:hidden divide-y divide-border-default p-4">
              {members.map((m) => (
                <div key={m.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-text-primary text-sm font-sans">{m.full_name}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-mono font-bold tracking-wider ${
                        m.membership_status === 'active'
                          ? 'bg-status-success/10 text-status-success border border-status-success/30'
                          : m.membership_status === 'alumni'
                          ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                          : 'bg-status-pending/10 text-status-pending border border-status-pending/30'
                      }`}
                    >
                      {formatMembershipStatus(m.membership_status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1A2333] border border-border-default text-accent-primary font-bold font-mono">
                      <Shield className="w-3 h-3" />
                      {m.devstudio_id || 'ID Pending'}
                    </span>
                    <RoleBadge role={m.role} />
                  </div>

                  <div className="text-[10px] text-text-muted font-mono bg-bg-page px-2 py-1 rounded inline-block">{m.email}</div>

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {m.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/30 px-3 py-1.5 rounded-lg w-full justify-center">
                        <Shield className="w-4 h-4 text-accent-primary" />
                        <span>ROOT EXECUTIVE</span>
                      </span>
                    ) : (
                      <>
                        {m.role === 'member' && (
                          <Button
                            id={`mobile-promote-organizer-${m.id}`}
                            onClick={() => handleRoleChange(m.id, 'organizer', m.full_name)}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-[10px] font-bold font-mono min-h-[40px] px-3 rounded-xl text-accent-primary border-accent-primary/40 hover:bg-accent-primary/10"
                          >
                            SET CAPTAIN
                          </Button>
                        )}
                        {m.role === 'organizer' && (
                          <Button
                            id={`mobile-demote-member-${m.id}`}
                            onClick={() => handleRoleChange(m.id, 'member', m.full_name)}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-[10px] font-bold font-mono min-h-[40px] px-3 rounded-xl text-slate-300 border-slate-700 hover:bg-slate-800"
                          >
                            DEMOTE
                          </Button>
                        )}
                        <Button
                          id={`mobile-promote-admin-${m.id}`}
                          onClick={() => handleRoleChange(m.id, 'admin', m.full_name)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-[10px] font-bold font-mono min-h-[40px] px-3 rounded-xl text-accent-purple border-accent-purple/40 hover:bg-accent-purple/10"
                        >
                          MAKE DIRECTOR
                        </Button>
                        <Button
                          onClick={() => handleRotateIdToken(m.id, m.full_name)}
                          size="icon"
                          variant="outline"
                          className="w-[40px] h-[40px] rounded-xl border-border-default text-text-muted"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          id={`mobile-remove-member-${m.id}`}
                          onClick={() => handleRemoveMember(m.id, m.full_name)}
                          size="icon"
                          variant="outline"
                          className="w-[40px] h-[40px] rounded-xl border-red-500/40 text-status-destructive hover:bg-status-destructive hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Pending Applications */}
      {selectedTab === 'applications' && (
        <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-5 border-b border-border-default bg-bg-surface/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-status-pending/10 rounded-lg">
                   <UserCheck className="w-5 h-5 text-status-pending" />
                 </div>
                 <div>
                   <CardTitle className="text-lg font-black text-text-primary font-sans">
                     Pending Institutional Membership Applications
                   </CardTitle>
                   <p className="text-xs text-text-muted mt-0.5 font-sans">
                     Verified @mite.ac.in accounts waiting for Dev Director approval.
                   </p>
                 </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  <span className="text-[10px] font-mono text-status-success font-bold uppercase tracking-wider">Real-Time Sync Active</span>
                </div>
                <Button
                  id="refresh-applications-btn"
                  onClick={handleRefreshApplications}
                  disabled={isRefreshingApps}
                  variant="outline"
                  className="font-sans text-xs font-bold gap-2 min-h-[44px] rounded-xl border-border-default hover:bg-bg-page transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-accent-primary ${isRefreshingApps ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingApps ? 'Syncing...' : 'Sync Applications'}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!isLoaded ? (
              <div className="divide-y divide-border-default">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex gap-4 w-full">
                      <div className="w-10 h-10 rounded-xl bg-border-default animate-pulse" />
                      <div className="space-y-3 flex-1">
                        <div className="h-5 w-48 bg-border-default rounded animate-pulse" />
                        <div className="h-4 w-64 bg-border-default rounded animate-pulse" />
                        <div className="h-3 w-32 bg-border-default rounded animate-pulse mt-2" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 sm:mt-0">
                      <div className="h-11 w-32 bg-border-default rounded-xl animate-pulse" />
                      <div className="h-11 w-32 bg-border-default rounded-xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingMembers.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-bg-surface border border-border-default flex items-center justify-center shadow-lg">
                   <CheckCircle2 className="w-8 h-8 text-status-success/50" />
                </div>
                <div>
                   <p className="text-sm font-black text-text-primary font-sans">Inbox Zero</p>
                   <p className="text-xs text-text-muted font-mono mt-1">No membership applications currently pending review.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {pendingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-6 hover:bg-bg-page/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center text-text-muted flex-shrink-0">
                          <Users className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="font-black text-text-primary text-base font-sans">{member.full_name}</div>
                         <div className="text-xs text-text-muted font-mono mt-0.5 bg-bg-surface px-1.5 py-0.5 rounded border border-border-default inline-block">{member.email}</div>
                         <div className="text-[10px] text-text-muted font-mono mt-2 uppercase tracking-wider flex items-center gap-1.5">
                           <Clock className="w-3 h-3" />
                           Applied: {new Date(member.created_at).toLocaleDateString()}
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        id={`reject-member-${member.id}`}
                        onClick={() => handleStatusChange(member.id, 'rejected', member.full_name)}
                        disabled={processingMemberIds.includes(member.id)}
                        variant="outline"
                        className="font-sans text-xs font-bold gap-2 min-h-[44px] rounded-xl border-border-default hover:text-status-destructive hover:border-status-destructive/50 transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </Button>
                      <Button
                        id={`approve-member-${member.id}`}
                        onClick={() => handleStatusChange(member.id, 'active', member.full_name)}
                        disabled={processingMemberIds.includes(member.id)}
                        className="font-sans text-xs font-bold gap-2 min-h-[44px] rounded-xl bg-status-success hover:bg-status-success/90 text-on-accent shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all cursor-pointer w-full sm:w-auto min-w-[160px]"
                      >
                        {processingMemberIds.includes(member.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Approve Membership</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Photo Moderation Queue */}
      {selectedTab === 'photos' && (
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-text-primary">
              <Camera className="w-4 h-4 text-accent-purple" />
              <span>Digital ID Photo Moderation Queue</span>
            </CardTitle>
            <p className="text-xs text-text-muted">
              Student photo uploads pending review before appearing on official ID cards and Wallet Passes.
            </p>
          </CardHeader>

          <CardContent>
            {pendingPhotos.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-mono text-xs">
                No student photos currently awaiting moderation.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPhotos.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl bg-bg-surface border border-border-default flex items-start gap-4"
                  >
                    <img
                      src={member.pending_photo_url || ''}
                      alt={member.full_name}
                      className="w-16 h-16 rounded-xl object-cover border border-border-default flex-shrink-0"
                    />

                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{member.full_name}</div>
                        <div className="text-xs text-text-muted font-mono">{member.email}</div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          id={`approve-photo-${member.id}`}
                          onClick={() => handlePhotoModerate(member.id, true, member.full_name)}
                          size="sm"
                          variant="default"
                          className="text-xs font-mono gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          id={`reject-photo-${member.id}`}
                          onClick={() => handlePhotoModerate(member.id, false, member.full_name)}
                          size="sm"
                          variant="destructive"
                          className="text-xs font-mono gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Digital Certificates */}
      {selectedTab === 'certificates' && (
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-text-primary">
                <Award className="w-4 h-4 text-accent-amber" />
                <span>Verifiable Certificates Registry</span>
              </CardTitle>
              <p className="text-xs text-text-muted mt-0.5">
                Issue cryptographically verifiable credentials for hackathon victories, workshops, and engineering excellence.
              </p>
            </div>

            <Button
              id="open-issue-cert-btn"
              onClick={() => {
                setIsIssueCertOpen(true)
                setIssuedRawToken(null)
              }}
              size="sm"
              variant="default"
              className="gap-2 font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Certificate</span>
            </Button>
          </CardHeader>

          <CardContent>
            {certificates.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-mono text-xs">
                No certificates issued yet. Issue verified credentials to active Dev Mates.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="text-text-muted border-b border-border-default">
                    <tr>
                      <th className="py-2.5 px-3">Title & Category</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Token Digest</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default text-text-muted">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-bg-page/50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-text-primary">{cert.title}</div>
                          <span className="text-[10px] text-accent-amber uppercase">{cert.certificate_type}</span>
                        </td>
                        <td className="py-2.5 px-3 text-text-primary">
                          {cert.profile?.full_name || 'Member'}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">{cert.issue_date}</td>
                        <td className="py-2.5 px-3 text-text-muted font-mono">
                          {cert.raw_token_preview}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                              cert.status === 'valid'
                                ? 'bg-status-success/10 text-status-success border border-status-success/30'
                                : 'bg-status-destructive/10 text-status-destructive border border-status-destructive/30'
                            }`}
                          >
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          {cert.status === 'valid' && (
                            <Button
                              onClick={() => handleRevokeCert(cert.id, cert.title)}
                              size="sm"
                              variant="outline"
                              className="text-[10px] font-mono h-6 px-2 text-status-destructive border-status-destructive/30 hover:bg-status-destructive/10"
                            >
                              Revoke
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRotateCertToken(cert.id, cert.title)}
                            size="sm"
                            variant="ghost"
                            className="text-[10px] font-mono h-6 px-1.5 text-text-muted hover:text-text-primary"
                            title="Rotate Token"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Alumni Lifecycle & Graduation Review */}
      {selectedTab === 'alumni' && (
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-text-primary">
              <GraduationCap className="w-4 h-4 text-accent-primary" />
              <span>Graduation Review Queue & Alumni Transition</span>
            </CardTitle>
            <p className="text-xs text-text-muted">
              Students past their graduation year ({currentAcademicThreshold}) are flagged for administrative transition to <strong className="text-accent-primary">DevStudio Alumni</strong> status.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Review Candidates */}
            <div>
              <h4 className="text-xs font-mono uppercase text-text-muted tracking-wider mb-3">
                Graduation Review Candidates ({graduationCandidates.length})
              </h4>

              {graduationCandidates.length === 0 ? (
                <div className="py-6 text-center text-text-muted font-mono text-xs border border-dashed border-border-default rounded-xl">
                  No active members currently past academic year {currentAcademicThreshold}.
                </div>
              ) : (
                <div className="space-y-3">
                  {graduationCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-4 rounded-xl bg-bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-text-primary text-sm">
                          {candidate.full_name}
                        </div>
                        <div className="text-xs text-text-muted font-mono">
                          {candidate.email} • USN: {candidate.usn || 'N/A'} • Class of {candidate.academic_year}
                        </div>
                      </div>

                      <Button
                        id={`promote-alumni-${candidate.id}`}
                        onClick={() => handleStatusChange(candidate.id, 'alumni', candidate.full_name)}
                        size="sm"
                        variant="default"
                        className="text-xs font-mono gap-1.5"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Transition to Alumni</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Alumni List */}
            {activeAlumni.length > 0 && (
              <div className="pt-4 border-t border-border-default">
                <h4 className="text-xs font-mono uppercase text-text-muted tracking-wider mb-3">
                  Verified DevStudio Alumni ({activeAlumni.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeAlumni.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg bg-bg-page border border-border-default text-xs font-mono"
                    >
                      <div className="text-text-primary font-semibold">{a.full_name}</div>
                      <div className="text-text-muted text-[11px]">{a.email}</div>
                      <div className="text-accent-primary text-[10px] mt-1">🎓 DevStudio Alumni</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: Immutable Audit Logs */}
      {selectedTab === 'audit' && (
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-text-primary">
              <History className="w-4 h-4 text-accent-primary" />
              <span>Security Audit Log History</span>
            </CardTitle>
            <p className="text-xs text-text-muted">
              Chronological log of administrative actions, membership approvals, role promotions, and security events.
            </p>
          </CardHeader>

          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-mono text-xs">
                No audit entries recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="text-text-muted border-b border-border-default">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Target</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default text-text-muted">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-page/50">
                        <td className="py-2.5 px-3 text-text-muted whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-bg-page text-accent-primary border border-border-default">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-primary">{log.actor_name || 'System'}</td>
                        <td className="py-2.5 px-3 text-text-muted">{log.target_type}:{log.target_id.slice(0, 8)}</td>
                        <td className="py-2.5 px-3 text-text-muted max-w-xs truncate">
                          {JSON.stringify(log.after_value || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issue Certificate Modal */}
      {isIssueCertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold font-mono text-text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-amber" />
                <span>Issue Verifiable Certificate</span>
              </h3>
              <button
                onClick={() => setIsIssueCertOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {issuedRawToken ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 space-y-2">
                  <div className="flex items-center gap-2 text-status-success font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Certificate Issued Successfully!</span>
                  </div>
                  <p className="text-text-muted">
                    The cryptographic verification token is generated. Direct public verification URL:
                  </p>
                  <div className="p-2.5 rounded bg-bg-page border border-border-default text-accent-primary break-all select-all">
                    {window.location.origin}/verify-certificate/{issuedRawToken}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      window.open(`/verify-certificate/${issuedRawToken}`, '_blank')
                    }}
                    size="sm"
                    variant="default"
                    className="font-mono gap-1"
                  >
                    <span>Open Verification</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => setIsIssueCertOpen(false)}
                    size="sm"
                    variant="outline"
                    className="font-mono"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueCertSubmit} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-text-muted">Recipient Dev Mate *</label>
                  <select
                    required
                    value={certRecipientId}
                    onChange={(e) => setCertRecipientId(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg p-2.5 text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="">Select recipient...</option>
                    {members
                      .filter((m) => m.membership_status === 'active' || m.membership_status === 'alumni')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">Certificate Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellence in Full-Stack Engineering"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg p-2.5 text-text-primary focus:border-accent-primary focus:outline-none placeholder:text-text-muted/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">Award Category</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as CertificateType)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg p-2.5 text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="merit">Merit Award</option>
                    <option value="winner">Hackathon / Sprint Winner</option>
                    <option value="completion">Workshop Completion</option>
                    <option value="participation">Active Participation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">Description & Justification *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the milestone or project delivered..."
                    value={certDesc}
                    onChange={(e) => setCertDesc(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg p-2.5 text-text-primary focus:border-accent-primary focus:outline-none placeholder:text-text-muted/60"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-default">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsIssueCertOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    disabled={isIssuing}
                    className="gap-2 font-mono"
                  >
                    {isIssuing ? 'Issuing...' : 'Issue Credential'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0B0F19] border border-blue-600/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-bold font-sans">Add New Club Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Full Student Name *</label>
                <Input
                  id="add-member-fullname"
                  required
                  placeholder="e.g. Aditya Shenoy"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white focus:border-blue-500 rounded-xl h-10"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Institutional Email (@mite.ac.in) *</label>
                <Input
                  id="add-member-email"
                  type="email"
                  required
                  placeholder="aditya@mite.ac.in"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white focus:border-blue-500 rounded-xl h-10"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Must be an institutional @mite.ac.in address</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Role Assignment</label>
                  <select
                    id="add-member-role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TechnicalRole)}
                    className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none text-xs font-sans"
                  >
                    <option value="member">Dev Mate (Member)</option>
                    <option value="organizer">Dev Captain (Organizer)</option>
                    <option value="admin">Dev Director (Executive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Academic Year</label>
                  <Input
                    id="add-member-year"
                    type="number"
                    placeholder="2026"
                    value={newMemberYear}
                    onChange={(e) => setNewMemberYear(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Department / Branch</label>
                  <Input
                    id="add-member-branch"
                    placeholder="Computer Science"
                    value={newMemberBranch}
                    onChange={(e) => setNewMemberBranch(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus:border-blue-500 rounded-xl h-10"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">USN (Optional)</label>
                  <Input
                    id="add-member-usn"
                    placeholder="4MT23CS012"
                    value={newMemberUsn}
                    onChange={(e) => setNewMemberUsn(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="rounded-xl border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  id="btn-submit-add-member"
                  type="submit"
                  size="sm"
                  disabled={isAddingMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl btn-solid-blue cursor-pointer gap-1.5 shadow-md shadow-blue-600/30"
                >
                  {isAddingMember ? 'Provisioning...' : 'Add Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
