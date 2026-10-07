import { supabase } from '@/lib/supabase'
import { sha256 } from '@/lib/digitalId'
import { Profile } from '@/types'

export interface AttendanceSession {
  id: string
  event_id?: string | null
  title: string
  session_date: string
  started_by: string
  started_by_name?: string
  started_at: string
  ended_at?: string | null
  status: 'ACTIVE' | 'COMPLETED'
  created_at?: string
  updated_at?: string
  total_eligible?: number
  present_count?: number
  absent_count?: number
}

export interface AttendanceRecord {
  id: string
  session_id: string
  member_id: string
  status: 'PRESENT' | 'ABSENT'
  recorded_by: string
  recorded_at: string
  created_at?: string
  updated_at?: string
  member_name?: string | null
  devstudio_id?: string | null
  avatar_url?: string | null
  usn?: string | null
}

export interface ScanResult {
  success: boolean
  code: 'PRESENT' | 'ALREADY_PRESENT' | 'INVALID_QR' | 'MEMBER_NOT_ELIGIBLE' | 'MEMBER_PENDING' | 'SCAN_ERROR' | 'ERROR'
  message: string
  member_id?: string | null
  member_name?: string | null
  devstudio_id?: string | null
  role?: string | null
  membership_status?: string | null
  avatar_url?: string | null
  recorded_at?: string | null
  record_id?: string | null
}

const LOCAL_SESSIONS_KEY = 'devstudio_supabase_sessions_cache'
const LOCAL_RECORDS_KEY = 'devstudio_supabase_records_cache'

export interface ExtractedScanData {
  token: string
  devstudio_id?: string
  user_id?: string
}

/**
 * Clean and extract verification token and embedded metadata from scanned text.
 * Handles:
 * - Full verification URLs: https://.../verify/<token>?dsid=DS26-0001
 * - Raw tokens (64-char hex)
 * - JSON payloads: {"token":"...","devstudio_id":"..."}
 * - Direct member identifiers: DS26-XXXX, email, USN
 */
export function extractScanData(rawScan: string): ExtractedScanData {
  const trimmed = rawScan.trim()
  let token = trimmed
  let devstudio_id: string | undefined
  let user_id: string | undefined

  if (trimmed.includes('/verify/')) {
    try {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      const parts = urlObj.pathname.split('/verify/')
      if (parts[1]) {
        token = parts[1].split('/')[0].split('?')[0].split('#')[0].trim()
      }
      const dsidParam = urlObj.searchParams.get('dsid') || urlObj.searchParams.get('devstudio_id')
      if (dsidParam) devstudio_id = dsidParam.trim()
      const uidParam = urlObj.searchParams.get('uid') || urlObj.searchParams.get('user_id')
      if (uidParam) user_id = uidParam.trim()
    } catch {
      const parts = trimmed.split('/verify/')
      const after = parts[1] || ''
      token = after.split('?')[0].split('#')[0].split('/')[0].trim()
      const qIndex = trimmed.indexOf('?')
      if (qIndex !== -1) {
        const queryStr = trimmed.slice(qIndex + 1)
        const match = queryStr.match(/(?:dsid|devstudio_id)=([^&]+)/i)
        if (match && match[1]) devstudio_id = decodeURIComponent(match[1]).trim()
      }
    }
  } else {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed.token) token = String(parsed.token).trim()
      if (parsed.devstudio_id) devstudio_id = String(parsed.devstudio_id).trim()
      if (parsed.id || parsed.user_id) user_id = String(parsed.id || parsed.user_id).trim()
    } catch {
      if (trimmed.toUpperCase().startsWith('DS') && trimmed.includes('-')) {
        devstudio_id = trimmed.toUpperCase()
      }
    }
  }

  return { token, devstudio_id, user_id }
}

/**
 * Backward-compatible helper returning cleaned token
 */
export function extractQrToken(rawScan: string): string {
  return extractScanData(rawScan).token
}

/**
 * Fetch all attendance sessions from Supabase.
 */
