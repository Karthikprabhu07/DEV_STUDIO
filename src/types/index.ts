export type TechnicalRole = 'admin' | 'organizer' | 'member'
export type UserFacingRole = 'Dev Director' | 'Dev Captain' | 'Dev Mate'

export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'alumni'
  | 'suspended'
  | 'inactive'
  | 'rejected'
  | 'revoked'

export type AvatarType = 'photo' | 'devstudio_avatar' | 'default'
export type PhotoModerationStatus = 'pending' | 'approved' | 'rejected'

export type EventStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'completed'
  | 'archived'

export interface Profile {
  id: string
  clerk_user_id?: string | null
  email: string
  full_name: string
  role: TechnicalRole
  membership_status: MembershipStatus
  academic_year?: number | null
  branch?: string | null
  usn?: string | null
  bio?: string | null
  avatar_type: AvatarType
  avatar_url?: string | null
  photo_moderation_status: PhotoModerationStatus
  pending_photo_url?: string | null
  photo_rejection_reason?: string | null
  created_at: string
  updated_at: string
  devstudio_id?: string | null
}

export interface ClubEvent {
  id: string
  title: string
  slug: string
  description: string
  cover_image_url?: string | null
  location: string
  start_time: string
  end_time: string
  status: EventStatus
  capacity?: number | null
  team_size_min: number
  team_size_max: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  team_name?: string | null
  status: 'confirmed' | 'cancelled' | 'waitlisted'
  registered_at: string
}

export interface AttendanceSession {
  id: string
  event_id: string
  opened_by: string
  opened_at: string
  closed_at?: string | null
  status: 'open' | 'closed'
  total_eligible: number
  total_present: number
  total_absent: number
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  session_id: string
  event_id: string
  user_id: string
  status: 'present' | 'absent'
  marked_by: string
  marked_at: string
  updated_at: string
}

export interface DevStudioId {
  id: string
  user_id: string
  devstudio_id: string
  sequence_year: number
  sequence_number: number
  assigned_at: string
}

export interface MembershipLog {
  id: string
  user_id: string
  status: MembershipStatus
  changed_by?: string | null
  reason?: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id?: string | null
  actor_name?: string | null
  action: string
  target_type: string
  target_id: string
  before_value?: any
  after_value?: any
  ip_address?: string | null
  created_at: string
}

export interface IdCard {
  id: string
  user_id: string
  devstudio_id: string
  verification_token_hash: string
  card_storage_path?: string | null
  template_version: number
  status: 'active' | 'alumni' | 'suspended' | 'inactive' | 'revoked'
  last_generated_at: string
  token_rotated_at?: string | null
  created_at: string
  updated_at: string
}

export interface WalletPass {
  id: string
  user_id: string
  pass_type: 'apple' | 'google'
  pass_serial_number: string
  authentication_token: string
  google_pass_id?: string | null
  push_token?: string | null
  device_library_identifier?: string | null
  status: 'active' | 'alumni' | 'suspended' | 'revoked'
  last_push_at?: string | null
  created_at: string
  updated_at: string
}

// ==============================================================================
// PHASE 4 COMMUNITY & CLUB TYPES
// ==============================================================================

export type ProjectStatus = 'active' | 'completed' | 'archived'
export type ProjectMemberRole = 'lead' | 'contributor'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  github_repo_url?: string | null
  live_demo_url?: string | null
  tech_stack: string[]
  status: ProjectStatus
  created_by: string
  created_at: string
  updated_at: string
  members?: ProjectMember[]
  tasks?: ProjectTask[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: ProjectMemberRole
  joined_at: string
  profile?: Profile
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to?: string | null
  created_by: string
  created_at: string
  updated_at: string
  assignee?: Profile | null
}

export type ChallengeStatus = 'upcoming' | 'active' | 'evaluating' | 'completed'
export type SubmissionStatus = 'submitted' | 'under_review' | 'awarded'

export interface Challenge {
  id: string
  title: string
  slug: string
  description: string
  requirements: string
  bounty_or_prize?: string | null
  start_time: string
  end_time: string
  status: ChallengeStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChallengeSubmission {
  id: string
  challenge_id: string
  user_id: string
  team_name: string
  github_url: string
  demo_url?: string | null
  writeup: string
  score?: number | null
  rank?: number | null
  status: SubmissionStatus
  created_at: string
  updated_at: string
  profile?: Profile
}

export type ResourceCategory = 'full_stack' | 'vibe_coding' | 'deployment' | 'ui_ux' | 'cybersecurity'
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Resource {
  id: string
  title: string
  url: string
  category: ResourceCategory
  description: string
  tags: string[]
  difficulty: ResourceDifficulty
  created_by: string
  created_at: string
  updated_at: string
}

export type AnnouncementCategory = 'general' | 'event' | 'workshop' | 'hackathon' | 'urgent'
export type AnnouncementPriority = 'normal' | 'high' | 'urgent'

export interface Announcement {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  is_pinned: boolean
  published_at: string
  created_by: string
  created_at: string
  updated_at: string
}

export type NotificationType = 'event' | 'attendance' | 'project' | 'challenge' | 'membership' | 'badge' | 'system'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link?: string | null
  read_at?: string | null
  created_at: string
}

export type BadgeCategory = 'development' | 'attendance' | 'leadership' | 'hackathon'

export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  created_at: string
}

export interface MemberBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
  awarded_by?: string | null
  reason?: string | null
  badge?: Badge
}

// ==============================================================================
// PHASE 5 & 6 CERTIFICATE & GITHUB TYPES
// ==============================================================================

export type CertificateType = 'merit' | 'completion' | 'winner' | 'participation'

export interface ClubCertificate {
  id: string
  user_id: string
  event_id?: string | null
  title: string
  description: string
  issue_date: string
  certificate_type: CertificateType
  token_hash: string
  raw_token_preview: string
  verification_token?: string
  status: 'valid' | 'revoked'
  revocation_reason?: string | null
  issued_by: string
  created_at: string
  updated_at: string
  profile?: Profile
  event?: ClubEvent
}

export interface GitHubAccount {
  id: string
  user_id: string
  github_username: string
  github_id?: string | null
  avatar_url?: string | null
  profile_url: string
  linked_at: string
  last_synced_at?: string | null
}

export interface GitHubStats {
  id: string
  user_id: string
  total_repos: number
  public_repos?: number
  total_stars: number
  total_contributions: number
  followers?: number
  top_languages: string[]
  recent_repos: Array<{
    name: string
    url: string
    language: string
    stars: number
    description?: string
  }>
  last_synced_at: string
}


