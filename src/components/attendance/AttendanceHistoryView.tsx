import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  ChevronRight,
  X,
  RotateCcw,
  Search,
  Download,
  Trash2,
} from 'lucide-react'
import { AttendanceSession, AttendanceRecord, fetchSessionRecords } from '@/lib/attendanceService'
import { generateAttendancePdf } from '@/lib/attendancePdf'
import { Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'

interface AttendanceHistoryViewProps {
  sessions: AttendanceSession[]
  isAdmin: boolean
  members: Profile[]
  onReopenSession?: (session: AttendanceSession) => void
  onSelectActiveSession?: (session: AttendanceSession) => void
  onDeleteSession?: (session: AttendanceSession) => Promise<boolean | void> | boolean | void
  isLoading?: boolean
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  sessions,
  isAdmin,
  members,
  onReopenSession,
  onSelectActiveSession,
  onDeleteSession,
  isLoading = false,
}) => {
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [memberFilter, setMemberFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Load records when a session is selected
  useEffect(() => {
    if (!selectedSession) return

    let isMounted = true
    setIsLoadingRecords(true)

    fetchSessionRecords(selectedSession.id)
      .then((records) => {
        if (isMounted) {
          setSessionRecords(records)
          setIsLoadingRecords(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingRecords(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedSession])

  // Filter strictly cohort student records (exclude Dev Directors and Dev Captains)
  const cohortRecords = sessionRecords.filter((r) => {
    const prof = members.find(
      (m) => m.id === r.member_id || (r.devstudio_id && m.devstudio_id === r.devstudio_id)
    )
    return prof?.role !== 'admin' && prof?.role !== 'organizer'
  })

  // Filtered session members
  const filteredRecords = cohortRecords.filter((r) => {
    if (memberFilter !== 'ALL' && r.status !== memberFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const prof = members.find(
      (m) => m.id === r.member_id || (r.devstudio_id && m.devstudio_id === r.devstudio_id)
    )
    const name = r.member_name || prof?.full_name || ''
    const dsid = r.devstudio_id || prof?.devstudio_id || ''
    return name.toLowerCase().includes(q) || dsid.toLowerCase().includes(q)
  })

  const presentCount = cohortRecords.filter((r) => r.status === 'PRESENT').length
  const absentCount = cohortRecords.filter((r) => r.status === 'ABSENT').length

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0A0F1D] border-border-default overflow-hidden">
              <CardContent className="p-5">
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-12 rounded-full bg-border-default animate-pulse" />
                  <div className="h-4 w-24 rounded bg-border-default animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-border-default rounded animate-pulse mb-3" />
                <div className="h-3 w-1/2 bg-border-default rounded animate-pulse mb-4" />
                <div className="pt-3 border-t border-border-default flex justify-between">
                  <div className="h-4 w-20 bg-border-default rounded animate-pulse" />
                  <div className="h-4 w-16 bg-border-default rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Attendance Sessions Yet"
          description="Start an attendance roll call session to see recorded historical data."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const isActive = session.status === 'ACTIVE'
            const formattedDate = new Date(session.session_date).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            const startedTime = new Date(session.started_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const endedTime = session.ended_at
              ? new Date(session.ended_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null

            return (
              <Card
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="border-border-default bg-bg-surface hover:border-accent-primary/50 transition-all cursor-pointer group shadow-sm"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-status-success/20 text-status-success border border-status-success/40'
                            : 'bg-border-default text-text-muted border border-border-default'
                        }`}
                      >
                        {session.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                          <span>{formattedDate}</span>
                        </span>

                        {onDeleteSession && (
                          <button
                            type="button"
                            title="Delete Session"
                            aria-label={`Delete session ${session.title}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSessionToDelete(session)
                            }}
                            className="p-1 rounded-md text-text-muted hover:text-status-destructive hover:bg-status-destructive/15 transition-all opacity-60 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-text-primary mt-2 group-hover:text-accent-primary transition-colors">
                      {session.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-mono text-text-muted mt-1">
                      <span>Started by: {session.started_by_name || 'Staff'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent-teal" />
                        <span>{startedTime}</span>
                        {endedTime && <span>- {endedTime}</span>}
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="pt-3 border-t border-border-default flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-status-success flex items-center gap-1 font-bold">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{session.present_count ?? 0} Present</span>
                      </span>

                      <span className="text-status-destructive flex items-center gap-1 font-bold">
                        <UserX className="w-3.5 h-3.5" />
                        <span>{session.absent_count ?? 0} Absent</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && onSelectActiveSession && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectActiveSession(session)
                          }}
                          className="font-mono text-xs h-7 bg-accent-primary text-text-primary"
                        >
                          Resume Scan
                        </Button>
                      )}

                      <span className="text-xs font-mono text-accent-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border-default bg-bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-default flex items-center justify-between bg-bg-page/70">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedSession.status === 'ACTIVE'
                        ? 'bg-status-success/20 text-status-success border border-status-success/40'
                        : 'bg-border-default text-text-muted border border-border-default'
                    }`}
                  >
                    {selectedSession.status}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {new Date(selectedSession.session_date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mt-1">{selectedSession.title}</h3>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-bg-page border-b border-border-default text-center font-mono">
              <div className="p-2 rounded-xl bg-bg-surface border border-border-default">
                <span className="text-[10px] uppercase text-text-muted">Total Recorded</span>
                <div className="text-xl font-bold text-text-primary mt-0.5">{cohortRecords.length}</div>
              </div>
              <div className="p-2 rounded-xl bg-status-success/10 border border-status-success/30">
                <span className="text-[10px] uppercase text-status-success">Present</span>
                <div className="text-xl font-bold text-status-success mt-0.5">{presentCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-status-destructive/10 border border-status-destructive/30">
                <span className="text-[10px] uppercase text-status-destructive">Absent</span>
                <div className="text-xl font-bold text-status-destructive mt-0.5">{absentCount}</div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search member or DS ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-bg-page border border-border-default text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 self-end font-mono text-xs">
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMemberFilter(filter)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      memberFilter === filter
                        ? 'bg-accent-primary text-text-primary font-bold shadow'
                        : 'text-text-muted hover:text-text-primary bg-bg-page border border-border-default'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Member Record List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-border-default space-y-1">
              {isLoadingRecords ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">Loading records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">
                  No attendance records found.
                </div>
              ) : (
                filteredRecords.map((rec) => {
                  const isPresent = rec.status === 'PRESENT'
                  const recordedTime = new Date(rec.recorded_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })

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
                    <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 font-mono text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isPresent ? 'bg-status-success' : 'bg-status-destructive'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-text-primary truncate block">
                            {displayName}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {displayId}
                          </span>
                        </div>
                      </div>


                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] text-text-muted hidden sm:inline-block">
                          {recordedTime}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPresent
                              ? 'bg-status-success/20 text-status-success border border-status-success/40'
                              : 'bg-status-destructive/20 text-status-destructive border border-status-destructive/40'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-default bg-bg-page flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {isAdmin && selectedSession.status === 'COMPLETED' && onReopenSession ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onReopenSession(selectedSession)
                      setSelectedSession(null)
                    }}
                    className="font-mono text-xs border-status-pending/40 text-status-pending hover:bg-status-pending/10 gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Session (Director Only)</span>
                  </Button>
                ) : (
                  <div />
                )}

                {onDeleteSession && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSessionToDelete(selectedSession)}
                    className="font-mono text-xs border-status-destructive/40 text-status-destructive hover:bg-status-destructive/15 gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Session</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (selectedSession && cohortRecords.length > 0) {
                      generateAttendancePdf(selectedSession, cohortRecords, members)
                    }
                  }}
                  disabled={cohortRecords.length === 0}
                  className="font-mono text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setSelectedSession(null)}
                  className="font-mono text-xs bg-bg-surface border border-border-default text-text-primary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-status-destructive/50 bg-bg-surface shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-destructive/20 text-status-destructive flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">Delete Attendance Session</h4>
                <p className="text-xs text-text-muted mt-0.5">Permanent action • Cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-page border border-border-default space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-text-muted">
                <span>Session Title:</span>
                <span className="font-bold text-text-primary">{sessionToDelete.title}</span>
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>Date:</span>
                <span className="text-text-primary">
                  {new Date(sessionToDelete.session_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>Status:</span>
                <span className="text-accent-teal uppercase font-bold">{sessionToDelete.status}</span>
              </div>
            </div>

            <p className="text-xs font-mono text-text-muted leading-relaxed">
              Are you sure you want to permanently delete the session{' '}
              <strong className="text-text-primary">"{sessionToDelete.title}"</strong>? All attendance
              logs and scans recorded for this session will be permanently wiped from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                className="font-mono text-xs border-border-default"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDeleteSession) return
                  setIsDeleting(true)
                  try {
                    await onDeleteSession(sessionToDelete)
                    if (selectedSession?.id === sessionToDelete.id) {
                      setSelectedSession(null)
                    }
                    setSessionToDelete(null)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                className="font-mono text-xs bg-status-destructive hover:bg-status-destructive/90 text-white gap-2 font-bold cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Session</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
