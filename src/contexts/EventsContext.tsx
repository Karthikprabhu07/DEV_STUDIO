import React, { createContext, useContext, useState, useEffect } from 'react'
import { ClubEvent, EventRegistration, AttendanceSession, AttendanceRecord } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface EventsContextType {
  events: ClubEvent[]
  registrations: EventRegistration[]
  attendanceSessions: AttendanceSession[]
  attendanceRecords: AttendanceRecord[]
  isLoading: boolean
  createEvent: (data: Omit<ClubEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; event?: ClubEvent }>
  deleteEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>
  registerForEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>
  cancelRegistration: (eventId: string) => Promise<{ success: boolean; error?: string }>
  openAttendanceSession: (eventId: string) => Promise<{ success: boolean; error?: string; session?: AttendanceSession }>
  saveAttendance: (
    eventId: string,
    records: { userId: string; status: 'present' | 'absent' }[]
  ) => Promise<{ success: boolean; error?: string; counts?: { total: number; present: number; absent: number } }>
  getMemberAttendanceRate: (userId: string) => { present: number; total: number; percentage: string }
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isStaff, isActiveMember } = useAuth()
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from storage
  useEffect(() => {
    const savedEvents = localStorage.getItem('devstudio_events')
    if (savedEvents) {
      try { setEvents(JSON.parse(savedEvents)) } catch (e) { console.error(e) }
    }

    const savedRegs = localStorage.getItem('devstudio_event_registrations')
    if (savedRegs) {
      try { setRegistrations(JSON.parse(savedRegs)) } catch (e) { console.error(e) }
    }

    const savedSessions = localStorage.getItem('devstudio_attendance_sessions')
    if (savedSessions) {
      try { setAttendanceSessions(JSON.parse(savedSessions)) } catch (e) { console.error(e) }
    }

    const savedRecords = localStorage.getItem('devstudio_attendance_records')
    if (savedRecords) {
      try { setAttendanceRecords(JSON.parse(savedRecords)) } catch (e) { console.error(e) }
    }
    
    // Simulate slight network delay for skeletons
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const persistEvents = (updated: ClubEvent[]) => {
    setEvents(updated)
    localStorage.setItem('devstudio_events', JSON.stringify(updated))
  }

  const persistRegistrations = (updated: EventRegistration[]) => {
    setRegistrations(updated)
    localStorage.setItem('devstudio_event_registrations', JSON.stringify(updated))
  }

  const persistSessions = (updated: AttendanceSession[]) => {
    setAttendanceSessions(updated)
    localStorage.setItem('devstudio_attendance_sessions', JSON.stringify(updated))
  }

  const persistRecords = (updated: AttendanceRecord[]) => {
    setAttendanceRecords(updated)
    localStorage.setItem('devstudio_attendance_records', JSON.stringify(updated))
  }

  /**
   * Create an event: strictly staff only
   */
  const createEvent = async (
    data: Omit<ClubEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; event?: ClubEvent }> => {
    if (!isStaff || !profile) {
      return { success: false, error: '403 Forbidden: Only Dev Captains and Dev Directors can create events.' }
    }

    const newEvent: ClubEvent = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : 'event-' + Date.now(),
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newEvent, ...events]
    persistEvents(updated)
    return { success: true, event: newEvent }
  }

  /**
   * Delete an event: Dev Captains and Dev Directors only
   */
  const deleteEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isStaff && profile?.role !== 'admin') {
      return { success: false, error: '403 Forbidden: Only Dev Captains and Dev Directors can delete events.' }
    }

    const updatedEvents = events.filter((e) => e.id !== eventId)
    persistEvents(updatedEvents)

    // Clean up associated registrations
    const updatedRegs = registrations.filter((r) => r.event_id !== eventId)
    persistRegistrations(updatedRegs)

    // Clean up associated attendance sessions
    const updatedSessions = attendanceSessions.filter((s) => s.event_id !== eventId)
    persistSessions(updatedSessions)

    // Clean up associated attendance records
    const updatedRecords = attendanceRecords.filter((r) => r.event_id !== eventId)
    persistRecords(updatedRecords)

    return { success: true }
  }

  /**
   * Register for an event
   */
  const registerForEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) {
      return { success: false, error: 'Authentication required.' }
    }
    if (!isActiveMember && profile.role !== 'admin') {
      return { success: false, error: 'Only Active Dev Mates can register for events.' }
    }

    const alreadyRegistered = registrations.some(r => r.event_id === eventId && r.user_id === profile.id)
    if (alreadyRegistered) {
      return { success: false, error: 'Already registered for this event.' }
    }

    const newReg: EventRegistration = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'reg-' + Date.now(),
      event_id: eventId,
      user_id: profile.id,
      status: 'confirmed',
      registered_at: new Date().toISOString(),
    }

    persistRegistrations([...registrations, newReg])
    return { success: true }
  }

  /**
   * Cancel event registration
   */
  const cancelRegistration = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'Authentication required.' }

    const updated = registrations.filter(r => !(r.event_id === eventId && r.user_id === profile.id))
    persistRegistrations(updated)
    return { success: true }
  }

  /**
   * Open attendance session for an event
   */
  const openAttendanceSession = async (
    eventId: string
  ): Promise<{ success: boolean; error?: string; session?: AttendanceSession }> => {
    if (!isStaff || !profile) {
      return { success: false, error: '403 Forbidden: Only Dev Captains or Dev Directors can open attendance.' }
    }

    let session = attendanceSessions.find(s => s.event_id === eventId)
    if (!session) {
      session = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now(),
        event_id: eventId,
        opened_by: profile.id,
        opened_at: new Date().toISOString(),
        status: 'open',
        total_eligible: 0,
        total_present: 0,
        total_absent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      persistSessions([...attendanceSessions, session])
    }
    return { success: true, session }
  }

  /**
   * Save manual attendance
   * ENFORCES DUPLICATE PREVENTION:
   * A DB constraint uq_attendance_event_user guarantees only 1 row per (event_id, user_id).
   * We upsert so retries never create duplicate rows.
   */
  const saveAttendance = async (
    eventId: string,
    records: { userId: string; status: 'present' | 'absent' }[]
  ): Promise<{ success: boolean; error?: string; counts?: { total: number; present: number; absent: number } }> => {
    if (!isStaff || !profile) {
      return { success: false, error: '403 Forbidden: Only Dev Captains or Dev Directors can take attendance.' }
    }

    let session = attendanceSessions.find(s => s.event_id === eventId)
    if (!session) {
      const openRes = await openAttendanceSession(eventId)
      session = openRes.session
    }

    const sessionId = session?.id || 'session-' + Date.now()

    // Map upsert to enforce uniqueness of (event_id, user_id)
    const existingRecordsMap = new Map(
      attendanceRecords.filter(r => r.event_id === eventId).map(r => [r.user_id, r])
    )

    let presentCount = 0
    let absentCount = 0

    const updatedRecordsForEvent: AttendanceRecord[] = records.map(rec => {
      if (rec.status === 'present') presentCount++
      else absentCount++

      const existing = existingRecordsMap.get(rec.userId)
      if (existing) {
        return {
          ...existing,
          status: rec.status,
          marked_by: profile.id,
          updated_at: new Date().toISOString(),
        }
      }

      return {
        id: crypto.randomUUID ? crypto.randomUUID() : 'att-' + Date.now() + '-' + rec.userId.slice(0, 4),
        session_id: sessionId,
        event_id: eventId,
        user_id: rec.userId,
        status: rec.status,
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Combine other events records + this event's unique rows
    const otherEventsRecords = attendanceRecords.filter(r => r.event_id !== eventId)
    persistRecords([...otherEventsRecords, ...updatedRecordsForEvent])

    // Update session summary
    const updatedSessions = attendanceSessions.map(s => {
      if (s.event_id === eventId) {
        return {
          ...s,
          total_eligible: records.length,
          total_present: presentCount,
          total_absent: absentCount,
          updated_at: new Date().toISOString(),
        }
      }
      return s
    })
    persistSessions(updatedSessions)

    return {
      success: true,
      counts: {
        total: records.length,
        present: presentCount,
        absent: absentCount,
      },
    }
  }

  /**
   * Computed Attendance % = Sessions Present / Total Sessions * 100
   */
  const getMemberAttendanceRate = (userId: string) => {
    const memberRecords = attendanceRecords.filter(r => r.user_id === userId)
    const total = memberRecords.length
    const present = memberRecords.filter(r => r.status === 'present').length

    if (total === 0) {
      return { present: 0, total: 0, percentage: '0%' }
    }

    const pct = Math.round((present / total) * 100)
    return { present, total, percentage: `${pct}%` }
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        registrations,
        attendanceSessions,
        attendanceRecords,
        createEvent,
        deleteEvent,
        registerForEvent,
        cancelRegistration,
        openAttendanceSession,
        saveAttendance,
        getMemberAttendanceRate,
        isLoading
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider')
  }
  return context
}
