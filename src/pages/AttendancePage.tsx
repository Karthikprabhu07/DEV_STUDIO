import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  History,
  Shield,
  ArrowRight,
  Clock,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/contexts/EventsContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { CameraQrScanner } from '@/components/attendance/CameraQrScanner'
import { ScanFeedbackCard } from '@/components/attendance/ScanFeedbackCard'
import { EndAttendanceModal } from '@/components/attendance/EndAttendanceModal'
import { AttendanceHistoryView } from '@/components/attendance/AttendanceHistoryView'
import {
  AttendanceSession,
  AttendanceRecord,
  ScanResult,
  fetchAttendanceSessions,
  createAttendanceSession,
  fetchSessionRecords,
  processAttendanceScan,
  finalizeAttendanceSession,
  deleteAttendanceSession,
} from '@/lib/attendanceService'

export const AttendancePage: React.FC = () => {
  const { profile, isStaff, isAdmin, members } = useAuth()
  const { events } = useEvents()

  // Tab: 'SCANNER' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'HISTORY'>('SCANNER')

  // Sessions state
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null)
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  // New session form state
  const [newTitle, setNewTitle] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newStartTime, setNewStartTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  )
  const [newEndTime, setNewEndTime] = useState('')
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Live scanner state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [isEndModalOpen, setIsEndModalOpen] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [completionBanner, setCompletionBanner] = useState<{
    present: number
    absent: number
    total: number
  } | null>(null)

  // Filter only active Dev Mates (eligible student cohort - strictly exclude Dev Captains and Dev Directors)
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.membership_status === 'active' && m.role === 'member')
  }, [members])

  // Load Sessions
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    const { sessions: loadedSessions } = await fetchAttendanceSessions()
    setSessions(loadedSessions)

    // Check if there is an active session
    const currentActive = loadedSessions.find((s) => s.status === 'ACTIVE')
    if (currentActive) {
      setActiveSession(currentActive)
      const records = await fetchSessionRecords(currentActive.id)
      setSessionRecords(records)
    } else {
      setActiveSession(null)
      setSessionRecords([])
    }
    setIsLoadingSessions(false)
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Auto-sync title when event is selected in creation form
  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find((e) => e.id === selectedEventId)
      if (ev) {
        setNewTitle(ev.title)
        if (ev.start_time) {
          const d = new Date(ev.start_time)
          setNewDate(d.toISOString().split('T')[0])
          setNewStartTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
        }
      }
    }
  }, [selectedEventId, events])

  // Start Attendance Session
  const handleStartAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !isStaff) return

    const titleToUse = newTitle.trim() || 'DevStudio Cohort Session'
    setIsCreatingSession(true)
    setCreateError(null)
    setCompletionBanner(null)

    const res = await createAttendanceSession({
      title: titleToUse,
      eventId: selectedEventId || null,
      startedBy: profile.id,
      startedByName: profile.full_name,
      date: newDate,
    })

    setIsCreatingSession(false)

    if (res.success && res.session) {
      setActiveSession(res.session)
      setSessions((prev) => [res.session!, ...prev.filter((s) => s.id !== res.session!.id)])
      setSessionRecords([])
      setNewTitle('')
      setSelectedEventId('')
    } else {
      setCreateError(res.error || 'Failed to start attendance session.')
    }
  }

  // Handle scanned QR Code from Camera
  const handleQrScan = async (scannedText: string) => {
    if (!activeSession || isProcessingScan || !profile) return

    setIsProcessingScan(true)
    setScanResult(null)

    const result = await processAttendanceScan(
      activeSession.id,
      scannedText,
      {
        id: profile.id,
        role: profile.role,
        membership_status: profile.membership_status,
      },
      activeMembers,
      members,
      sessionRecords
    )

    setScanResult(result)
    setIsProcessingScan(false)

    // If successfully marked present, update live list immediately
    if (result.success && result.code === 'PRESENT') {
      const newRec: AttendanceRecord = {
        id: result.record_id || 'rec-' + Date.now(),
        session_id: activeSession.id,
        member_id: result.member_id || result.devstudio_id || 'mem-' + Date.now(),
        status: 'PRESENT',
        recorded_by: profile.id,
        recorded_at: result.recorded_at || new Date().toISOString(),
        member_name: result.member_name,
        devstudio_id: result.devstudio_id,
        avatar_url: result.avatar_url,
      }

      setSessionRecords((prev) => {
        const filtered = prev.filter(
          (r) =>
            r.member_id !== newRec.member_id &&
            (!newRec.devstudio_id || r.devstudio_id !== newRec.devstudio_id) &&
            (!newRec.member_name || r.member_name !== newRec.member_name)
        )
        return [newRec, ...filtered]
      })
    }

    // Auto-dismiss feedback after 4 seconds to return scanner to clean ready state
    setTimeout(() => {
      setScanResult((prev) => (prev === result ? null : prev))
    }, 4500)
  }

  // Confirm End Attendance
  const handleConfirmEndAttendance = async () => {
    if (!activeSession || !profile) return

    setIsFinalizing(true)
    const res = await finalizeAttendanceSession(activeSession.id, activeMembers, profile.id)
    setIsFinalizing(false)
    setIsEndModalOpen(false)

    if (res.success) {
      setCompletionBanner({
        present: res.counts.present,
        absent: res.counts.absent,
        total: res.counts.total,
      })
      setActiveSession(null)
      loadSessions()
    }
  }

  // Reopen session (DEV_DIRECTOR only)
  const handleReopenSession = async (session: AttendanceSession) => {
    if (!isAdmin) return
    setActiveSession({ ...session, status: 'ACTIVE' })
    setActiveTab('SCANNER')
    const records = await fetchSessionRecords(session.id)
    setSessionRecords(records)
  }

  // Delete session handler (cascades database records and updates state)
  const handleDeleteSession = async (session: AttendanceSession) => {
    const res = await deleteAttendanceSession(session.id)
    if (res.success) {
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      if (activeSession?.id === session.id) {
        setActiveSession(null)
        setSessionRecords([])
        setScanResult(null)
      }
    }
  }

  const [isDeleteActiveOpen, setIsDeleteActiveOpen] = useState(false)
  const [isDeletingActive, setIsDeletingActive] = useState(false)

  // Calculate live counters
  const totalCohort = activeMembers.length
  const presentCount = sessionRecords.filter((r) => r.status === 'PRESENT').length
  const notScannedCount = Math.max(0, totalCohort - presentCount)

  if (isLoadingSessions) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-28 md:pb-16 animate-pulse">
      <Helmet>
        <title>Attendance | DevStudio</title>
        <meta name="robots" content="noindex" />
      </Helmet>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
          <div className="space-y-3 w-full max-w-md">
            <div className="h-3 w-32 bg-bg-surface rounded" />
            <div className="h-8 w-64 bg-bg-surface rounded" />
            <div className="h-3 w-96 bg-bg-surface rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-bg-surface rounded-xl" />
            <div className="h-10 w-32 bg-bg-surface rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
          <div className="lg:col-span-7 space-y-4">
             <div className="h-14 w-full bg-bg-surface rounded-2xl" />
             <div className="h-[450px] w-full bg-bg-surface rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-5">
             <div className="h-32 w-full bg-bg-surface rounded-2xl" />
             <div className="h-96 w-full bg-bg-surface rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 1. DEV MATE VIEW (Role Gated: Non-staff users cannot scan or manage)
  // =========================================================================
  if (!isStaff) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-accent-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent-primary font-bold">
                Dev Mate
              </span>
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight font-sans">My Attendance</h1>
            <p className="text-sm text-text-muted mt-1 font-sans">
              DevStudio attendance is conducted in-person by Dev Captains and Dev Directors.
            </p>
          </div>

          <Link to="/id-card">
            <Button
              className="font-sans text-xs font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent gap-2 shadow-lg shadow-blue-500/25 min-h-[44px] rounded-xl border border-transparent hover:border-white transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Show My DevStudio ID</span>
            </Button>
          </Link>
        </div>

        <Card className="border-border-default bg-[#0A0F1D] p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-bg-page border border-border-default flex items-center justify-center text-accent-primary flex-shrink-0 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent opacity-50 rounded-2xl" />
              <QrCode className="w-12 h-12 relative z-10" />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-lg font-black text-text-primary font-sans">
                How DevStudio Roll Call Works
              </h3>
              <p className="text-sm text-text-muted leading-relaxed font-sans max-w-xl">
                When attending club workshops, hackathons, or meetings, open your{' '}
                <strong className="text-text-primary font-mono bg-bg-page px-1.5 py-0.5 rounded border border-border-default">Digital ID Card</strong> and present
                your cryptographic QR code to the Dev Captain or Director at the entrance.
              </p>
              <div className="pt-3">
                <Link
                  to="/id-card"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-primary font-bold hover:text-blue-400 transition-colors"
                >
                  <span>Open 3D Digital ID Card</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-text-muted" />
            <h3 className="text-lg font-bold text-text-primary font-sans">Recorded Club Sessions</h3>
          </div>
          <Card className="border-border-default bg-[#0A0F1D] rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <EmptyState
                icon={CheckCircle2}
                title="No Recorded Sessions Yet"
                description="Your attendance records will appear here as Dev Captains scan your ID card at physical club events."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. DEV CAPTAIN / DEV DIRECTOR VIEW (Authorized Scanner Terminal)
  // =========================================================================
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-28 md:pb-16">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent-primary font-bold">
              Attendance Management Terminal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-sans">
            DevStudio QR Scanner
          </h1>
          <p className="text-sm text-text-muted mt-1 font-sans">
            Verify official Dev Mate digital ID cards via high-precision 256-bit cryptographic QR scan.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0A0F1D] p-1.5 rounded-xl border border-border-default font-mono text-xs shadow-inner">
          <button
            onClick={() => setActiveTab('SCANNER')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold ${
              activeTab === 'SCANNER'
                ? 'bg-bg-page text-text-primary shadow-sm border border-border-default/50'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold ${
              activeTab === 'HISTORY'
                ? 'bg-bg-page text-text-primary shadow-sm border border-border-default/50'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Session History</span>
          </button>
        </div>
      </div>

      {completionBanner && (
        <div className="p-5 rounded-2xl bg-[#0A0F1D] border border-status-success/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-4 font-mono">
            <div className="w-12 h-12 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center flex-shrink-0 border border-status-success/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-primary">ATTENDANCE COMPLETED</h4>
              <div className="text-xs text-text-muted mt-1 flex items-center gap-3">
                <span className="text-status-success font-bold">Present: {completionBanner.present}</span>
                <span className="text-slate-600">/</span>
                <span className="text-status-destructive font-bold">Absent: {completionBanner.absent}</span>
                <span className="text-slate-600">/</span>
                <span className="text-white">Total: {completionBanner.total}</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCompletionBanner(null)}
            className="font-sans font-semibold text-xs border-border-default bg-bg-page hover:bg-[#1A2333] transition-colors"
          >
            Dismiss
          </Button>
        </div>
      )}

      {activeTab === 'SCANNER' && (
        <div className="space-y-6">
          {!activeSession ? (
            <div className="max-w-2xl mx-auto pt-8">
              <Card className="border-border-default bg-[#0A0F1D] rounded-3xl shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border-default pb-5 bg-bg-surface/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-accent-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-text-primary font-sans">
                        Initialize Session
                      </CardTitle>
                      <p className="text-xs text-text-muted mt-0.5 font-sans">
                        Select a scheduled club event or create a custom session.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <form onSubmit={handleStartAttendance} className="space-y-5">
                    {createError && (
                      <div className="p-3.5 rounded-xl bg-status-destructive/10 border border-status-destructive/20 text-xs font-mono text-status-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{createError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-sans text-text-muted uppercase tracking-wider">
                        Linked Event <span className="text-text-muted/50 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full h-12 rounded-xl bg-bg-page border border-border-default px-4 text-sm font-sans text-text-primary focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all outline-none"
                      >
                        <option value="">-- Custom Ad-hoc Session --</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({new Date(ev.start_time).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-sans text-text-muted uppercase tracking-wider">
                        Session Title <span className="text-status-destructive">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Full Stack Development Workshop"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-bg-page border-border-default text-sm font-sans font-medium px-4 focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-sans text-text-muted uppercase tracking-wider">Date</label>
                        <Input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="h-12 rounded-xl bg-bg-page border-border-default text-sm font-mono px-4"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-sans text-text-muted uppercase tracking-wider">Start</label>
                        <Input
                          type="time"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="h-12 rounded-xl bg-bg-page border-border-default text-sm font-mono px-4"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-sans text-text-muted uppercase tracking-wider">End</label>
                        <Input
                          type="time"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="h-12 rounded-xl bg-bg-page border-border-default text-sm font-mono px-4"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isCreatingSession}
                      className="w-full font-sans text-sm font-bold bg-[#3B82F6] hover:bg-blue-600 text-on-accent h-12 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] mt-4 transition-all cursor-pointer"
                    >
                      {isCreatingSession ? 'INITIALIZING TERMINAL...' : 'START SCANNER TERMINAL'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {sessions.filter((s) => s.status === 'ACTIVE').length > 0 && (
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-border-default flex-1" />
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest px-2">
                      Resume Ongoing Session
                    </span>
                    <div className="h-px bg-border-default flex-1" />
                  </div>
                  {sessions
                    .filter((s) => s.status === 'ACTIVE')
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSession(s)
                          fetchSessionRecords(s.id).then(setSessionRecords)
                        }}
                        className="p-5 rounded-2xl bg-[#0A0F1D] border border-status-success/30 flex items-center justify-between cursor-pointer hover:bg-status-success/5 transition-all hover:border-status-success/50 group shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-3 h-3 rounded-full bg-status-success animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <div>
                            <div className="text-base font-bold text-text-primary font-sans">{s.title}</div>
                            <div className="text-xs font-mono text-text-muted mt-1">
                              Started: {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-bg-page text-text-muted group-hover:text-status-success group-hover:bg-status-success/10 transition-colors">
                           <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: CAMERA (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="p-4 rounded-2xl bg-[#0A0F1D] border border-border-default flex items-center justify-between shadow-lg">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                        LIVE
                      </span>
                      <h2 className="text-base font-black text-text-primary truncate font-sans">
                        {activeSession.title}
                      </h2>
                    </div>
                    <div className="text-xs font-mono text-text-muted mt-1.5 flex items-center gap-2">
                      <span>{new Date(activeSession.session_date).toLocaleDateString()}</span>
                      <span className="text-slate-700">/</span>
                      <span>By {activeSession.started_by_name || 'Admin'}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEndModalOpen(true)}
                    variant="destructive"
                    className="font-sans text-xs font-bold bg-status-destructive hover:bg-status-destructive/90 text-white flex-shrink-0 h-10 px-4 rounded-xl shadow-lg shadow-status-destructive/20 transition-all cursor-pointer"
                  >
                    End Session
                  </Button>
                </div>

                <div className="rounded-3xl overflow-hidden border border-border-default shadow-2xl bg-[#000000] ring-1 ring-white/5 relative">
                   <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                      <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white font-bold tracking-wider">
                         OPTICAL SCANNER
                      </div>
                   </div>
                  <CameraQrScanner
                    onScanSuccess={handleQrScan}
                    isProcessing={isProcessingScan}
                    disabled={isFinalizing}
                  />
                </div>

                <ScanFeedbackCard result={scanResult} onDismiss={() => setScanResult(null)} />
              </div>

              {/* RIGHT COLUMN: METRICS & LOGS (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0A0F1D] border border-border-default shadow-lg">
                    <span className="text-[10px] font-sans font-bold uppercase text-text-muted tracking-wider block mb-1">
                      Present
                    </span>
                    <div className="text-4xl font-black text-status-success font-mono">
                      {presentCount}
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0A0F1D] border border-border-default shadow-lg">
                    <span className="text-[10px] font-sans font-bold uppercase text-text-muted tracking-wider block mb-1">
                      Remaining
                    </span>
                    <div className="text-4xl font-black text-text-muted font-mono">
                      {notScannedCount}
                    </div>
                  </div>
                </div>

                {/* Live Feed */}
                <Card className="border-border-default bg-[#0A0F1D] rounded-2xl shadow-lg flex flex-col h-[500px]">
                  <CardHeader className="p-4 border-b border-border-default bg-bg-surface/30 flex flex-row items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-accent-primary" />
                      <CardTitle className="text-xs font-sans font-bold uppercase tracking-wider text-text-primary">
                        Terminal Log
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    {sessionRecords.filter((r) => r.status === 'PRESENT').length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-60">
                        <QrCode className="w-10 h-10 text-text-muted" />
                        <p className="text-xs font-mono text-text-muted">Awaiting first scan...</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                        {sessionRecords
                          .filter((r) => r.status === 'PRESENT')
                          .slice(0, 50)
                          .map((rec) => {
                            const timeStr = new Date(rec.recorded_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })

                            return (
                              <div
                                key={rec.id}
                                className="p-3 flex items-start justify-between gap-3 font-mono text-xs rounded-xl bg-bg-page border border-border-default hover:border-border-default/80 transition-colors"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-status-success mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                  <div className="min-w-0">
                                    {(() => {
                                      const memberProfile = members.find(
                                        (m) =>
                                          m.id === rec.member_id ||
                                          (rec.devstudio_id && m.devstudio_id?.toLowerCase() === rec.devstudio_id?.toLowerCase())
                                      )
                                      const displayName =
                                        rec.member_name && rec.member_name !== 'DevStudio Member'
                                          ? rec.member_name
                                          : memberProfile?.full_name && memberProfile.full_name !== 'DevStudio Member'
                                          ? memberProfile.full_name
                                          : memberProfile?.email
                                          ? memberProfile.email.split('@')[0]
                                          : rec.member_name || 'DevStudio Member'
                                      const displayId = rec.devstudio_id || memberProfile?.devstudio_id || 'ID Pending'
                                      
                                      return (
                                        <>
                                          <div className="font-bold text-text-primary truncate font-sans text-sm">
                                            {displayName}
                                          </div>
                                          <div className="text-[10px] text-text-muted mt-0.5">
                                            {displayId}
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                                  <span className="text-[10px] text-text-muted">{timeStr}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-status-success/10 text-status-success border border-status-success/20">
                                    VERIFIED
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <AttendanceHistoryView
          sessions={sessions}
          isAdmin={isAdmin}
          members={members}
          isLoading={isLoadingSessions}
          onReopenSession={handleReopenSession}
          onDeleteSession={handleDeleteSession}
          onSelectActiveSession={(session) => {
            setActiveSession(session)
            setActiveTab('SCANNER')
            fetchSessionRecords(session.id).then(setSessionRecords)
          }}
        />
      )}

      {activeSession && (
        <EndAttendanceModal
          isOpen={isEndModalOpen}
          sessionTitle={activeSession.title}
          presentCount={presentCount}
          notScannedCount={notScannedCount}
          totalEligible={totalCohort}
          isSubmitting={isFinalizing}
          onConfirm={handleConfirmEndAttendance}
          onCancel={() => setIsEndModalOpen(false)}
        />
      )}

      {activeSession && isDeleteActiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-status-destructive/40 bg-[#0A0F1D] shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-status-destructive/10 text-status-destructive flex items-center justify-center flex-shrink-0 border border-status-destructive/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h4 className="text-lg font-black text-text-primary font-sans">Delete Active Session</h4>
                <p className="text-xs text-text-muted mt-1 font-sans leading-relaxed">This will discard the session and all {presentCount} scanned logs permanently.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeletingActive}
                onClick={() => setIsDeleteActiveOpen(false)}
                className="font-sans font-bold text-xs h-10 px-5 border-border-default hover:bg-bg-page hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeletingActive}
                onClick={async () => {
                  setIsDeletingActive(true)
                  try {
                    await handleDeleteSession(activeSession)
                    setIsDeleteActiveOpen(false)
                  } finally {
                    setIsDeletingActive(false)
                  }
                }}
                className="font-sans font-bold text-xs h-10 px-5 bg-status-destructive hover:bg-status-destructive/90 text-white gap-2 transition-colors cursor-pointer"
              >
                {isDeletingActive ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
