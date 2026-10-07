import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AttendanceRecord, AttendanceSession } from '@/lib/attendanceService'
import { Profile } from '@/types'

interface PdfAttendanceRow {
  slNo: number
  name: string
  usn: string
  status: 'PRESENT' | 'ABSENT'
  time: string
}

/**
 * Generate a professional attendance PDF for department sharing.
 * Shows: Sl. No, Member Name, USN, Status — no email addresses.
 */
export function generateAttendancePdf(
  session: AttendanceSession,
  records: AttendanceRecord[],
  memberProfiles: Profile[]
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // Build an exhaustive lookup map: member_id -> Profile (for name & USN resolution)
  const profileMap = new Map<string, Partial<Profile>>()
  // Default Dev Director profile
  profileMap.set('d9b89182-3d84-48f5-968b-5926c04f9810', {
    id: 'd9b89182-3d84-48f5-968b-5926c04f9810',
    full_name: 'Dev Director',
    devstudio_id: 'DS26-0001',
    email: 'devilknight2534@gmail.com',
    role: 'admin',
  })

  // 1. Read stored members from local storage directory if available
  try {
    if (typeof localStorage !== 'undefined') {
      const storedRaw = localStorage.getItem('devstudio_members_directory')
      if (storedRaw) {
        const stored = JSON.parse(storedRaw)
        if (Array.isArray(stored)) {
          stored.forEach((p: any) => {
            if (p.id) profileMap.set(p.id, p)
            if (p.email) profileMap.set(p.email.toLowerCase(), p)
            if (p.devstudio_id) profileMap.set(p.devstudio_id.toLowerCase(), p)
          })
        }
      }
    }
  } catch (e) {}

  // 2. Incorporate passed memberProfiles
  if (Array.isArray(memberProfiles)) {
    memberProfiles.forEach((p) => {
      if (p.id) profileMap.set(p.id, p)
      if (p.email) profileMap.set(p.email.toLowerCase(), p)
      if (p.devstudio_id) profileMap.set(p.devstudio_id.toLowerCase(), p)
    })
  }

  // 3. Incorporate profiles already embedded in records themselves
  records.forEach((r) => {
    if (r.member_id && (r.member_name || r.devstudio_id || (r as any).usn)) {
      const existing = profileMap.get(r.member_id) || {}
      profileMap.set(r.member_id, {
        ...existing,
        id: r.member_id,
        full_name: r.member_name || existing.full_name,
        devstudio_id: r.devstudio_id || existing.devstudio_id,
        usn: (r as any).usn || existing.usn,
      })
    }
  })

  // ─── HEADER ───
  // Blue accent bar at top
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Club name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('DEVSTUDIO', margin, 12)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(220, 230, 255)
  doc.text('MITE Student Technology Club — Attendance Report', margin, 18)

  // Date on right
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  const sessionDate = new Date(session.session_date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(sessionDate, pageWidth - margin, 12, { align: 'right' })

  // Time info
  const startTime = new Date(session.started_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = session.ended_at
    ? new Date(session.ended_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Ongoing'
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 215, 255)
  doc.text(`${startTime} — ${endTime}`, pageWidth - margin, 18, { align: 'right' })

  // ─── SESSION INFO ───
  let yPos = 36
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(session.title, margin, yPos)

  yPos += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Conducted by: ${session.started_by_name || 'Staff'}`, margin, yPos)

  // Exclude Dev Directors and Dev Captains: attendance reports strictly include Dev Mates (students)
  const cohortRecords = records.filter((r) => {
    const prof = profileMap.get(r.member_id)
    return prof?.role !== 'admin' && prof?.role !== 'organizer'
  })

  // ─── SUMMARY BOX ───
  yPos += 8
  const presentCount = cohortRecords.filter((r) => r.status === 'PRESENT').length
  const absentCount = cohortRecords.filter((r) => r.status === 'ABSENT').length
  const totalCount = cohortRecords.length

  // Summary background
  doc.setFillColor(245, 247, 250)
  doc.setDrawColor(220, 225, 230)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const summaryY = yPos + 9

  // Total
  doc.setTextColor(60, 60, 60)
  doc.text(`Total: ${totalCount}`, margin + 8, summaryY)

  // Present
  doc.setTextColor(22, 163, 74)
  doc.text(`Present: ${presentCount}`, margin + 50, summaryY)

  // Absent
  doc.setTextColor(220, 38, 38)
  doc.text(`Absent: ${absentCount}`, margin + 100, summaryY)

  // Percentage
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
  doc.setTextColor(59, 130, 246)
  doc.text(`Attendance: ${percentage}%`, margin + 145, summaryY)

  // ─── TABLE ───
  yPos += 20

  // Sort records: PRESENT first, then ABSENT, alphabetically within each group by resolved name
  const sortedRecords = [...cohortRecords].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'PRESENT' ? -1 : 1
    const nameA = a.member_name || profileMap.get(a.member_id)?.full_name || ''
    const nameB = b.member_name || profileMap.get(b.member_id)?.full_name || ''
    return nameA.localeCompare(nameB)
  })

  // Build table rows with authoritative Name and USN resolution
  const tableRows: PdfAttendanceRow[] = sortedRecords.map((rec, idx) => {
    const memberProfile =
      profileMap.get(rec.member_id) ||
      (rec.devstudio_id ? profileMap.get(rec.devstudio_id.toLowerCase()) : undefined) ||
      (rec.member_name ? profileMap.get(rec.member_name.toLowerCase()) : undefined) ||
      memberProfiles.find(
        (p) =>
          p.id === rec.member_id ||
          (rec.devstudio_id && p.devstudio_id?.toLowerCase() === rec.devstudio_id.toLowerCase()) ||
          (rec.member_name && p.full_name?.toLowerCase() === rec.member_name.toLowerCase())
      )

    // Resolve Name: Prioritize real member names, never fall back to placeholder if profile exists
    let resolvedName = ''
    if (rec.member_name && rec.member_name.trim() !== '' && rec.member_name !== 'DevStudio Member') {
      resolvedName = rec.member_name.trim()
    } else if (memberProfile?.full_name && memberProfile.full_name.trim() !== '' && memberProfile.full_name !== 'DevStudio Member') {
      resolvedName = memberProfile.full_name.trim()
    } else if (memberProfile?.email) {
      resolvedName = memberProfile.email.split('@')[0]
    } else if (rec.member_name && rec.member_name.trim() !== '') {
      resolvedName = rec.member_name.trim()
    } else {
      resolvedName = 'DevStudio Member'
    }

    // Resolve USN: Prioritize explicit USN, then MITE email prefix, then devstudio_id
    let usn = ''
    if (memberProfile?.usn && String(memberProfile.usn).trim()) {
      usn = String(memberProfile.usn).trim()
    } else if ((rec as any).usn && String((rec as any).usn).trim()) {
      usn = String((rec as any).usn).trim()
    } else if (memberProfile?.email) {
      const emailPrefix = memberProfile.email.split('@')[0]
      if (/^[0-9][a-z]{2}[0-9]{2}[a-z]{2}[0-9]{3}$/i.test(emailPrefix)) {
        usn = emailPrefix.toUpperCase()
      }
    }
    if (!usn && memberProfile?.devstudio_id) {
      usn = memberProfile.devstudio_id
    }
    if (!usn && rec.devstudio_id) {
      usn = rec.devstudio_id
    }

    const recordedTime = new Date(rec.recorded_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return {
      slNo: idx + 1,
      name: resolvedName,
      usn: usn || '—',
      status: rec.status,
      time: recordedTime,
    }
  })

  // Generate table using jspdf-autotable
  autoTable(doc, {
    startY: yPos,
    head: [['Sl.', 'Member Name', 'USN', 'Status', 'Time']],
    body: tableRows.map((row) => [
      row.slNo.toString(),
      row.name,
      row.usn,
      row.status,
      row.time,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data: any) => {
      // Color the Status column
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string
        if (val === 'PRESENT') {
          data.cell.styles.textColor = [22, 163, 74]
          data.cell.styles.fontStyle = 'bold'
        } else if (val === 'ABSENT') {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    margin: { left: margin, right: margin },
  })

  // ─── FOOTER ───
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = doc.internal.pageSize.getHeight() - 10

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)

    doc.text(
      `Generated on ${new Date().toLocaleString('en-IN')} — DevStudio MITE Attendance System`,
      margin,
      footerY
    )
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })

    // Bottom accent line
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
  }

  // ─── SAVE ───
  const sanitizedTitle = session.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)
  const dateStr = session.session_date.replace(/-/g, '')
  const filename = `DevStudio_Attendance_${sanitizedTitle}_${dateStr}.pdf`
  doc.save(filename)
}
