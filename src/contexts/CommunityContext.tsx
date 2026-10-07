import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Project,
  ProjectMember,
  ProjectTask,
  TaskStatus,
  TaskPriority,
  Challenge,
  ChallengeSubmission,
  SubmissionStatus,
  Resource,
  ResourceCategory,
  ResourceDifficulty,
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AppNotification,
  Badge,
  MemberBadge,
} from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CommunityContextType {
  // Projects
  projects: Project[]
  tasks: ProjectTask[]
  members: ProjectMember[]
  createProject: (data: {
    title: string
    description: string
    github_repo_url?: string
    live_demo_url?: string
    tech_stack: string[]
  }) => Promise<{ success: boolean; error?: string; project?: Project }>
  joinProject: (projectId: string) => Promise<{ success: boolean; error?: string }>
  leaveProject: (projectId: string) => Promise<{ success: boolean; error?: string }>
  createTask: (
    projectId: string,
    data: { title: string; description?: string; priority: TaskPriority; assigned_to?: string }
  ) => Promise<{ success: boolean; error?: string; task?: ProjectTask }>
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<{ success: boolean; error?: string }>
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>

  // Challenges
  challenges: Challenge[]
  submissions: ChallengeSubmission[]
  createChallenge: (data: {
    title: string
    description: string
    requirements: string
    bounty_or_prize?: string
    start_time: string
    end_time: string
  }) => Promise<{ success: boolean; error?: string; challenge?: Challenge }>
  submitChallenge: (
    challengeId: string,
    data: { team_name: string; github_url: string; demo_url?: string; writeup: string }
  ) => Promise<{ success: boolean; error?: string; submission?: ChallengeSubmission }>
  gradeSubmission: (
    submissionId: string,
    score: number,
    rank: number,
    status: SubmissionStatus
  ) => Promise<{ success: boolean; error?: string }>

  // Resources
  resources: Resource[]
  createResource: (data: {
    title: string
    url: string
    category: ResourceCategory
    description: string
    tags: string[]
    difficulty: ResourceDifficulty
  }) => Promise<{ success: boolean; error?: string; resource?: Resource }>

  // Announcements
  announcements: Announcement[]
  createAnnouncement: (data: {
    title: string
    content: string
    category: AnnouncementCategory
    priority: AnnouncementPriority
    is_pinned: boolean
  }) => Promise<{ success: boolean; error?: string; announcement?: Announcement }>
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>

  // Notifications
  notifications: AppNotification[]
  unreadNotificationsCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Badges
  badges: Badge[]
  memberBadges: MemberBadge[]
  awardBadge: (
    userId: string,
    badgeCodeOrId: string,
    reason: string
  ) => Promise<{ success: boolean; error?: string; badge?: MemberBadge }>
  checkAttendanceBadges: (
    userId: string,
    totalSessions: number,
    presentSessions: number
  ) => Promise<{ awarded: boolean }>
  isLoading: boolean
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isStaff, isAdmin, isActiveMember } = useAuth()

  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [badges] = useState<Badge[]>([
    {
      id: 'b-1',
      code: 'FIRST_PROJECT',
      name: 'First Project Shipped',
      description: 'Successfully initialized and registered an open-source software project in DevStudio.',
      icon: 'Rocket',
      category: 'development',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b-2',
      code: 'HACKATHON_FINALIST',
      name: 'Challenge Podium',
      description: 'Ranked in the top 3 on the leaderboard of an official DevStudio build sprint.',
      icon: 'Trophy',
      category: 'hackathon',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b-3',
      code: 'PERFECT_ATTENDANCE',
      name: 'Flawless Record',
      description: 'Attended 100% of club sessions and technical workshops over an academic cycle.',
      icon: 'CheckCircle2',
      category: 'attendance',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b-4',
      code: 'DEV_CAPTAIN_MERIT',
      name: 'Leadership & Mentorship',
      description: 'Recognized for conducting sessions and leading developer teams at MITE.',
      icon: 'Shield',
      category: 'leadership',
      created_at: new Date().toISOString(),
    },
  ])
  const [memberBadges, setMemberBadges] = useState<MemberBadge[]>([])

  // Load from local cache / Supabase
  useEffect(() => {
    const loadState = () => {
      try {
        const p = localStorage.getItem('devstudio_projects')
        if (p) setProjects(JSON.parse(p))

        const t = localStorage.getItem('devstudio_project_tasks')
        if (t) setTasks(JSON.parse(t))

        const pm = localStorage.getItem('devstudio_project_members')
        if (pm) setProjectMembers(JSON.parse(pm))

        const c = localStorage.getItem('devstudio_challenges')
        if (c) setChallenges(JSON.parse(c))

        const s = localStorage.getItem('devstudio_challenge_submissions')
        if (s) setSubmissions(JSON.parse(s))

        const r = localStorage.getItem('devstudio_resources')
        if (r) setResources(JSON.parse(r))

        const a = localStorage.getItem('devstudio_announcements')
        if (a) setAnnouncements(JSON.parse(a))

        const n = localStorage.getItem('devstudio_notifications')
        if (n) setNotifications(JSON.parse(n))

        const mb = localStorage.getItem('devstudio_member_badges')
        if (mb) setMemberBadges(JSON.parse(mb))
      } catch (e) {
        console.error('Error loading community data:', e)
      }
    }

    loadState()

    // Also attempt Supabase sync if credentials provided
    const syncFromSupabase = async () => {
      try {
        const [
          { data: pData },
          { data: cData },
          { data: rData },
          { data: aData },
        ] = await Promise.all([
          supabase.from('projects').select('*'),
          supabase.from('challenges').select('*'),
          supabase.from('resources').select('*'),
          supabase.from('announcements').select('*'),
        ])

        if (pData && pData.length > 0) {
          setProjects(pData)
          localStorage.setItem('devstudio_projects', JSON.stringify(pData))
        }
        if (cData && cData.length > 0) {
          setChallenges(cData)
          localStorage.setItem('devstudio_challenges', JSON.stringify(cData))
        }
        if (rData && rData.length > 0) {
          setResources(rData)
          localStorage.setItem('devstudio_resources', JSON.stringify(rData))
        }
        if (aData && aData.length > 0) {
          setAnnouncements(aData)
          localStorage.setItem('devstudio_announcements', JSON.stringify(aData))
        }
      } catch {
        // Fallback gracefully to persisted storage
      }
    }

    syncFromSupabase().finally(() => {
      // Small simulated delay to prevent skeleton flicker for near-instant loads
      setTimeout(() => setIsLoading(false), 500)
    })
  }, [])

  // Push notification helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'created_at'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setNotifications((prev) => {
      const updated = [newNotif, ...prev]
      localStorage.setItem('devstudio_notifications', JSON.stringify(updated))
      return updated
    })
  }

  // Projects methods
  const createProject = async (data: {
    title: string
    description: string
    github_repo_url?: string
    live_demo_url?: string
    tech_stack: string[]
  }) => {
    if (!profile) return { success: false, error: 'Authentication required' }
    if (!isActiveMember && !isStaff) {
      return { success: false, error: 'Only active Dev Mates can register projects.' }
    }

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const newProject: Project = {
      id: crypto.randomUUID(),
      title: data.title,
      slug,
      description: data.description,
      github_repo_url: data.github_repo_url || null,
      live_demo_url: data.live_demo_url || null,
      tech_stack: data.tech_stack,
      status: 'active',
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const leadMember: ProjectMember = {
      id: crypto.randomUUID(),
      project_id: newProject.id,
      user_id: profile.id,
      role: 'lead',
      joined_at: new Date().toISOString(),
      profile,
    }

    const updatedProjects = [newProject, ...projects]
    const updatedMembers = [leadMember, ...projectMembers]

    setProjects(updatedProjects)
    setProjectMembers(updatedMembers)
    localStorage.setItem('devstudio_projects', JSON.stringify(updatedProjects))
    localStorage.setItem('devstudio_project_members', JSON.stringify(updatedMembers))

    // Attempt Supabase insert
    try {
      await supabase.from('projects').insert([newProject])
      await supabase.from('project_members').insert([leadMember])
    } catch {
      console.warn('Supabase sync skipped, stored locally')
    }

    // Award badge if first project
    const hasShippedBadge = memberBadges.some(
      (mb) => mb.user_id === profile.id && mb.badge_id === 'b-1'
    )
    if (!hasShippedBadge) {
      const newBadge: MemberBadge = {
        id: crypto.randomUUID(),
        user_id: profile.id,
        badge_id: 'b-1',
        awarded_at: new Date().toISOString(),
        reason: `Shipped first project "${newProject.title}"`,
      }
      const updatedBadges = [...memberBadges, newBadge]
      setMemberBadges(updatedBadges)
      localStorage.setItem('devstudio_member_badges', JSON.stringify(updatedBadges))

      addNotification({
        user_id: profile.id,
        title: 'Badge Awarded!',
        message: 'You earned the "First Project Shipped" badge for registering your software workspace.',
        type: 'badge',
        link: '/profile',
      })
    }

    addNotification({
      user_id: profile.id,
      title: 'Project Initialized',
      message: `Project workspace "${newProject.title}" has been created successfully.`,
      type: 'project',
      link: '/projects',
    })

    return { success: true, project: newProject }
  }

  const joinProject = async (projectId: string) => {
    if (!profile) return { success: false, error: 'Authentication required' }
    const exists = projectMembers.some(
      (m) => m.project_id === projectId && m.user_id === profile.id
    )
    if (exists) return { success: false, error: 'Already a project member' }

    const newMember: ProjectMember = {
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: profile.id,
      role: 'contributor',
      joined_at: new Date().toISOString(),
      profile,
    }

    const updated = [...projectMembers, newMember]
    setProjectMembers(updated)
    localStorage.setItem('devstudio_project_members', JSON.stringify(updated))

    try {
      await supabase.from('project_members').insert([newMember])
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true }
  }

  const leaveProject = async (projectId: string) => {
    if (!profile) return { success: false, error: 'Authentication required' }
    const updated = projectMembers.filter(
      (m) => !(m.project_id === projectId && m.user_id === profile.id)
    )
    setProjectMembers(updated)
    localStorage.setItem('devstudio_project_members', JSON.stringify(updated))

    try {
      await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, user_id: profile.id })
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true }
  }

  const createTask = async (
    projectId: string,
    data: { title: string; description?: string; priority: TaskPriority; assigned_to?: string }
  ) => {
    if (!profile) return { success: false, error: 'Authentication required' }

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      project_id: projectId,
      title: data.title,
      description: data.description || null,
      status: 'todo',
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [...tasks, newTask]
    setTasks(updated)
    localStorage.setItem('devstudio_project_tasks', JSON.stringify(updated))

    try {
      await supabase.from('project_tasks').insert([newTask])
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true, task: newTask }
  }

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
    )
    setTasks(updated)
    localStorage.setItem('devstudio_project_tasks', JSON.stringify(updated))

    try {
      await supabase.from('project_tasks').update({ status }).eq('id', taskId)
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true }
  }

  const deleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId)
    setTasks(updated)
    localStorage.setItem('devstudio_project_tasks', JSON.stringify(updated))

    try {
      await supabase.from('project_tasks').delete().eq('id', taskId)
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true }
  }

  // Challenges methods
  const createChallenge = async (data: {
    title: string
    description: string
    requirements: string
    bounty_or_prize?: string
    start_time: string
    end_time: string
  }) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Only Dev Directors or Captains can announce challenges.' }
    }

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const newChallenge: Challenge = {
      id: crypto.randomUUID(),
      title: data.title,
      slug,
      description: data.description,
      requirements: data.requirements,
      bounty_or_prize: data.bounty_or_prize || null,
      start_time: data.start_time,
      end_time: data.end_time,
      status: 'active',
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newChallenge, ...challenges]
    setChallenges(updated)
    localStorage.setItem('devstudio_challenges', JSON.stringify(updated))

    try {
      await supabase.from('challenges').insert([newChallenge])
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Push broadcast announcement & notification
    addNotification({
      user_id: profile.id,
      title: 'Build Challenge Live!',
      message: `"${newChallenge.title}" has been launched. Review requirements and submit your build.`,
      type: 'challenge',
      link: '/challenges',
    })

    return { success: true, challenge: newChallenge }
  }

  const submitChallenge = async (
    challengeId: string,
    data: { team_name: string; github_url: string; demo_url?: string; writeup: string }
  ) => {
    if (!profile) return { success: false, error: 'Authentication required' }
    if (!isActiveMember && !isStaff) {
      return { success: false, error: 'Only active Dev Mates can submit entries.' }
    }

    const existing = submissions.find(
      (s) => s.challenge_id === challengeId && s.user_id === profile.id
    )
    if (existing) {
      return { success: false, error: 'You have already submitted an entry for this challenge.' }
    }

    const newSubmission: ChallengeSubmission = {
      id: crypto.randomUUID(),
      challenge_id: challengeId,
      user_id: profile.id,
      team_name: data.team_name,
      github_url: data.github_url,
      demo_url: data.demo_url || null,
      writeup: data.writeup,
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile,
    }

    const updated = [newSubmission, ...submissions]
    setSubmissions(updated)
    localStorage.setItem('devstudio_challenge_submissions', JSON.stringify(updated))

    try {
      await supabase.from('challenge_submissions').insert([newSubmission])
    } catch {
      console.warn('Supabase sync skipped')
    }

    addNotification({
      user_id: profile.id,
      title: 'Challenge Entry Submitted',
      message: `Your project submission for team "${data.team_name}" is received and queued for evaluation.`,
      type: 'challenge',
      link: '/challenges',
    })

    return { success: true, submission: newSubmission }
  }

  const gradeSubmission = async (
    submissionId: string,
    score: number,
    rank: number,
    status: SubmissionStatus
  ) => {
    if (!isStaff) return { success: false, error: 'Staff access required' }

    const updated = submissions.map((s) => {
      if (s.id === submissionId) {
        return {
          ...s,
          score,
          rank,
          status,
          updated_at: new Date().toISOString(),
        }
      }
      return s
    })

    setSubmissions(updated)
    localStorage.setItem('devstudio_challenge_submissions', JSON.stringify(updated))

    try {
      await supabase
        .from('challenge_submissions')
        .update({ score, rank, status })
        .eq('id', submissionId)
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Award Challenge Podium badge if ranked in top 3
    if (rank > 0 && rank <= 3) {
      const sub = submissions.find((s) => s.id === submissionId)
      if (sub) {
        await awardBadge(
          sub.user_id,
          'HACKATHON_FINALIST',
          `Earned podium rank #${rank} in official DevStudio build challenge`
        )
      }
    }

    return { success: true }
  }

  // Resources methods
  const createResource = async (data: {
    title: string
    url: string
    category: ResourceCategory
    description: string
    tags: string[]
    difficulty: ResourceDifficulty
  }) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Only Dev Directors or Captains can publish resources.' }
    }

    const newResource: Resource = {
      id: crypto.randomUUID(),
      title: data.title,
      url: data.url,
      category: data.category,
      description: data.description,
      tags: data.tags,
      difficulty: data.difficulty,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newResource, ...resources]
    setResources(updated)
    localStorage.setItem('devstudio_resources', JSON.stringify(updated))

    try {
      await supabase.from('resources').insert([newResource])
    } catch {
      console.warn('Supabase sync skipped')
    }

    return { success: true, resource: newResource }
  }

  // Announcements methods
  const createAnnouncement = async (data: {
    title: string
    content: string
    category: AnnouncementCategory
    priority: AnnouncementPriority
    is_pinned: boolean
  }) => {
    if (!profile || !isStaff) {
      return { success: false, error: 'Only Dev Directors or Captains can broadcast announcements.' }
    }

    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      is_pinned: data.is_pinned,
      published_at: new Date().toISOString(),
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newAnnouncement, ...announcements]
    setAnnouncements(updated)
    localStorage.setItem('devstudio_announcements', JSON.stringify(updated))

    try {
      await supabase.from('announcements').insert([newAnnouncement])
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Broadcast notification
    if (profile) {
      addNotification({
        user_id: profile.id,
        title: `Announcement: ${newAnnouncement.title}`,
        message: newAnnouncement.content.slice(0, 100) + '...',
        type: 'system',
        link: '/',
      })
    }

    return { success: true, announcement: newAnnouncement }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!isAdmin) {
      return { success: false, error: 'Only Dev Directors can delete announcements.' }
    }

    const ann = announcements.find((a) => a.id === id)
    if (!ann) return { success: false, error: 'Announcement not found.' }

    const updated = announcements.filter((a) => a.id !== id)
    setAnnouncements(updated)
    localStorage.setItem('devstudio_announcements', JSON.stringify(updated))

    try {
      await supabase.from('announcements').delete().eq('id', id)
    } catch {
      console.warn('Supabase sync skipped')
    }

    // Remove associated notifications
    const targetTitle = `Announcement: ${ann.title}`
    const updatedNotifs = notifications.filter((n) => n.title !== targetTitle)
    if (updatedNotifs.length !== notifications.length) {
      setNotifications(updatedNotifs)
      localStorage.setItem('devstudio_notifications', JSON.stringify(updatedNotifs))
      try {
        await supabase.from('notifications').delete().eq('title', targetTitle)
      } catch {}
    }

    return { success: true }
  }

  // Notifications methods
  const userNotifications = notifications.filter(
    (n) => !profile || n.user_id === profile.id
  )
  const unreadNotificationsCount = userNotifications.filter((n) => !n.read_at).length

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    )
    setNotifications(updated)
    localStorage.setItem('devstudio_notifications', JSON.stringify(updated))
  }

  const markAllNotificationsRead = () => {
    const now = new Date().toISOString()
    const updated = notifications.map((n) => ({ ...n, read_at: n.read_at || now }))
    setNotifications(updated)
    localStorage.setItem('devstudio_notifications', JSON.stringify(updated))
  }

  // Badges methods
  const awardBadge = async (
    userId: string,
    badgeCodeOrId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string; badge?: MemberBadge }> => {
    const targetBadge = badges.find(
      (b) => b.id === badgeCodeOrId || b.code === badgeCodeOrId
    )
    if (!targetBadge) {
      return { success: false, error: 'Badge does not exist in registry.' }
    }

    const alreadyAwarded = memberBadges.some(
      (mb) => mb.user_id === userId && mb.badge_id === targetBadge.id
    )
    if (alreadyAwarded) {
      return { success: false, error: 'Member has already earned this badge.' }
    }

    const newBadge: MemberBadge = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'mb-' + Date.now(),
      user_id: userId,
      badge_id: targetBadge.id,
      awarded_at: new Date().toISOString(),
      reason,
      badge: targetBadge,
    }

    const updated = [...memberBadges, newBadge]
    setMemberBadges(updated)
    localStorage.setItem('devstudio_member_badges', JSON.stringify(updated))

    try {
      await supabase.from('member_badges').insert([newBadge])
    } catch {
      console.warn('Supabase sync skipped')
    }

    addNotification({
      user_id: userId,
      title: 'Official Badge Awarded!',
      message: `You earned the "${targetBadge.name}" badge: ${reason}`,
      type: 'badge',
      link: '/profile',
    })

    return { success: true, badge: newBadge }
  }

  const checkAttendanceBadges = async (
    userId: string,
    totalSessions: number,
    presentSessions: number
  ): Promise<{ awarded: boolean }> => {
    if (totalSessions >= 2 && presentSessions === totalSessions) {
      const res = await awardBadge(
        userId,
        'PERFECT_ATTENDANCE',
        `Maintained 100% attendance record across ${totalSessions} official technical sessions`
      )
      return { awarded: res.success }
    }
    return { awarded: false }
  }

  return (
    <CommunityContext.Provider
      value={{
        projects,
        tasks,
        members: projectMembers,
        createProject,
        joinProject,
        leaveProject,
        createTask,
        updateTaskStatus,
        deleteTask,
        challenges,
        submissions,
        createChallenge,
        submitChallenge,
        gradeSubmission,
        resources,
        createResource,
        announcements,
        createAnnouncement,
        deleteAnnouncement,
        notifications: userNotifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        badges,
        memberBadges,
        awardBadge,
        checkAttendanceBadges,
        isLoading,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export const useCommunity = () => {
  const context = useContext(CommunityContext)
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider')
  }
  return context
}
