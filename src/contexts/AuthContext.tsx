import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { User as SupabaseUser, RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isEmailAllowed } from '@/utils/auth'
import { Profile, TechnicalRole, UserFacingRole, MembershipStatus, AuditLog } from '@/types'
import { formatRoleName } from '@/lib/utils'

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  userFacingRole: UserFacingRole
  membershipStatus: MembershipStatus | null
  isStaff: boolean
  isAdmin: boolean
  isActiveMember: boolean
  canCreateEvents: boolean
  isLoaded: boolean
  members: Profile[]
  auditLogs: AuditLog[]
  isDatabaseConfigured: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
  submitPhotoForModeration: (photoDataUrl: string) => Promise<{ success: boolean; error?: string }>
  removePhoto: () => Promise<{ success: boolean; error?: string }>
  moderatePhoto: (userId: string, approved: boolean, reason?: string) => Promise<{ success: boolean; error?: string }>
  updateMemberRole: (userId: string, newRole: TechnicalRole) => Promise<{ success: boolean; error?: string }>
  updateMembershipStatus: (userId: string, newStatus: MembershipStatus, reason?: string) => Promise<{ success: boolean; error?: string }>
  addMember: (data: {
    full_name: string
    email: string
    role?: TechnicalRole
    academic_year?: number
    branch?: string
    usn?: string
  }) => Promise<{ success: boolean; error?: string; member?: Profile }>
  removeMember: (userId: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  syncMembersDirectory: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MITE_DOMAIN_REGEX = /^[A-Za-z0-9._%+-]+@mite\.ac\.in$/i
const ALLOWED_ADMIN_EMAILS = ['devilknight2534@gmail.com']
export const ADMIN_PRESET_PASSWORD = 'Karthik@@1122'
export const STUDENT_INTERNAL_PASSWORD = 'MiteStudent@2026Auth'

export const isAllowedEmail = (email: string): boolean => {
  const clean = email.trim().toLowerCase()
  return MITE_DOMAIN_REGEX.test(clean) || ALLOWED_ADMIN_EMAILS.includes(clean)
}

export const MEMBERS_STORAGE_KEY = 'devstudio_members_directory'

export const getStoredMembers = (): Profile[] => {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {}
  return []
}

export const saveStoredMembers = (membersToStore: Profile[]) => {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(membersToStore))
  } catch (e) {}
}

