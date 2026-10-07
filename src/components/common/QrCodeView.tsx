import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeViewProps {
  value: string
  size?: number
  className?: string
  includeBrandIcon?: boolean
}

/**
 * High-clarity, standards-compliant QR Code generator (ISO/IEC 18004).
 * Generates an actual scannable QR code of the verification URL with error correction.
 */
export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 96,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (!value) return

    let isMounted = true

    // Generate high-resolution, high-contrast QR code for reliable scanning
    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 200),
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0A0E1A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url)
        }
      })
      .catch((err) => {
        console.error('Failed to generate scannable QR code:', err)
      })

    return () => {
      isMounted = false
    }
  }, [value, size])

  return (
    <div
      className={`relative inline-flex items-center justify-center p-1.5 rounded-lg bg-white shadow-sm ${className}`}
      style={{ width: size, height: size }}
      title={`Verification QR: ${value}`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Scan to verify: ${value}`}
          className="w-full h-full object-contain rounded select-none"
          loading="eager"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-text-muted animate-pulse">
          Generating QR...
        </div>
      )}
    </div>
  )
}
