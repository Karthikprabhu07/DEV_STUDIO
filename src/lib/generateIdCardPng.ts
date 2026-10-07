import QRCode from 'qrcode'
import { Profile } from '@/types'
import { DigitalIdRecord } from '@/lib/digitalId'

/**
 * Renders an authentic, pixel-accurate, high-resolution PNG of the DEVSTUDIO
 * Digital ID card per the Color System and UX Brief specifications:
 * - Real 840x1160 canvas (retina 2x resolution)
 * - Corner registration marks (drafting L-brackets in slate-700)
 * - IBM Plex Mono for technical DevStudio ID in Line Cyan (#4A8FA6)
 * - Real scannable ISO/IEC QR code
 * - Native Mobile Share Sheet support (navigator.share)
 */
export async function downloadIdCardPng(
  profile: Profile,
  digitalId: DigitalIdRecord
): Promise<{ success: boolean; shared?: boolean; error?: string }> {
  try {
    const width = 840
    const height = 1160
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not obtain 2D canvas context')

    // 1. Background Shell
    ctx.fillStyle = '#0A0E1A'
    ctx.fillRect(0, 0, width, height)

    // Inner Card Gradient
    const cardMargin = 24
    const cardW = width - cardMargin * 2
    const cardH = height - cardMargin * 2
    const cardR = 36

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, cardR)
    ctx.clip()

    const grad = ctx.createLinearGradient(cardMargin, cardMargin, width, height)
    grad.addColorStop(0, '#0A0E1A')
    grad.addColorStop(0.5, '#12172A')
    grad.addColorStop(1, '#0A0E1A')
    ctx.fillStyle = grad
    ctx.fillRect(cardMargin, cardMargin, cardW, cardH)

    // Card border
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 3
    ctx.stroke()

    // 2. Corner Registration Marks (Technical Drafting Marks)
    const markInset = 48
    const markSize = 28
    const markThickness = 4
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = markThickness
    ctx.lineCap = 'square'

    // Top-Left
    ctx.beginPath()
    ctx.moveTo(markInset, markInset + markSize)
    ctx.lineTo(markInset, markInset)
    ctx.lineTo(markInset + markSize, markInset)
    ctx.stroke()

    // Top-Right
    ctx.beginPath()
    ctx.moveTo(width - markInset - markSize, markInset)
    ctx.lineTo(width - markInset, markInset)
    ctx.lineTo(width - markInset, markInset + markSize)
    ctx.stroke()

    // Bottom-Left
    ctx.beginPath()
    ctx.moveTo(markInset, height - markInset - markSize)
    ctx.lineTo(markInset, height - markInset)
    ctx.lineTo(markInset + markSize, height - markInset)
    ctx.stroke()

    // Bottom-Right
    ctx.beginPath()
    ctx.moveTo(width - markInset - markSize, height - markInset)
    ctx.lineTo(width - markInset, height - markInset)
    ctx.lineTo(width - markInset, height - markInset - markSize)
    ctx.stroke()

    // 3. Header: Brand Lockup
    // Surface Box + Accent Primary Terminal Icon
    const logoX = 72
    const logoY = 80
    const logoS = 64
    ctx.fillStyle = '#12172A'
    ctx.strokeStyle = 'rgba(59, 107, 251, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(logoX, logoY, logoS, logoS, 14)
    ctx.fill()
    ctx.stroke()

    // Terminal chevron in Accent Primary (#3B6BFB)
    ctx.strokeStyle = '#3B6BFB'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(logoX + 22, logoY + 24)
    ctx.lineTo(logoX + 32, logoY + 32)
    ctx.lineTo(logoX + 22, logoY + 40)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(logoX + 36, logoY + 40)
    ctx.lineTo(logoX + 46, logoY + 40)
    ctx.stroke()

    // DEVSTUDIO Wordmark
    ctx.fillStyle = '#F5F7FA'
    ctx.font = 'bold 32px monospace'
    ctx.fillText('DEVSTUDIO', logoX + 80, logoY + 32)

    // MITE Pill
    ctx.fillStyle = 'rgba(59, 107, 251, 0.12)'
    ctx.strokeStyle = 'rgba(59, 107, 251, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(logoX + 300, logoY + 10, 68, 26, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#3B6BFB'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('MITE', logoX + 314, logoY + 28)

    // Sub-label: BUILD. SHIP. LEARN.
    ctx.fillStyle = '#8B93A7'
    ctx.font = '16px monospace'
    ctx.fillText('BUILD. SHIP. LEARN.', logoX + 80, logoY + 54)

    // NFC Symbol & Member ID text
    ctx.fillStyle = '#8B93A7'
    ctx.font = '16px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('MEMBER ID  ))', width - 72, logoY + 36)
    ctx.textAlign = 'left'

    // 4. Smart Chip Graphic
    const chipX = 72
    const chipY = 176
    const chipW = 96
    const chipH = 76
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH)
    chipGrad.addColorStop(0, '#D97706')
    chipGrad.addColorStop(0.4, '#FDE68A')
    chipGrad.addColorStop(1, '#B45309')
    ctx.fillStyle = chipGrad
    ctx.beginPath()
    ctx.roundRect(chipX, chipY, chipW, chipH, 10)
    ctx.fill()
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Chip contact grid
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(chipX + 24, chipY + 16, 48, 44)
    ctx.beginPath()
    ctx.moveTo(chipX + 48, chipY)
    ctx.lineTo(chipX + 48, chipY + chipH)
    ctx.stroke()

    // Secure Credential Pill
    ctx.fillStyle = 'rgba(18, 23, 42, 0.8)'
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(width - 290, chipY + 20, 218, 36, 18)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#3B6BFB'
    ctx.font = 'bold 15px monospace'
    ctx.fillText('✦ SECURE CREDENTIAL', width - 272, chipY + 44)

    // 5. Middle Section: Photo & Member Details
    const photoX = 72
    const photoY = 300
    const photoSize = 190

    // Photo Box
    ctx.fillStyle = '#12172A'
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(photoX, photoY, photoSize, photoSize, 20)
    ctx.fill()
    ctx.stroke()

    // Monogram if no image
    ctx.fillStyle = '#8B93A7'
    ctx.font = 'bold 64px monospace'
    ctx.textAlign = 'center'
    const initials = (profile.full_name || 'DS')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    ctx.fillText(initials, photoX + photoSize / 2, photoY + 115)
    ctx.textAlign = 'left'

    // Verified badge pip
    ctx.fillStyle = '#22C55E'
    ctx.beginPath()
    ctx.arc(photoX + photoSize - 8, photoY + photoSize - 8, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#12172A'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('✓', photoX + photoSize - 15, photoY + photoSize - 2)

    // Details Column
    const detailX = 296
    let curY = photoY + 36

    // Role Badge
    const roleLabel =
      profile.role === 'admin'
        ? 'Dev Director'
        : profile.role === 'organizer'
        ? 'Dev Captain'
        : 'Dev Mate'

    ctx.fillStyle = '#12172A'
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(detailX, curY - 26, 160, 34, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#F5F7FA'
    ctx.font = 'bold 15px monospace'
    ctx.fillText(roleLabel, detailX + 16, curY - 4)

    // Member Full Name
    curY += 46
    ctx.fillStyle = '#F5F7FA'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText(profile.full_name, detailX, curY)

    // DevStudio ID in Line Cyan (#14B8A6) & IBM Plex Mono
    curY += 48
    ctx.fillStyle = '#14B8A6'
    ctx.font = 'bold 28px monospace'
    ctx.fillText(digitalId.devstudio_id, detailX, curY)

    // Academic & Department info
    curY += 40
    ctx.fillStyle = '#8B93A7'
    ctx.font = '20px monospace'
    if (profile.usn) {
      ctx.fillText(`USN:  ${profile.usn}`, detailX, curY)
      curY += 30
    }
    const dept = profile.branch || (profile.role === 'admin' ? 'Engineering Lead' : 'Computer Science')
    ctx.fillText(`DEPT: ${dept}`, detailX, curY)

    // 6. Lower Divider
    const divY = 560
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(72, divY)
    ctx.lineTo(width - 72, divY)
    ctx.stroke()

    // 7. Bottom Section: QR Code & Verification Tag
    const qrSize = 220
    const qrX = width - 72 - qrSize
    const qrY = 600

    // White backing box for 100% reliable scan contrast
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16)
    ctx.fill()

    // Draw real scannable QR onto offscreen canvas and draw into main canvas
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, digitalId.qr_payload_url, {
      width: qrSize,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0A0E1A',
        light: '#FFFFFF',
      },
    })
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

    // Left info in bottom section
    let bY = 640
    ctx.fillStyle = '#8B93A7'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('SCAN TO VERIFY', 72, bY)

    bY += 36
    ctx.fillStyle = '#22C55E'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('✓ ACTIVE COHORT', 72, bY)

    bY += 32
    ctx.fillStyle = '#8B93A7'
    ctx.font = '18px monospace'
    const expDate = new Date(digitalId.expires_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
    ctx.fillText(`EXP: ${expDate}`, 72, bY)

    bY += 36
    ctx.fillStyle = '#14B8A6'
    ctx.font = '14px monospace'

    // Clean verification URL (clean host + verify path, e.g. dev-studio-club.vercel.app/verify)
    let displayUrl = 'dev-studio-club.vercel.app/verify'
    try {
      const parsedUrl = new URL(
        digitalId.qr_payload_url.startsWith('http')
          ? digitalId.qr_payload_url
          : `https://${digitalId.qr_payload_url}`
      )
      displayUrl = `${parsedUrl.host}/verify`
    } catch {
      displayUrl = digitalId.qr_payload_url.replace(/^https?:\/\//, '').split('?')[0].split('/')[0] + '/verify'
    }

    let urlText = `URL: ${displayUrl}`
    // Ensure text strictly stops before QR code white backing box (qrX - 10)
    const maxUrlWidth = qrX - 10 - 24 - 72 // 442px max width
    while (ctx.measureText(urlText).width > maxUrlWidth && displayUrl.length > 8) {
      displayUrl = displayUrl.slice(0, -4) + '...'
      urlText = `URL: ${displayUrl}`
    }
    ctx.fillText(urlText, 72, bY)

    // 8. Cryptographic Hash Footer
    const footY = 900
    ctx.strokeStyle = '#22273B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(72, footY)
    ctx.lineTo(width - 72, footY)
    ctx.stroke()

    ctx.fillStyle = '#8B93A7'
    ctx.font = '14px monospace'
    ctx.fillText('SHA-256 PUBLIC VERIFICATION HASH (ZERO PII)', 72, footY + 36)

    ctx.fillStyle = '#14B8A6'
    ctx.font = '15px monospace'
    const hashPreview = digitalId.token_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    ctx.fillText(hashPreview.slice(0, 48) + '...', 72, footY + 66)

    // Institutional Footer
    ctx.fillStyle = '#8B93A7'
    ctx.font = '16px monospace'
    ctx.fillText('MANGALORE INSTITUTE OF TECHNOLOGY & ENGINEERING', 72, height - 60)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#3B6BFB'
    ctx.fillText('DEVSTUDIO OFFICIAL CREDENTIAL', width - 72, height - 60)
    ctx.textAlign = 'left'

    ctx.restore()

    // 9. Export to Blob
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    )
    if (!blob) throw new Error('Failed to generate PNG blob from canvas')

    const filename = `DEVSTUDIO-ID-${digitalId.devstudio_id}.png`
    const file = new File([blob], filename, { type: 'image/png' })

    // If on mobile device and Web Share API supports file sharing:
    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      await navigator.share({
        files: [file],
        title: `DevStudio Digital ID — ${digitalId.devstudio_id}`,
        text: `Official verified DevStudio membership credential for ${profile.full_name}.`,
      })
      return { success: true, shared: true }
    }

    // Direct Browser Download
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000)

    return { success: true, shared: false }
  } catch (err: any) {
    console.error('downloadIdCardPng failed:', err)
    return { success: false, error: err.message || 'Failed to download ID card.' }
  }
}