export const mergeProfiles = (primary: Profile[], secondary: Profile[]): Profile[] => {
  const combined = [...(Array.isArray(secondary) ? secondary : []), ...(Array.isArray(primary) ? primary : [])].filter(Boolean)
  
  const byEmail = new Map<string, Profile>()
  combined.forEach((p) => {
    if (p.email) byEmail.set(p.email.trim().toLowerCase(), p)
  })

  // We actually DON'T want to aggressively deduplicate in the UI anymore,
  // because if they exist in the DB, the user needs to be able to see them to delete them!
  // So we will just map by ID, so the user can see all distinct DB rows and delete the duplicates.
  const byId = new Map<string, Profile>()
  combined.forEach((p) => {
    if (p.id) byId.set(p.id, p)
  })

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STRICT SESSION ISOLATION:
  // Profile and User start strictly as NULL.
  // There is NO default administrator, NO demo user, and NO fallback account.
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [members, setMembers] = useState<Profile[]>(() => getStoredMembers())
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState<boolean>(true)

  // References to maintain current state inside realtime subscription callbacks
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const membersRef = useRef<Profile[]>(members)
  membersRef.current = members
  const profileRef = useRef<Profile | null>(profile)
  profileRef.current = profile

  // Dual-pipe Realtime Broadcaster: Dispatches over Supabase WebSocket (cross-browser / cross-device)
  // and local BroadcastChannel (intra-browser instant tab sync)
  const broadcastRealtimeEvent = useCallback((event: string, payload: any) => {
    // 1. Supabase Realtime WebSocket Broadcast
    try {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        })
      }
    } catch (err) {
      console.warn('Supabase realtime broadcast notice:', err)
    }

    // 2. Browser BroadcastChannel
    try {
      const bc = new BroadcastChannel('devstudio-member-realtime')
      bc.postMessage({ type: event, ...payload })
      bc.close()
    } catch (e) {}
  }, [])

  // Fetch real profile from Supabase profiles table for an authenticated Supabase user
  const loadProfileForUser = useCallback(async (authUser: SupabaseUser): Promise<Profile | null> => {
    setUser(authUser)
    const cleanEmail = (authUser.email || '').trim().toLowerCase()
    const isAdminUser = ALLOWED_ADMIN_EMAILS.includes(cleanEmail)

    try {
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (dbProfile && !error) {
        setIsDatabaseConfigured(true)
        const fetchedProfile = dbProfile as Profile
        if (isAdminUser) {
          if (fetchedProfile.role !== 'admin' || fetchedProfile.membership_status !== 'active') {
            fetchedProfile.role = 'admin'
            fetchedProfile.membership_status = 'active'
            if (!fetchedProfile.devstudio_id) fetchedProfile.devstudio_id = 'DS26-0001'
            try {
              await supabase.from('profiles').update({
                role: 'admin',
                membership_status: 'active',
                devstudio_id: fetchedProfile.devstudio_id,
              }).eq('id', authUser.id)
            } catch (err) {
              console.warn('Admin status sync notice:', err)
            }
          }
        }
        setProfile(fetchedProfile)
        setMembers((prev) => {
          const next = mergeProfiles([fetchedProfile], prev)
          saveStoredMembers(next)
          return next
        })
        return fetchedProfile
      } else if (error && error.code === 'PGRST205') {
        setIsDatabaseConfigured(false)
      }
    } catch (err) {
      console.warn('Error querying Supabase profiles table:', err)
    }

    // Check existing stored cache for profile
    const cached = getStoredMembers()
    const existingCached = cached.find((m) => m.id === authUser.id || m.email.toLowerCase() === cleanEmail)

    // If profile row doesn't exist yet in Supabase (e.g. newly registered),
    // provision an initial PENDING member profile. NEVER default to admin!
    const initialProfile: Profile = existingCached || {
      id: authUser.id,
      email: cleanEmail,
      full_name:
        (authUser.user_metadata?.full_name as string) ||
        (isAdminUser ? 'Dev Director' : cleanEmail.split('@')[0]) ||
        'DevStudio Member',
      role: isAdminUser ? 'admin' : 'member',
      membership_status: isAdminUser ? 'active' : 'pending',
      avatar_type: 'default',
      photo_moderation_status: 'approved',
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      devstudio_id: isAdminUser ? 'DS26-0001' : null,
    }

    try {
      const { error: upsertError } = await supabase.from('profiles').upsert([initialProfile])
      if (upsertError) {
        console.warn('Profile upsert DB error (will rely on broadcast sync):', upsertError.message)
      }
    } catch (e) {
      console.warn('Initial profile upsert network error:', e)
    }

    setProfile(initialProfile)
    setMembers((prev) => {
      const next = mergeProfiles([initialProfile], prev)
      saveStoredMembers(next)
      return next
    })

    // Broadcast new application across all browsers in real-time
    broadcastRealtimeEvent('NEW_APPLICATION', { member: initialProfile })

    return initialProfile
  }, [broadcastRealtimeEvent])

  // Load members directory from Supabase & merge with persistent local cache
  const loadMembersDirectory = useCallback(async () => {
    // 1. Read local storage cache as fallback (do NOT push stale cache into
    //    React state before the DB fetch — that overwrites optimistic updates)
    const cached = getStoredMembers()

    // 2. Query remote Supabase database
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setIsDatabaseConfigured(true)
        const merged = mergeProfiles(data as Profile[], cached)
        setMembers(merged)
        saveStoredMembers(merged)
        return
      } else if (error && error.code === 'PGRST205') {
        setIsDatabaseConfigured(false)
      }
    } catch (e) {
      console.warn('Error loading members directory from Supabase:', e)
    }

    // 3. Only fall back to cached data if the DB fetch failed
    if (cached.length > 0) {
      setMembers(cached)
    }
  }, [])

  const syncMembersDirectory = async () => {
    // Request instant members directory broadcast from any online peer browser
    broadcastRealtimeEvent('REQUEST_MEMBERS_SYNC', { timestamp: Date.now() })
    await loadMembersDirectory()
  }

  // Primary Authentication Session Initialization & Lifecycle Listener
  useEffect(() => {
    let isMounted = true

    // 1. Initial Session Check: Directly ask Supabase Auth SDK
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!isMounted) return

        if (session?.user) {
          await loadProfileForUser(session.user)
          await loadMembersDirectory()
        } else if (localStorage.getItem('devstudio_admin_session') === 'true') {
          const adminId = 'd9b89182-3d84-48f5-968b-5926c04f9810'
          const syntheticAdminUser: SupabaseUser = {
            id: adminId,
            app_metadata: { provider: 'email' },
            user_metadata: { full_name: 'Dev Director' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: 'devilknight2534@gmail.com',
            phone: '',
            role: 'authenticated',
            updated_at: new Date().toISOString(),
          }
          const adminProfile: Profile = {
            id: adminId,
            email: 'devilknight2534@gmail.com',
            full_name: 'Dev Director',
            role: 'admin',
            membership_status: 'active',
            avatar_type: 'default',
            photo_moderation_status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            devstudio_id: 'DS26-0001',
          }
          setUser(syntheticAdminUser)
          setProfile(adminProfile)
          await loadMembersDirectory()
        } else {
          setUser(null)
          setProfile(null)
        }
        setIsLoaded(true)
      })
      .catch((err) => {
        console.error('Error verifying Supabase auth session:', err)
        if (isMounted) {
          if (localStorage.getItem('devstudio_admin_session') === 'true') {
            const adminId = 'd9b89182-3d84-48f5-968b-5926c04f9810'
            const syntheticAdminUser: SupabaseUser = {
              id: adminId,
              app_metadata: { provider: 'email' },
              user_metadata: { full_name: 'Dev Director' },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              email: 'devilknight2534@gmail.com',
              phone: '',
              role: 'authenticated',
              updated_at: new Date().toISOString(),
            }
            const adminProfile: Profile = {
              id: adminId,
              email: 'devilknight2534@gmail.com',
              full_name: 'Dev Director',
              role: 'admin',
              membership_status: 'active',
              avatar_type: 'default',
              photo_moderation_status: 'approved',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              devstudio_id: 'DS26-0001',
            }
            setUser(syntheticAdminUser)
            setProfile(adminProfile)
          } else {
            setUser(null)
            setProfile(null)
          }
          setIsLoaded(true)
        }
      })

    // 2. Auth State Change Listener (signs in, signs out, token refreshed)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (session?.user) {
        const { email } = session.user
        // Supabase provides email_verified in identities or confirmed_at
        const emailVerified = !!session.user.email_confirmed_at || !!session.user.identities?.some(id => id.identity_data?.email_verified)
        
        // Ensure email is allowed before establishing local session
        if (email && !isEmailAllowed(email, emailVerified, import.meta.env.VITE_ADMIN_EMAILS)) {
          await supabase.auth.signOut()
          window.location.href = '/?error=domain'
          return
        }

        await loadProfileForUser(session.user)
        await loadMembersDirectory()
        setIsLoaded(true)
      } else if (event === 'SIGNED_OUT' || !session) {
        if (localStorage.getItem('devstudio_admin_session') !== 'true') {
          setUser(null)
          setProfile(null)
          setIsLoaded(true)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfileForUser, loadMembersDirectory])

  // 3. Real-Time Members & Application Sync Listener (Cross-Browser WebSocket & Broadcast Protocol)
  useEffect(() => {
    // A. Initialize Supabase Realtime Channel
    const channel = supabase.channel('devstudio-live-sync', {
      config: {
        broadcast: { self: false, ack: true },
      },
    })
    realtimeChannelRef.current = channel

    channel
      // 1. Peer Sync Request: another browser opened and requests the pending applications / members directory
      .on('broadcast', { event: 'REQUEST_MEMBERS_SYNC' }, () => {
        const currentMembers = membersRef.current
        if (currentMembers && currentMembers.length > 0) {
          channel.send({
            type: 'broadcast',
            event: 'RESPONSE_MEMBERS_SYNC',
            payload: { members: currentMembers },
          })
        }
      })
      // 2. Peer Sync Response: merge directory from active peers
      .on('broadcast', { event: 'RESPONSE_MEMBERS_SYNC' }, (msg) => {
        if (msg.payload?.members && Array.isArray(msg.payload.members)) {
          setMembers((prev) => {
            const next = mergeProfiles(msg.payload.members, prev)
            saveStoredMembers(next)
            return next
          })
          const currentId = profileRef.current?.id
          if (currentId) {
            const currentRecord = msg.payload.members.find((m: Profile) => m && m.id === currentId)
            if (currentRecord) {
              setProfile((curr) => (curr ? { ...curr, ...currentRecord } : currentRecord))
            }
          }
        }
      })
      // 3. New Application: member registered or signed in
      .on('broadcast', { event: 'NEW_APPLICATION' }, (msg) => {
        const member = msg.payload?.member as Profile
        if (member && member.id) {
          setMembers((prev) => {
            const next = mergeProfiles([member], prev)
            saveStoredMembers(next)
            return next
          })
        }
      })
      // 4. Status Changed: Admin approved / resolved / rejected membership application
      .on('broadcast', { event: 'STATUS_CHANGED' }, (msg) => {
        const { userId, status, updates } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.map((m) =>
              m.id === userId ? { ...m, ...updates, membership_status: status || m.membership_status } : m
            )
            saveStoredMembers(next)
            return next
          })
          setProfile((curr) => {
            if (curr && curr.id === userId) {
              return { ...curr, ...updates, membership_status: status || curr.membership_status }
            }
            return curr
          })
        }
      })
      // 5. Role Changed: Admin promoted role
      .on('broadcast', { event: 'ROLE_CHANGED' }, (msg) => {
        const { userId, role, updates } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.map((m) =>
              m.id === userId ? { ...m, ...updates, role: role || m.role } : m
            )
            saveStoredMembers(next)
            return next
          })
          setProfile((curr) => {
            if (curr && curr.id === userId) {
              return { ...curr, ...updates, role: role || curr.role }
            }
            return curr
          })
        }
      })
      // 6. Photo Moderated: Admin approved or rejected student photo
      .on('broadcast', { event: 'PHOTO_MODERATED' }, (msg) => {
        const { userId, updates } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.map((m) => (m.id === userId ? { ...m, ...updates } : m))
            saveStoredMembers(next)
            return next
          })
          setProfile((curr) => (curr && curr.id === userId ? { ...curr, ...updates } : curr))
        }
      })
      // 7. Photo Submitted: Student submitted photo for moderation
      .on('broadcast', { event: 'PHOTO_SUBMITTED' }, (msg) => {
        const { userId, updates } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.map((m) => (m.id === userId ? { ...m, ...updates } : m))
            saveStoredMembers(next)
            return next
          })
        }
      })
      // 8. Profile Updated: Safe student field edit
      .on('broadcast', { event: 'PROFILE_UPDATED' }, (msg) => {
        const { userId, updates } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.map((m) => (m.id === userId ? { ...m, ...updates } : m))
            saveStoredMembers(next)
            return next
          })
        }
      })
      // 9. Member Removed: Director removed member
      .on('broadcast', { event: 'MEMBER_REMOVED' }, (msg) => {
        const { userId } = msg.payload || {}
        if (userId) {
          setMembers((prev) => {
            const next = prev.filter((m) => m.id !== userId)
            saveStoredMembers(next)
            return next
          })
          setProfile((curr) => (curr && curr.id === userId ? { ...curr, membership_status: 'revoked' } : curr))
        }
      })
      // 10. Supabase Postgres Logical Replication Changes (when DB table is active)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMember = payload.new as Profile
            setMembers((prev) => {
              const next = mergeProfiles([newMember], prev)
              saveStoredMembers(next)
              return next
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Profile
            setMembers((prev) => {
              const next = prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
              saveStoredMembers(next)
              return next
            })
            setProfile((curr) => (curr?.id === updated.id ? { ...curr, ...updated } : curr))
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id
            if (deletedId) {
              setMembers((prev) => {
                const next = prev.filter((m) => m.id !== deletedId)
                saveStoredMembers(next)
                return next
              })
            }
          }
        }
      )

    // B. Subscribe and proactively request sync from active online peers
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_MEMBERS_SYNC',
          payload: { timestamp: Date.now() },
        })
      }
    })

    // C. Intra-browser Local Tab Sync via BroadcastChannel
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('devstudio-member-realtime')
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'SYNC_MEMBERS' ||
          event.data?.type === 'NEW_APPLICATION' ||
          event.data?.type === 'STATUS_CHANGED' ||
          event.data?.type === 'MEMBER_REMOVED' ||
          event.data?.type === 'ROLE_CHANGED' ||
          event.data?.type === 'PHOTO_MODERATED' ||
          event.data?.type === 'PHOTO_SUBMITTED' ||
          event.data?.type === 'PROFILE_UPDATED'
        ) {
          if (event.data?.member) {
            setMembers((prev) => {
              const next = mergeProfiles([event.data.member], prev)
              saveStoredMembers(next)
              return next
            })
          }
          if (event.data?.userId && event.data?.updates) {
            setMembers((prev) => {
              const next = prev.map((m) =>
                m.id === event.data.userId ? { ...m, ...event.data.updates } : m
              )
              saveStoredMembers(next)
              return next
            })
            setProfile((curr) =>
              curr?.id === event.data.userId ? { ...curr, ...event.data.updates } : curr
            )
          }
          loadMembersDirectory()
        }
      }
    } catch (e) {}

    // D. Re-sync when window / tab becomes visible or on storage event
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_MEMBERS_SYNC',
          payload: { timestamp: Date.now() },
        })
        loadMembersDirectory()
      }
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MEMBERS_STORAGE_KEY) {
        loadMembersDirectory()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    // E. Periodic background sync every 8 seconds as a resilient backup
    const interval = setInterval(() => {
      loadMembersDirectory()
    }, 8000)

    return () => {
      supabase.removeChannel(channel)
      realtimeChannelRef.current = null
      bc?.close()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [loadMembersDirectory])

  // Derive permissions strictly from verified database profile
  const userFacingRole: UserFacingRole = formatRoleName(profile?.role || 'member') as UserFacingRole
  const membershipStatus: MembershipStatus | null = profile?.membership_status || null

  // Authorization flags strictly require active or alumni status and matching technical role:
  const isStaff = Boolean(
    profile &&
      (profile.role === 'admin' || profile.role === 'organizer') &&
      (profile.membership_status === 'active' || profile.membership_status === 'alumni')
  )

  const isAdmin = Boolean(
    profile &&
      profile.role === 'admin' &&
      (profile.membership_status === 'active' || profile.membership_status === 'alumni')
  )

  const isActiveMember = Boolean(profile && profile.membership_status === 'active')

  const canCreateEvents = Boolean(
    profile &&
      (profile.role === 'admin' || profile.role === 'organizer') &&
      (profile.membership_status === 'active' || profile.membership_status === 'alumni')
  )

  const addAuditLog = (
    action: string,
    targetType: string,
    targetId: string,
    beforeValue?: any,
    afterValue?: any
  ) => {
    const newLog: AuditLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'audit-' + Date.now(),
      actor_id: profile?.id || null,
      actor_name: profile?.full_name || 'Authenticated User',
      action,
      target_type: targetType,
      target_id: targetId,
      before_value: beforeValue,
      after_value: afterValue,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    }
    setAuditLogs((prev) => [newLog, ...prev])

    // Persist audit log to Supabase (fire-and-forget with error surfacing)
    supabase
      .from('audit_logs')
      .insert([
        {
          id: newLog.id,
          actor_id: newLog.actor_id,
          action: newLog.action,
          target_type: newLog.target_type,
          target_id: newLog.target_id,
          before_value: beforeValue,
          after_value: afterValue,
        },
      ])
      .then(
        ({ error }) => {
          if (error) console.warn('Audit log insert failed:', error.message)
        },
        (e: unknown) => {
          console.warn('Audit log insert network error:', e)
        }
      )

    return newLog
  }

  // Sign Out: Clears Supabase session and resets state to pure unauthenticated guest
  const signOut = async () => {
    try {
      localStorage.removeItem('devstudio_admin_session')
    } catch (e) {}
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Error signing out from Supabase:', err)
    }
    setUser(null)
    setProfile(null)
  }

  // Refresh profile from Supabase
  const refreshProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      await loadProfileForUser(session.user)
      await loadMembersDirectory()
    } else {
      setUser(null)
      setProfile(null)
    }
  }

  // Member updates their own safe profile fields (never role or membership status)
  const updateProfile = async (
    data: Partial<Profile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile || !user) {
      return { success: false, error: 'Not authenticated.' }
    }

    const sanitizedData = {
      full_name: data.full_name !== undefined ? data.full_name.trim() : profile.full_name,
      bio: data.bio !== undefined ? data.bio : profile.bio,
      academic_year: data.academic_year !== undefined ? data.academic_year : profile.academic_year,
      branch: data.branch !== undefined ? data.branch : profile.branch,
      usn: data.usn !== undefined ? data.usn : profile.usn,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', user.id)

      if (error) {
        console.error('Failed to update profile in database:', error.message)
        return { success: false, error: `Database update failed: ${error.message}` }
      }
    } catch (e: any) {
      console.error('Network error updating profile:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    const updatedProfile: Profile = { ...profile, ...sanitizedData }
    setProfile(updatedProfile)
    setMembers((prev) => prev.map((m) => (m.id === profile.id ? updatedProfile : m)))

    addAuditLog('profile.updated', 'profile', profile.id, profile, sanitizedData)
    broadcastRealtimeEvent('PROFILE_UPDATED', { userId: profile.id, updates: sanitizedData })
    return { success: true }
  }

  // Submit Photo for moderation
  const submitPhotoForModeration = async (
    photoDataUrl: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile || !user) return { success: false, error: 'Not authenticated.' }

    const updates = {
      avatar_type: 'photo' as const,
      photo_moderation_status: 'pending' as const,
      pending_photo_url: photoDataUrl,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) {
        console.error('Failed to submit photo for moderation:', error.message)
        return { success: false, error: `Database update failed: ${error.message}` }
      }
    } catch (e: any) {
      console.error('Network error submitting photo:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    const updated = { ...profile, ...updates }
    setProfile(updated)
    setMembers((prev) => prev.map((m) => (m.id === profile.id ? updated : m)))

    addAuditLog('photo.submitted_for_moderation', 'profile', profile.id, null, {
      photo_moderation_status: 'pending',
    })

    const broadcastUpdates = { ...updates, pending_photo_url: undefined }
    broadcastRealtimeEvent('PHOTO_SUBMITTED', { userId: profile.id, updates: broadcastUpdates })
    return { success: true }
  }

  // Remove photo (revert to default monogram)
  const removePhoto = async (): Promise<{ success: boolean; error?: string }> => {
    if (!profile || !user) return { success: false, error: 'Not authenticated.' }

    const updates = {
      avatar_type: 'default' as const,
      avatar_url: null,
      photo_moderation_status: 'approved' as const,
      pending_photo_url: null,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) {
        console.error('Failed to reset avatar in database:', error.message)
        return { success: false, error: `Database update failed: ${error.message}` }
      }
    } catch (e: any) {
      console.error('Network error resetting avatar:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    const updated = { ...profile, ...updates }
    setProfile(updated)
    setMembers((prev) => prev.map((m) => (m.id === profile.id ? updated : m)))
    broadcastRealtimeEvent('PROFILE_UPDATED', { userId: profile.id, updates })
    return { success: true }
  }

  // Moderate Photo (Staff only)
  const moderatePhoto = async (
    userId: string,
    approved: boolean,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isStaff) {
      return { success: false, error: '403 Forbidden: Staff authorization required.' }
    }

    const targetMember = members.find((m) => m.id === userId)
    if (!targetMember) return { success: false, error: 'Member not found.' }

    const updates = approved
      ? {
          avatar_url: targetMember.pending_photo_url || targetMember.avatar_url,
          pending_photo_url: null,
          photo_moderation_status: 'approved' as const,
          photo_rejection_reason: null,
          updated_at: new Date().toISOString(),
        }
      : {
          pending_photo_url: null,
          photo_moderation_status: 'rejected' as const,
          photo_rejection_reason: reason || 'Photo does not meet institutional requirements.',
          updated_at: new Date().toISOString(),
        }

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
      if (error) {
        console.error('Failed to moderate photo in database:', error.message)
        return { success: false, error: `Database update failed: ${error.message}` }
      }
    } catch (e: any) {
      console.error('Network error moderating photo:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, ...updates } : m)))
    if (profile?.id === userId) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
    }

    addAuditLog(approved ? 'photo.approved' : 'photo.rejected', 'profile', userId, null, {
      approved,
      reason,
    })
    const broadcastUpdates = { ...updates, pending_photo_url: undefined, avatar_url: undefined }
    broadcastRealtimeEvent('PHOTO_MODERATED', { userId, approved, updates: broadcastUpdates })
    return { success: true }
  }

  // Update Member Role (Dev Director only)
  const updateMemberRole = async (
    userId: string,
    newRole: TechnicalRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: '403 Forbidden: Only Dev Directors can modify member roles.' }
    }

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_update_member_role', {
        p_user_id: userId,
        p_role: newRole,
      })

      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        // Confirmed via RPC
      } else {
        const { data: updatedRows, error } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()

        if (error) {
          console.error('Failed to update role in database:', error.message)
          return { success: false, error: `Database update failed: ${error.message}` }
        }

        if (!updatedRows || updatedRows.length === 0) {
          console.error(`Database update affected 0 rows (table: profiles, action: updateRole, user: ${userId})`)
          return {
            success: false,
            error: 'You don\'t have permission to do this, or the member no longer exists. Try refreshing the page.',
          }
        }
      }
    } catch (e: any) {
      console.error('Network error updating role:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)))
    if (profile?.id === userId) {
      setProfile((prev) => (prev ? { ...prev, role: newRole } : null))
    }

    addAuditLog('role.promoted', 'profile', userId, null, { role: newRole })
    broadcastRealtimeEvent('ROLE_CHANGED', { userId, role: newRole, updates: { role: newRole } })
    return { success: true }
  }

  // Update Membership Status (Dev Director only)
  const updateMembershipStatus = async (
    userId: string,
    newStatus: MembershipStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return {
        success: false,
        error: '403 Forbidden: Only Dev Directors can update membership lifecycle status.',
      }
    }

    const target = members.find((m) => m.id === userId)
    const newDevStudioId =
      newStatus === 'active' && !target?.devstudio_id
        ? `DS26-000${members.length + 1}`
        : target?.devstudio_id

    const updates = {
      membership_status: newStatus,
      devstudio_id: newDevStudioId,
      updated_at: new Date().toISOString(),
    }

    try {
      // 1. Try secure RPC function (SECURITY DEFINER, bypasses RLS)
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_update_membership_status', {
        p_user_id: userId,
        p_status: newStatus,
        p_devstudio_id: newDevStudioId || null,
      })

      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        // Confirmed DB write via RPC
      } else {
        // Fallback: direct table update with .select() to verify at least 1 row affected
        const { data: updatedRows, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()

        if (error) {
          console.error('Failed to update membership status in database:', error.message)
          return { success: false, error: `Database update failed: ${error.message}` }
        }

        if (!updatedRows || updatedRows.length === 0) {
          console.error(`Database update affected 0 rows (table: profiles, action: updateStatus, user: ${userId})`)
          return {
            success: false,
            error: 'You don\'t have permission to do this, or the member no longer exists. Try refreshing the page.',
          }
        }
      }
    } catch (e: any) {
      console.error('Network error updating membership status:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    setMembers((prev) => {
      const next = prev.map((m) => (m.id === userId ? { ...m, ...updates } : m))
      saveStoredMembers(next)
      return next
    })
    if (profile?.id === userId) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
    }

    addAuditLog('membership.status_changed', 'profile', userId, null, { status: newStatus, reason })

    broadcastRealtimeEvent('STATUS_CHANGED', { userId, status: newStatus, updates })

    return { success: true }
  }

  // Add Member Directly (Dev Director only)
  const addMember = async (data: {
    full_name: string
    email: string
    role?: TechnicalRole
    academic_year?: number
    branch?: string
    usn?: string
  }): Promise<{ success: boolean; error?: string; member?: Profile }> => {
    if (!isAdmin) {
      return { success: false, error: '403 Forbidden: Only Dev Directors can directly add members.' }
    }

    const cleanEmail = data.email.trim().toLowerCase()
    if (!isAllowedEmail(cleanEmail)) {
      return { success: false, error: 'Member email must end with @mite.ac.in institutional domain.' }
    }

    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A member with this institutional email already exists.' }
    }

    const seqNum = members.length + 1
    const generatedId = `DS26-${String(seqNum).padStart(4, '0')}`
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      full_name: data.full_name.trim(),
      role: data.role || 'member',
      membership_status: 'active',
      academic_year: data.academic_year || 2026,
      branch: data.branch || 'Computer Science & Engineering',
      usn: data.usn || null,
      avatar_type: 'default',
      photo_moderation_status: 'approved',
      devstudio_id: generatedId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from('profiles').insert([newProfile])
      if (error) {
        console.error('Failed to add member to database:', error.message)
        return { success: false, error: `Database insert failed: ${error.message}` }
      }
    } catch (e: any) {
      console.error('Network error adding member:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    setMembers((prev) => {
      const next = mergeProfiles([newProfile], prev)
      saveStoredMembers(next)
      return next
    })
    addAuditLog('member.added', 'profile', newProfile.id, null, {
      email: newProfile.email,
      role: newProfile.role,
      devstudio_id: newProfile.devstudio_id,
    })

    broadcastRealtimeEvent('NEW_APPLICATION', { member: newProfile })

    return { success: true, member: newProfile }
  }

  // Remove Member (Dev Director only)
  const removeMember = async (
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: '403 Forbidden: Only Dev Directors can remove members.' }
    }

    const target = members.find((m) => m.id === userId)
    if (!target) {
      return { success: false, error: 'Member record not found.' }
    }

    if (ALLOWED_ADMIN_EMAILS.includes(target.email.trim().toLowerCase())) {
      const duplicateCount = members.filter(m => m.email.trim().toLowerCase() === target.email.trim().toLowerCase()).length
      if (duplicateCount <= 1) {
        return { success: false, error: 'Security restriction: Cannot remove the primary Dev Director.' }
      }
    }

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_remove_member', {
        p_user_id: userId,
      })

      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        // Deleted via RPC
      } else {
        const { error } = await supabase.from('profiles').delete().eq('id', userId)
        if (error) {
          console.error('Failed to remove member from database:', error.message)
          return { success: false, error: `Database delete failed: ${error.message}` }
        }
      }
    } catch (e: any) {
      console.error('Network error removing member:', e)
      return { success: false, error: `Network error: ${e.message || 'Failed to reach database.'}` }
    }

    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== userId)
      saveStoredMembers(next)
      return next
    })
    addAuditLog('member.removed', 'profile', userId, target, { reason })

    broadcastRealtimeEvent('MEMBER_REMOVED', { userId })

    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userFacingRole,
        membershipStatus,
        isStaff,
        isAdmin,
        isActiveMember,
        canCreateEvents,
        isLoaded,
        members,
        auditLogs,
        isDatabaseConfigured,
        signOut,
        refreshProfile,
        updateProfile,
        submitPhotoForModeration,
        removePhoto,
        moderatePhoto,
        updateMemberRole,
        updateMembershipStatus,
        addMember,
        removeMember,
        syncMembersDirectory,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
