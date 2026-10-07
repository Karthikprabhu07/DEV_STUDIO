export type UserRole = 'ADMIN' | 'CAPTAIN' | 'DEV_MATE';

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export type EventStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type IDCardStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor?: string;
  avatarIcon?: string;
  profileImage?: string;
  branch: string;
  semester: string;
  usn: string; // University Seat Number (MITE / VTU format)
  memberId: string;
  captainId?: string; // id of assigned captain
  status: MemberStatus;
  joinedAt: string;
  phone?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  eventId?: string;
  eventTitle?: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string; // name or user id
  markedAt: string;
  note?: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venueType: 'CAMPUS' | 'ONLINE' | 'HYBRID';
  category: 'WORKSHOP' | 'HACKATHON' | 'TECH_TALK' | 'CHALLENGE' | 'MEETUP';
  createdBy: string;
  status: EventStatus;
  maxParticipants?: number;
  participantsCount: number;
  coverGradient?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  createdBy: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  isPinned?: boolean;
}

export interface ClubTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // userId
  assignedToName: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  eventReference?: string;
}

export interface DigitalIDCard {
  id: string;
  userId: string;
  memberId: string;
  role: UserRole;
  verificationToken: string;
  issuedAt: string;
  expiresAt: string;
  status: IDCardStatus;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  awardedAt: string;
  icon: string;
  badgeLabel: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  type: 'MEMBER' | 'ATTENDANCE' | 'EVENT' | 'ANNOUNCEMENT' | 'TASK' | 'ID_CARD';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'EVENT' | 'ATTENDANCE' | 'ANNOUNCEMENT' | 'TASK' | 'SYSTEM';
  link?: string;
}

export interface ClubSettings {
  clubName: string;
  tagline: string;
  institution: string;
  branchOffice: string;
  contactEmail: string;
  minAttendancePercent: number;
  qrAttendanceEnabled: boolean;
  academicYear: string;
  semesterTerm: string;
}
