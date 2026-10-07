import React, { createContext, useContext, useState, useEffect } from 'react'
import { ClubCertificate, CertificateType } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { generateCryptographicToken, sha256 } from '@/lib/digitalId'
import { supabase } from '@/lib/supabase'

interface CertificatesContextType {
  certificates: ClubCertificate[]
  issueCertificate: (data: {
    user_id: string
    event_id?: string
    title: string
    description: string
    certificate_type: CertificateType
  }) => Promise<{ success: boolean; error?: string; certificate?: ClubCertificate; rawToken?: string }>
  revokeCertificate: (certId: string, reason: string) => Promise<{ success: boolean; error?: string }>
  rotateCertificateToken: (certId: string) => Promise<{ success: boolean; error?: string; newRawToken?: string }>
  verifyCertificateByToken: (rawToken: string) => Promise<{
    verified: boolean
    status?: 'valid' | 'revoked' | 'invalid'
    certificate?: ClubCertificate
    tokenHash?: string
  }>
  rotateMemberIdToken: (userId: string) => Promise<{ success: boolean; error?: string; newRawToken?: string }>
}

const CertificatesContext = createContext<CertificatesContextType | undefined>(undefined)

export const CertificatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isStaff, members } = useAuth()
  const [certificates, setCertificates] = useState<ClubCertificate[]>([])

  // Load certificates
  useEffect(() => {
    const loadCerts = () => {
      try {
        const saved = localStorage.getItem('devstudio_certificates')
        if (saved) {
          setCertificates(JSON.parse(saved))
        }
      } catch (e) {
        console.error('Error loading certificates cache:', e)
      }
    }

    loadCerts()

    // Sync from Supabase
    const syncFromDb = async () => {
      try {
        const { data } = await supabase.from('certificates').select('*')
        if (data && data.length > 0) {
          setCertificates(data)
          localStorage.setItem('devstudio_certificates', JSON.stringify(data))
        }
      } catch {
        // Local cache fallback
      }
    }

    syncFromDb()
  }, [])

  const saveCerts = (updated: ClubCertificate[]) => {
    setCertificates(updated)
    localStorage.setItem('devstudio_certificates', JSON.stringify(updated))
  }

  // Issue Certificate (Staff only)
  const issueCertificate = async (data: {
    user_id: string
    event_id?: string
    title: string
    description: string
    certificate_type: CertificateType
  }) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Staff credentials required to issue official certificates.' }
    }

    const recipient = members.find((m) => m.id === data.user_id)
    if (!recipient) {
      return { success: false, error: 'Recipient member profile not found.' }
    }

    const rawToken = generateCryptographicToken()
    const tokenHash = await sha256(rawToken)
    const rawTokenPreview = `${rawToken.slice(0, 4)}...${rawToken.slice(-4)}`

    const newCert: ClubCertificate = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      event_id: data.event_id || null,
      title: data.title,
      description: data.description,
      issue_date: new Date().toISOString().split('T')[0],
      certificate_type: data.certificate_type,
      token_hash: tokenHash,
      raw_token_preview: rawTokenPreview,
      status: 'valid',
      issued_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: recipient,
    }

    const updated = [newCert, ...certificates]
    saveCerts(updated)

    // Sync to Supabase
    try {
      await supabase.from('certificates').insert([newCert])
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Add audit log
    const auditRecord = {
      id: crypto.randomUUID(),
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: 'ISSUE_CERTIFICATE',
      target_type: 'certificate',
      target_id: newCert.id,
      after_value: {
        title: newCert.title,
        recipient_id: newCert.user_id,
        recipient_name: recipient.full_name,
        token_hash: tokenHash,
      },
      created_at: new Date().toISOString(),
    }

    const existingLogs = JSON.parse(localStorage.getItem('devstudio_audit_logs') || '[]')
    localStorage.setItem('devstudio_audit_logs', JSON.stringify([auditRecord, ...existingLogs]))

    // Add notification to member
    const newNotif = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      title: 'Certificate Awarded!',
      message: `You have been awarded the official "${newCert.title}" certificate. Verify and download from your profile.`,
      type: 'badge' as const,
      link: `/verify-certificate/${rawToken}`,
      created_at: new Date().toISOString(),
    }
    const existingNotifs = JSON.parse(localStorage.getItem('devstudio_notifications') || '[]')
    localStorage.setItem('devstudio_notifications', JSON.stringify([newNotif, ...existingNotifs]))

    return { success: true, certificate: newCert, rawToken }
  }

  // Revoke Certificate (Staff only)
  const revokeCertificate = async (certId: string, reason: string) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Staff access required to revoke credentials.' }
    }

    const updated = certificates.map((c) => {
      if (c.id === certId) {
        return {
          ...c,
          status: 'revoked' as const,
          revocation_reason: reason,
          updated_at: new Date().toISOString(),
        }
      }
      return c
    })

    saveCerts(updated)

    try {
      await supabase
        .from('certificates')
        .update({ status: 'revoked', revocation_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', certId)
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Audit log
    const auditRecord = {
      id: crypto.randomUUID(),
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: 'REVOKE_CERTIFICATE',
      target_type: 'certificate',
      target_id: certId,
      after_value: { reason },
      created_at: new Date().toISOString(),
    }
    const existingLogs = JSON.parse(localStorage.getItem('devstudio_audit_logs') || '[]')
    localStorage.setItem('devstudio_audit_logs', JSON.stringify([auditRecord, ...existingLogs]))

    return { success: true }
  }

  // Rotate Certificate Token (Staff only)
  const rotateCertificateToken = async (certId: string) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Staff access required for cryptographic token rotation.' }
    }

    const newRawToken = generateCryptographicToken()
    const newTokenHash = await sha256(newRawToken)
    const newPreview = `${newRawToken.slice(0, 4)}...${newRawToken.slice(-4)}`

    const updated = certificates.map((c) => {
      if (c.id === certId) {
        return {
          ...c,
          token_hash: newTokenHash,
          raw_token_preview: newPreview,
          status: 'valid' as const,
          updated_at: new Date().toISOString(),
        }
      }
      return c
    })

    saveCerts(updated)

    try {
      await supabase
        .from('certificates')
        .update({
          token_hash: newTokenHash,
          raw_token_preview: newPreview,
          updated_at: new Date().toISOString(),
        })
        .eq('id', certId)
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Audit log
    const auditRecord = {
      id: crypto.randomUUID(),
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: 'ROTATE_CERTIFICATE_TOKEN',
      target_type: 'certificate',
      target_id: certId,
      after_value: { new_hash: newTokenHash },
      created_at: new Date().toISOString(),
    }
    const existingLogs = JSON.parse(localStorage.getItem('devstudio_audit_logs') || '[]')
    localStorage.setItem('devstudio_audit_logs', JSON.stringify([auditRecord, ...existingLogs]))

    return { success: true, newRawToken }
  }

  // Public Verification by raw token (SHA-256 comparison)
  const verifyCertificateByToken = async (rawToken: string) => {
    const computedHash = await sha256(rawToken.trim())

    // First check local certificates
    let matched = certificates.find((c) => c.token_hash === computedHash)

    // Fallback to Supabase if not found locally
    if (!matched) {
      try {
        const { data } = await supabase
          .from('certificates')
          .select('*, profiles:user_id(*)')
          .eq('token_hash', computedHash)
          .single()

        if (data) {
          matched = data
        }
      } catch {
        // lookup failed
      }
    }

    if (!matched) {
      return { verified: false, status: 'invalid' as const, tokenHash: computedHash }
    }

    // Match profile if missing
    if (!matched.profile) {
      matched.profile = members.find((m) => m.id === matched?.user_id)
    }

    return {
      verified: matched.status === 'valid',
      status: matched.status,
      certificate: matched,
      tokenHash: computedHash,
    }
  }

  // Rotate Member Digital ID Token (Security incident control)
  const rotateMemberIdToken = async (userId: string) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Staff access required to rotate student ID tokens.' }
    }

    const newRawToken = generateCryptographicToken()
    const newTokenHash = await sha256(newRawToken)
    const newPreview = `${newRawToken.slice(0, 4)}...${newRawToken.slice(-4)}`

    const existingIds = JSON.parse(localStorage.getItem('devstudio_digital_ids') || '[]')
    const updatedIds = existingIds.map((item: any) => {
      if (item.user_id === userId) {
        return {
          ...item,
          token: newRawToken,
          token_hash: newTokenHash,
          raw_token_preview: newPreview,
          qr_payload_url: `${window.location.origin}/verify/${newRawToken}`,
          token_rotated_at: new Date().toISOString(),
        }
      }
      return item
    })

    localStorage.setItem('devstudio_digital_ids', JSON.stringify(updatedIds))

    // Audit log
    const auditRecord = {
      id: crypto.randomUUID(),
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: 'ROTATE_ID_CARD_TOKEN',
      target_type: 'digital_id',
      target_id: userId,
      after_value: { new_hash: newTokenHash },
      created_at: new Date().toISOString(),
    }
    const existingLogs = JSON.parse(localStorage.getItem('devstudio_audit_logs') || '[]')
    localStorage.setItem('devstudio_audit_logs', JSON.stringify([auditRecord, ...existingLogs]))

    // Notify member
    const newNotif = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: 'Security Alert: ID Token Rotated',
      message: 'Your DevStudio ID QR token was rotated for security. Previous downloaded cards or scans have been invalidated.',
      type: 'system' as const,
      link: '/id-card',
      created_at: new Date().toISOString(),
    }
    const existingNotifs = JSON.parse(localStorage.getItem('devstudio_notifications') || '[]')
    localStorage.setItem('devstudio_notifications', JSON.stringify([newNotif, ...existingNotifs]))

    return { success: true, newRawToken }
  }

  return (
    <CertificatesContext.Provider
      value={{
        certificates,
        issueCertificate,
        revokeCertificate,
        rotateCertificateToken,
        verifyCertificateByToken,
        rotateMemberIdToken,
      }}
    >
      {children}
    </CertificatesContext.Provider>
  )
}

export const useCertificates = () => {
  const context = useContext(CertificatesContext)
  if (!context) {
    throw new Error('useCertificates must be used within a CertificatesProvider')
  }
  return context
}
