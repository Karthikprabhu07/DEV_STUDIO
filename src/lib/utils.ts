import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRoleName(role: 'admin' | 'organizer' | 'member' | string): string {
  switch (role) {
    case 'admin':
      return 'Dev Director'
    case 'organizer':
      return 'Dev Captain'
    case 'member':
    default:
      return 'Dev Mate'
  }
}

export function formatMembershipStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Review'
    case 'active':
      return 'Active Member'
    case 'alumni':
      return 'DevStudio Alumni'
    case 'suspended':
      return 'Suspended'
    case 'inactive':
      return 'Inactive'
    case 'rejected':
      return 'Application Rejected'
    case 'revoked':
      return 'Membership Revoked'
    default:
      return status
  }
}
