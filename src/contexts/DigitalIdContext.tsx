import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DigitalIdRecord, provisionDigitalId, sha256 } from '@/lib/digitalId'
import { supabase } from '@/lib/supabase'

interface DigitalIdContextType {
  digitalIds: DigitalIdRecord[]
  activeDigitalId: DigitalIdRecord | null
  isLoading: boolean
  getDigitalIdByUserId: (userId: string) => DigitalIdRecord | null
  getDigitalIdByToken: (token: string) => Promise<DigitalIdRecord | null>
  revokeDigitalId: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>
  reinstateDigitalId: (id: string) => Promise<{ success: boolean; error?: string }>
  refreshDigitalId: () => Promise<void>
}

const DigitalIdContext = createContext<DigitalIdContextType | undefined>(undefined)

export const DigitalIdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, members, isAdmin } = useAuth()
  const [digitalIds, setDigitalIds] = useState<DigitalIdRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from Supabase first, then merge with localStorage
  useEffect(() => {
    const loadDigitalIds = async () => {
      let localRecords: DigitalIdRecord[] = []
      const saved = localStorage.getItem('devstudio_digital_ids')
      if (saved) {
        try {
          localRecords = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse digital IDs', e)
        }
      }

      try {
        const { data, error } = await supabase
          .from('digital_ids')
          .select('*')
          .order('issued_at', { ascending: false })

        if (!error && data) {
          const remoteRecords = data as DigitalIdRecord[]
          // Merge remote records with any local records not yet present remotely
          const merged = [...remoteRecords]
          for (const loc of localRecords) {
            if (!merged.some((r) => r.user_id === loc.user_id)) {
              merged.push(loc)
              persistToSupabase(loc)
            }
          }
          setDigitalIds(merged)
          localStorage.setItem('devstudio_digital_ids', JSON.stringify(merged))
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.warn('Supabase digital_ids fetch fallback to localStorage:', e)
      }

      // Fallback to localStorage
      setDigitalIds(localRecords)
      setIsLoading(false)
    }

    loadDigitalIds()
  }, [])

  const saveRecords = (updated: DigitalIdRecord[]) => {
    setDigitalIds(updated)
    localStorage.setItem('devstudio_digital_ids', JSON.stringify(updated))
  }

  // Persist a single digital ID to Supabase (with RPC security definer fallback)
  const persistToSupabase = async (record: DigitalIdRecord) => {
    try {
      // 1. Try secure RPC function (SECURITY DEFINER, bypasses RLS)
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_sync_digital_id', {
        p_id: record.id,
        p_user_id: record.user_id,
        p_devstudio_id: record.devstudio_id,
        p_token: record.token,
        p_token_hash: record.token_hash,
        p_raw_token_preview: record.raw_token_preview,
        p_status: record.status,
        p_qr_payload_url: record.qr_payload_url,
        p_apple_wallet_serial: record.apple_wallet_serial,
        p_google_wallet_object_id: record.google_wallet_object_id,
      })

      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        return
      }

      // 2. Direct table upsert fallback
      const { error } = await supabase.from('digital_ids').upsert(
        [
          {
            id: record.id,
            user_id: record.user_id,
            devstudio_id: record.devstudio_id,
            token: record.token,
            token_hash: record.token_hash,
            raw_token_preview: record.raw_token_preview,
            status: record.status,
            qr_payload_url: record.qr_payload_url,
            apple_wallet_serial: record.apple_wallet_serial,
            google_wallet_object_id: record.google_wallet_object_id,
            issued_at: record.issued_at,
            expires_at: record.expires_at,
          },
        ],
        { onConflict: 'user_id' }
      )

      if (error) {
        console.error('Failed to persist Digital ID to Supabase:', error.message)
      }
    } catch (e) {
      console.error('Network error persisting Digital ID to Supabase:', e)
    }
  }

  // Automatically provision Digital ID for active members if not present
  useEffect(() => {
    if (!profile || profile.membership_status !== 'active') return

    const checkAndProvision = async () => {
      const existing = digitalIds.find((r) => r.user_id === profile.id)
      if (!existing) {
        const newRecord = await provisionDigitalId(profile, digitalIds)
        const updated = [...digitalIds, newRecord]
        saveRecords(updated)
        await persistToSupabase(newRecord)
      }
    }

    checkAndProvision()
  }, [profile, digitalIds])

  // Also auto-provision for any active members in the directory
  useEffect(() => {
    const activeMembers = members.filter((m) => m.membership_status === 'active')
    if (activeMembers.length === 0) return

    const provisionAllActive = async () => {
      let currentList = [...digitalIds]
      let hasChanges = false

      for (const m of activeMembers) {
        if (!currentList.some((r) => r.user_id === m.id)) {
          const newRecord = await provisionDigitalId(m, currentList)
          currentList = [...currentList, newRecord]
          hasChanges = true
          // Persist each new record to Supabase
          await persistToSupabase(newRecord)
        }
      }

      if (hasChanges) {
        saveRecords(currentList)
      }
    }

    provisionAllActive()
  }, [members])

  const activeDigitalId = profile ? digitalIds.find((r) => r.user_id === profile.id) || null : null

  const getDigitalIdByUserId = (userId: string): DigitalIdRecord | null => {
    return digitalIds.find((r) => r.user_id === userId) || null
  }

  const getDigitalIdByToken = async (token: string): Promise<DigitalIdRecord | null> => {
    if (!token) return null
    // First try exact token match in state
    let directMatch = digitalIds.find((r) => r.token === token)
    if (directMatch) return directMatch

    // Or match by SHA-256 hash or devstudio_id
    const computedHash = await sha256(token)
    directMatch = digitalIds.find(
      (r) => r.token_hash === computedHash || r.token_hash === token || r.devstudio_id === token
    )
    if (directMatch) return directMatch

    // Query Supabase directly
    try {
      const { data, error } = await supabase
        .from('digital_ids')
        .select('*')
        .or(`token.eq.${token},token_hash.eq.${computedHash},token_hash.eq.${token},devstudio_id.eq.${token}`)
        .limit(1)

      if (!error && data && data.length > 0) {
        return data[0] as DigitalIdRecord
      }
    } catch (e) {
      console.warn('Supabase direct query notice in getDigitalIdByToken:', e)
    }

    return null
  }

  const revokeDigitalId = async (id: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Only a Dev Director can revoke a Digital ID.' }
    }

    const updated = digitalIds.map(record => {
      if (record.id === id) {
        return {
          ...record,
          status: 'revoked' as const,
          revoked_at: new Date().toISOString(),
          revocation_reason: reason,
        }
      }
      return record
    })

    saveRecords(updated)
    return { success: true }
  }

  const reinstateDigitalId = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Only a Dev Director can reinstate a Digital ID.' }
    }

    const updated = digitalIds.map(record => {
      if (record.id === id) {
        return {
          ...record,
          status: 'active' as const,
          revoked_at: null,
          revocation_reason: null,
        }
      }
      return record
    })

    saveRecords(updated)
    return { success: true }
  }

  const refreshDigitalId = async () => {
    const saved = localStorage.getItem('devstudio_digital_ids')
    if (saved) {
      setDigitalIds(JSON.parse(saved))
    }
  }

  return (
    <DigitalIdContext.Provider
      value={{
        digitalIds,
        activeDigitalId,
        isLoading,
        getDigitalIdByUserId,
        getDigitalIdByToken,
        revokeDigitalId,
        reinstateDigitalId,
        refreshDigitalId,
      }}
    >
      {children}
    </DigitalIdContext.Provider>
  )
}

export const useDigitalId = () => {
  const context = useContext(DigitalIdContext)
  if (!context) {
    throw new Error('useDigitalId must be used within a DigitalIdProvider')
  }
  return context
}