export async function fetchAttendanceSessions(): Promise<{
  sessions: AttendanceSession[]
  isFromSupabase: boolean
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist in schema cache yet, use memory/cache
      console.warn('Supabase attendance_sessions fetch notice:', error.message)
      const cached = localStorage.getItem(LOCAL_SESSIONS_KEY)
      const parsed = cached ? JSON.parse(cached) : []
      return { sessions: parsed, isFromSupabase: false, error: error.message }
    }

    const sessions = (data || []).map((s: any) => ({
      ...s,
      status: s.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED',
    })) as AttendanceSession[]

    // Cache locally for resilient offline/network resilience
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions))
    return { sessions, isFromSupabase: true }
  } catch (err: any) {
    console.error('Error fetching attendance sessions:', err)
    const cached = localStorage.getItem(LOCAL_SESSIONS_KEY)
    return { sessions: cached ? JSON.parse(cached) : [], isFromSupabase: false, error: err?.message }
  }
}

/**
 * Create a new attendance session with status 'ACTIVE'.
 */
export async function createAttendanceSession(params: {
  title: string
  eventId?: string | null
  startedBy: string
  startedByName?: string
  date?: string
}): Promise<{ success: boolean; session?: AttendanceSession; error?: string }> {
  const newSession: AttendanceSession = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now(),
    title: params.title.trim(),
    event_id: params.eventId || null,
    session_date: params.date || new Date().toISOString().split('T')[0],
    started_by: params.startedBy,
    started_by_name: params.startedByName || 'Dev Captain',
    started_at: new Date().toISOString(),
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert([
        {
          id: newSession.id,
          title: newSession.title,
          event_id: newSession.event_id,
          session_date: newSession.session_date,
          started_by: newSession.started_by,
          started_at: newSession.started_at,
          status: 'ACTIVE',
        },
      ])
      .select()
      .single()

    if (!error && data) {
      const savedSession = { ...newSession, ...data, status: 'ACTIVE' as const }
      updateLocalSession(savedSession)
      return { success: true, session: savedSession }
    }

    // Fallback if table not yet run in remote SQL editor
    console.warn('Supabase attendance_sessions insert fallback:', error?.message)
    updateLocalSession(newSession)
    return { success: true, session: newSession }
  } catch (err: any) {
    updateLocalSession(newSession)
    return { success: true, session: newSession }
  }
}

/**
 * Helper to update local session cache.
 */
function updateLocalSession(session: AttendanceSession) {
  try {
    const cached = localStorage.getItem(LOCAL_SESSIONS_KEY)
    const list: AttendanceSession[] = cached ? JSON.parse(cached) : []
    const updated = [session, ...list.filter((s) => s.id !== session.id)]
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error(e)
  }
}

/**
 * Fetch records for a given session, enriched with real member names, devstudio_ids, and USNs.
 */
export async function fetchSessionRecords(sessionId: string): Promise<AttendanceRecord[]> {
  try {
    // 1. Read existing cached records for names/devstudio_ids
    const cachedStr = typeof localStorage !== 'undefined' ? localStorage.getItem(`${LOCAL_RECORDS_KEY}_${sessionId}`) : null
    const cachedList: AttendanceRecord[] = cachedStr ? JSON.parse(cachedStr) : []
    const cachedMap = new Map<string, AttendanceRecord>()
    cachedList.forEach((r) => {
      if (r.id) cachedMap.set(r.id, r)
      if (r.member_id) cachedMap.set(r.member_id, r)
    })

    // 2. Build profile map from local storage directory and known users
    const profileMap = new Map<string, Partial<Profile>>()
    // Default Dev Director profile
    profileMap.set('d9b89182-3d84-48f5-968b-5926c04f9810', {
      id: 'd9b89182-3d84-48f5-968b-5926c04f9810',
      full_name: 'Dev Director',
      devstudio_id: 'DS26-0001',
      email: 'devilknight2534@gmail.com',
      role: 'admin',
    })

    try {
      if (typeof localStorage !== 'undefined') {
        const localDirStr = localStorage.getItem('devstudio_members_directory')
        if (localDirStr) {
          const localDir = JSON.parse(localDirStr)
          if (Array.isArray(localDir)) {
            localDir.forEach((p: any) => {
              if (p.id) profileMap.set(p.id, p)
              if (p.devstudio_id) profileMap.set(p.devstudio_id.toLowerCase(), p)
            })
          }
        }
      }
    } catch (e) {}

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false })

    if (error) {
      console.warn('Supabase attendance_records fetch notice:', error.message)
      return cachedList
    }

    // 3. Gather member IDs and fetch profiles from Supabase to guarantee real names
    const rawRecords = data || []
    const memberIds = Array.from(new Set(rawRecords.map((r: any) => r.member_id).filter(Boolean)))
    if (memberIds.length > 0) {
      try {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, devstudio_id, usn, email, avatar_url')
          .in('id', memberIds)

        if (profilesData) {
          profilesData.forEach((p: any) => {
            if (p.id) profileMap.set(p.id, p)
            if (p.devstudio_id) profileMap.set(p.devstudio_id.toLowerCase(), p)
          })
        }
      } catch (profErr) {
        console.warn('Profiles enrichment query notice:', profErr)
      }
    }

    // 4. Hydrate every record with authentic member_name, devstudio_id, usn, and avatar_url
    const records = rawRecords.map((r: any) => {
      const prof = profileMap.get(r.member_id)
      const cached = cachedMap.get(r.id) || cachedMap.get(r.member_id)

      const memberName =
        (r.member_name && r.member_name !== 'DevStudio Member' ? r.member_name : null) ||
        (cached?.member_name && cached.member_name !== 'DevStudio Member' ? cached.member_name : null) ||
        (prof?.full_name && prof.full_name !== 'DevStudio Member' ? prof.full_name : null) ||
        (prof?.email ? prof.email.split('@')[0] : null) ||
        r.member_name ||
        cached?.member_name ||
        'DevStudio Member'

      const devstudioId =
        r.devstudio_id ||
        cached?.devstudio_id ||
        prof?.devstudio_id ||
        null

      const avatarUrl =
        r.avatar_url ||
        cached?.avatar_url ||
        prof?.avatar_url ||
        null

      const usn =
        (r as any).usn ||
        (cached as any)?.usn ||
        prof?.usn ||
        (prof?.email && /^[0-9][a-z]{2}[0-9]{2}[a-z]{2}[0-9]{3}$/i.test(prof.email.split('@')[0])
          ? prof.email.split('@')[0].toUpperCase()
          : null) ||
        null

      return {
        ...r,
        status: r.status?.toUpperCase() === 'PRESENT' ? 'PRESENT' : 'ABSENT',
        member_name: memberName,
        devstudio_id: devstudioId,
        avatar_url: avatarUrl,
        usn,
        role: prof?.role || (cached as any)?.role || null,
      }
    }) as AttendanceRecord[]

    // Exclude Dev Directors and Dev Captains: attendance records strictly include Dev Mates (students)
    const cohortRecords = records.filter((r) => {
      const prof = profileMap.get(r.member_id)
      const cached = cachedMap.get(r.id) || cachedMap.get(r.member_id)
      const role = prof?.role || (cached as any)?.role || (r as any).role
      return role !== 'admin' && role !== 'organizer'
    })

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${LOCAL_RECORDS_KEY}_${sessionId}`, JSON.stringify(cohortRecords))
    }
    return cohortRecords
  } catch (err) {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(`${LOCAL_RECORDS_KEY}_${sessionId}`)
      return cached ? JSON.parse(cached) : []
    }
    return []
  }
}

/**
 * Secure QR Scan Validation & Recording
 * Resolves QR token -> member -> active status check -> duplicate check -> records PRESENT.
 */
export async function processAttendanceScan(
  sessionId: string,
  rawQrInput: string,
  scannerUser: { id: string; role: string; membership_status?: string },
  activeMembersList: Profile[],
  allMembersList: Profile[],
  existingSessionRecords: AttendanceRecord[]
): Promise<ScanResult> {
  // 1. Role validation: DEV_CAPTAIN or DEV_DIRECTOR only
  const isAuthorized =
    scannerUser.role === 'admin' ||
    scannerUser.role === 'organizer' ||
    (scannerUser as any).isStaff

  if (!isAuthorized) {
    return {
      success: false,
      code: 'ERROR',
      message: 'Access Denied: Only Dev Captains and Dev Directors can scan attendance.',
    }
  }

  const scanData = extractScanData(rawQrInput)
  const cleanToken = scanData.token
  const explicitDevStudioId = scanData.devstudio_id
  const explicitUserId = scanData.user_id

  if (!cleanToken && !explicitDevStudioId && !explicitUserId) {
    return {
      success: false,
      code: 'INVALID_QR',
      message: 'This QR code is not associated with a valid DevStudio member.',
    }
  }

  // 2. Attempt remote Supabase RPC execution first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('record_qr_attendance', {
      p_session_id: sessionId,
      p_qr_token: cleanToken || explicitDevStudioId || '',
      p_scanner_id: scannerUser.id,
    })

    if (!rpcError && rpcData) {
      if (rpcData.success) {
        // Enforce role check: Dev Captains and Dev Directors cannot be marked in student attendance
        if (rpcData.role === 'admin' || rpcData.role === 'organizer') {
          const roleTitle = rpcData.role === 'admin' ? 'Dev Director' : 'Dev Captain'
          return {
            success: false,
            code: 'MEMBER_NOT_ELIGIBLE',
            message: `${roleTitle}s are leadership staff and cannot be marked in student cohort attendance.`,
            member_id: rpcData.member_id,
            member_name: rpcData.member_name,
            devstudio_id: rpcData.devstudio_id,
            role: rpcData.role,
          }
        }

        return {
          success: true,
          code: 'PRESENT',
          message: 'Member marked present.',
          member_id: rpcData.member_id,
          member_name: rpcData.member_name,
          devstudio_id: rpcData.devstudio_id,
          role: rpcData.role,
          avatar_url: rpcData.avatar_url,
          recorded_at: rpcData.recorded_at,
          record_id: rpcData.record_id,
        }
      }

      // Handle specific error codes returned from Postgres
      if (rpcData.error_code === 'ALREADY_PRESENT') {
        return {
          success: false,
          code: 'ALREADY_PRESENT',
          message: 'This member has already been marked present for this session.',
          member_id: rpcData.member_id,
          member_name: rpcData.member_name,
          devstudio_id: rpcData.devstudio_id,
        }
      }

      if (rpcData.error_code === 'MEMBER_PENDING') {
        return {
          success: false,
          code: 'MEMBER_PENDING',
          message: "This member's application is pending review. Approve them in the Director Console first.",
          member_id: rpcData.member_id,
          member_name: rpcData.member_name,
          devstudio_id: rpcData.devstudio_id,
          membership_status: 'pending',
        }
      }

      if (rpcData.error_code === 'MEMBER_NOT_ELIGIBLE') {
        return {
          success: false,
          code: 'MEMBER_NOT_ELIGIBLE',
          message: 'This DevStudio account cannot be marked present.',
          member_id: rpcData.member_id,
          member_name: rpcData.member_name,
          devstudio_id: rpcData.devstudio_id,
          membership_status: rpcData.membership_status,
        }
      }

      if (rpcData.error_code === 'INVALID_QR') {
        console.warn('RPC record_qr_attendance did not match in DB, proceeding to resilient client fallback')
      }
    }
  } catch (rpcErr) {
    console.warn('RPC record_qr_attendance call error, proceeding to client fallback:', rpcErr)
  }

  // 3. Fallback direct resolution
  const tokenHash = cleanToken ? await sha256(cleanToken) : ''

  let resolvedMember: Profile | null = null
  let resolvedMemberFromAllMembers: Profile | null = null
  let dbLookupFailed = false

  // 3a. Authoritative DB Lookup in digital_ids table
  try {
    const filters: string[] = []
    if (cleanToken) {
      filters.push(`token.eq.${cleanToken}`)
      filters.push(`token_hash.eq.${tokenHash}`)
      filters.push(`devstudio_id.eq.${cleanToken}`)
      filters.push(`raw_token_preview.eq.${cleanToken}`)
    }
    if (explicitDevStudioId) {
      filters.push(`devstudio_id.eq.${explicitDevStudioId}`)
    }
    if (explicitUserId) {
      filters.push(`user_id.eq.${explicitUserId}`)
    }

    if (filters.length > 0) {
      const { data: didRows, error: didError } = await supabase
        .from('digital_ids')
        .select('user_id, devstudio_id, token, qr_payload_url')
        .or(filters.join(','))
        .limit(1)

      if (didError) {
        console.warn('Supabase digital_ids query error:', didError.message)
        dbLookupFailed = true
      } else if (didRows && didRows.length > 0) {
        const matchedUserId = didRows[0].user_id
        resolvedMember = activeMembersList.find((m) => m.id === matchedUserId) || null
        if (!resolvedMember) {
          resolvedMemberFromAllMembers = allMembersList.find((m) => m.id === matchedUserId) || null
        }
      }
    }
  } catch (e) {
    console.warn('Supabase digital_ids lookup error:', e)
    dbLookupFailed = true
  }

  // 3b. Match against allMembersList / activeMembersList directly
  if (!resolvedMember && !resolvedMemberFromAllMembers) {
    const queryTerm = (cleanToken || '').toLowerCase()
    const dsidTerm = (explicitDevStudioId || '').toLowerCase()
    const uidTerm = explicitUserId || ''

    const findInList = (list: Profile[]) =>
      list.find((m) => {
        if (uidTerm && m.id === uidTerm) return true
        if (dsidTerm && m.devstudio_id && m.devstudio_id.toLowerCase() === dsidTerm) return true
        if (queryTerm) {
          if (m.id.toLowerCase() === queryTerm) return true
          if (m.devstudio_id && m.devstudio_id.toLowerCase() === queryTerm) return true
          if (m.email && m.email.toLowerCase() === queryTerm) return true
          if ((m as any).usn && String((m as any).usn).toLowerCase() === queryTerm) return true
          if (m.devstudio_id && queryTerm.includes(m.devstudio_id.toLowerCase())) return true
        }
        return false
      }) || null

    resolvedMember = findInList(activeMembersList)
    if (!resolvedMember) {
      resolvedMemberFromAllMembers = findInList(allMembersList)
    }
  }

  // 3c. Check localStorage digital IDs fallback
  if (!resolvedMember && !resolvedMemberFromAllMembers) {
    const digitalIdsSaved = localStorage.getItem('devstudio_digital_ids')
    if (digitalIdsSaved) {
      try {
        const dIds = JSON.parse(digitalIdsSaved)
        const matchedDid = dIds.find(
          (d: any) =>
            d.token === cleanToken ||
            d.token_hash === tokenHash ||
            d.raw_token_preview === cleanToken ||
            d.devstudio_id === cleanToken ||
            (explicitDevStudioId && d.devstudio_id === explicitDevStudioId) ||
            (explicitUserId && d.user_id === explicitUserId)
        )
        if (matchedDid) {
          resolvedMember = activeMembersList.find((m) => m.id === matchedDid.user_id) || null
          if (!resolvedMember) {
            resolvedMemberFromAllMembers = allMembersList.find((m) => m.id === matchedDid.user_id) || null
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage digital IDs:', e)
      }
    }
  }

  // 4. Evaluation of resolved member
  const targetMember = resolvedMember || resolvedMemberFromAllMembers

  if (!targetMember) {
    if (dbLookupFailed) {
      return {
        success: false,
        code: 'SCAN_ERROR',
        message: 'Could not verify this QR code due to a network error. Please try again or use Manual Input.',
      }
    }
    return {
      success: false,
      code: 'INVALID_QR',
      message: 'This QR code is not associated with a valid DevStudio member.',
    }
  }

  // Check pending status
  if (targetMember.membership_status === 'pending') {
    return {
      success: false,
      code: 'MEMBER_PENDING',
      message: "This member's application is pending review. Approve them in the Director Console first.",
      member_id: targetMember.id,
      member_name: targetMember.full_name,
      devstudio_id: targetMember.devstudio_id,
      membership_status: 'pending',
    }
  }

  // Check inactive/suspended/alumni status
  if (targetMember.membership_status !== 'active') {
    return {
      success: false,
      code: 'MEMBER_NOT_ELIGIBLE',
      message: 'This DevStudio account cannot be marked present.',
      member_id: targetMember.id,
      member_name: targetMember.full_name,
      devstudio_id: targetMember.devstudio_id,
      membership_status: targetMember.membership_status,
    }
  }

  // Check leadership/staff role: Dev Captains and Dev Directors cannot be in student cohort attendance
  if (targetMember.role === 'admin' || targetMember.role === 'organizer') {
    const roleTitle = targetMember.role === 'admin' ? 'Dev Director' : 'Dev Captain'
    return {
      success: false,
      code: 'MEMBER_NOT_ELIGIBLE',
      message: `${roleTitle}s are leadership staff and cannot be marked in student cohort attendance.`,
      member_id: targetMember.id,
      member_name: targetMember.full_name,
      devstudio_id: targetMember.devstudio_id,
      role: targetMember.role,
    }
  }

  // Check duplicate attendance in existingSessionRecords
  const isDuplicate = existingSessionRecords.some(
    (r) =>
      (r.member_id === targetMember.id ||
        (targetMember.devstudio_id && r.devstudio_id === targetMember.devstudio_id) ||
        (targetMember.devstudio_id && r.member_id === targetMember.devstudio_id)) &&
      r.status === 'PRESENT'
  )

  if (isDuplicate) {
    return {
      success: false,
      code: 'ALREADY_PRESENT',
      message: 'This member has already been marked present for this session.',
      member_id: targetMember.id,
      member_name: targetMember.full_name,
      devstudio_id: targetMember.devstudio_id,
    }
  }

  // 5. Persist record to Supabase attendance_records table
  const newRecordId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec-' + Date.now()
  const nowIso = new Date().toISOString()

  try {
    await supabase.from('attendance_records').insert([
      {
        id: newRecordId,
        session_id: sessionId,
        member_id: targetMember.id,
        status: 'PRESENT',
        recorded_by: scannerUser.id,
        recorded_at: nowIso,
      },
    ])
  } catch (dbErr) {
    console.warn('Supabase attendance_records direct save notice:', dbErr)
  }

  // Save to local session cache
  try {
    const cached = localStorage.getItem(`${LOCAL_RECORDS_KEY}_${sessionId}`)
    const list: AttendanceRecord[] = cached ? JSON.parse(cached) : []
    const updatedRecord: AttendanceRecord = {
      id: newRecordId,
      session_id: sessionId,
      member_id: targetMember.id,
      status: 'PRESENT',
      recorded_by: scannerUser.id,
      recorded_at: nowIso,
      member_name: targetMember.full_name,
      devstudio_id: targetMember.devstudio_id,
      avatar_url: targetMember.avatar_url,
    }
    const updated = [updatedRecord, ...list.filter((r) => r.member_id !== targetMember.id)]
    localStorage.setItem(`${LOCAL_RECORDS_KEY}_${sessionId}`, JSON.stringify(updated))
  } catch (e) {
    console.error(e)
  }

  return {
    success: true,
    code: 'PRESENT',
    message: 'Member marked present.',
    member_id: targetMember.id,
    member_name: targetMember.full_name,
    devstudio_id: targetMember.devstudio_id,
    role: targetMember.role,
    avatar_url: targetMember.avatar_url,
    recorded_at: nowIso,
    record_id: newRecordId,
  }
}

/**
 * Finalize an attendance session:
 * - Marks session status as 'COMPLETED'
 * - Creates 'ABSENT' records for eligible active members who were not scanned
 * - Stores finalization timestamp
 */
export async function finalizeAttendanceSession(
  sessionId: string,
  activeMembers: Profile[],
  finalizedBy: string
): Promise<{
  success: boolean
  counts: { total: number; present: number; absent: number }
  error?: string
}> {
  try {
    // 1. Fetch current present records for this session
    const currentRecords = await fetchSessionRecords(sessionId)
    const presentMemberIds = new Set(
      currentRecords.filter((r) => r.status === 'PRESENT').map((r) => r.member_id)
    )

    // 2. Identify all eligible active members not scanned (strictly Dev Mates only - exclude Directors and Captains)
    const eligibleCohort = activeMembers.filter(
      (m) => m.membership_status === 'active' && m.role === 'member'
    )
    const unscannedMembers = eligibleCohort.filter((m) => !presentMemberIds.has(m.id))

    const now = new Date().toISOString()
    const absentRecords: AttendanceRecord[] = unscannedMembers.map((m) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec-abs-' + m.id + '-' + Date.now(),
      session_id: sessionId,
      member_id: m.id,
      status: 'ABSENT',
      recorded_by: finalizedBy,
      recorded_at: now,
      member_name: m.full_name,
      devstudio_id: m.devstudio_id,
    }))

    // 3. Batch insert absent records into Supabase
    if (absentRecords.length > 0) {
      try {
        await supabase.from('attendance_records').insert(
          absentRecords.map((r) => ({
            id: r.id,
            session_id: r.session_id,
            member_id: r.member_id,
            status: 'ABSENT',
            recorded_by: r.recorded_by,
            recorded_at: r.recorded_at,
          }))
        )
      } catch (e) {
        console.warn('Supabase absent batch insert notice:', e)
      }
    }

    // 4. Update session status to COMPLETED in Supabase
    try {
      await supabase
        .from('attendance_sessions')
        .update({
          status: 'COMPLETED',
          ended_at: now,
          updated_at: now,
        })
        .eq('id', sessionId)
    } catch (e) {
      console.warn('Supabase session status update notice:', e)
    }

    // 5. Update local cache
    const allSessionRecords = [...currentRecords, ...absentRecords]
    localStorage.setItem(`${LOCAL_RECORDS_KEY}_${sessionId}`, JSON.stringify(allSessionRecords))

    const sessionsCached = localStorage.getItem(LOCAL_SESSIONS_KEY)
    if (sessionsCached) {
      const list: AttendanceSession[] = JSON.parse(sessionsCached)
      const updatedList = list.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'COMPLETED' as const,
              ended_at: now,
              present_count: presentMemberIds.size,
              absent_count: absentRecords.length,
              total_eligible: activeMembers.length,
            }
          : s
      )
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updatedList))
    }

    return {
      success: true,
      counts: {
        total: activeMembers.length,
        present: presentMemberIds.size,
        absent: absentRecords.length,
      },
    }
  } catch (err: any) {
    console.error('Error finalizing attendance session:', err)
    return {
      success: false,
      counts: { total: 0, present: 0, absent: 0 },
      error: err?.message || 'Failed to finalize attendance.',
    }
  }
}

/**
 * Delete an attendance session and its associated records completely.
 * Cascades to Supabase tables (attendance_records and attendance_sessions)
 * and purges local storage caches.
 */
export async function deleteAttendanceSession(sessionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. Delete associated records from Supabase
    try {
      const { error: recError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('session_id', sessionId)

      if (recError) {
        console.warn('Supabase attendance_records delete notice:', recError.message)
      }
    } catch (e: any) {
      console.warn('Network error deleting attendance records:', e)
    }

    // 2. Delete attendance session from Supabase
    try {
      const { error: sessError } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessError) {
        console.warn('Supabase attendance_sessions delete notice:', sessError.message)
      }
    } catch (e: any) {
      console.warn('Network error deleting attendance session:', e)
    }

    // 3. Clear local storage caches
    try {
      if (typeof localStorage !== 'undefined') {
        // Remove specific session record cache
        localStorage.removeItem(`${LOCAL_RECORDS_KEY}_${sessionId}`)

        // Remove from sessions cache
        const cachedSessions = localStorage.getItem(LOCAL_SESSIONS_KEY)
        if (cachedSessions) {
          const list: AttendanceSession[] = JSON.parse(cachedSessions)
          const updated = list.filter((s) => s.id !== sessionId)
          localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated))
        }

        // Remove from legacy sessions cache
        const legacySessions = localStorage.getItem('devstudio_attendance_sessions')
        if (legacySessions) {
          const list: AttendanceSession[] = JSON.parse(legacySessions)
          const updated = list.filter((s) => s.id !== sessionId)
          localStorage.setItem('devstudio_attendance_sessions', JSON.stringify(updated))
        }

        // Filter legacy records cache
        const legacyRecords = localStorage.getItem('devstudio_attendance_records')
        if (legacyRecords) {
          const list: AttendanceRecord[] = JSON.parse(legacyRecords)
          const updated = list.filter((r) => r.session_id !== sessionId)
          localStorage.setItem('devstudio_attendance_records', JSON.stringify(updated))
        }
      }
    } catch (cacheErr) {
      console.warn('Local cache purge notice:', cacheErr)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting attendance session:', err)
    return {
      success: false,
      error: err?.message || 'Failed to delete attendance session.',
    }
  }
}

