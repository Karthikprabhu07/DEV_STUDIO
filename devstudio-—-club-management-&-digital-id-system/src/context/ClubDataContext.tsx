import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  AttendanceRecord,
  ClubEvent,
  Announcement,
  ClubTask,
  DigitalIDCard,
  Achievement,
  ActivityLog,
  NotificationItem,
  ClubSettings,
  TaskStatus,
  AttendanceStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ID_CARDS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TASKS,
  INITIAL_ATTENDANCE,
  INITIAL_ACHIEVEMENTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from '../data/mockData';

interface ClubDataContextType {
  users: User[];
  idCards: DigitalIDCard[];
  events: ClubEvent[];
  announcements: Announcement[];
  tasks: ClubTask[];
  attendance: AttendanceRecord[];
  achievements: Achievement[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  settings: ClubSettings;

  // Member management
  addMember: (member: Omit<User, 'id' | 'memberId' | 'joinedAt'>) => User;
  updateMember: (id: string, updates: Partial<User>) => void;
  deleteMember: (id: string) => void;
  assignCaptainToMate: (mateId: string, captainId: string) => void;

  // Attendance management
  markAttendance: (userId: string, status: AttendanceStatus, eventTitle?: string, note?: string, markedByName?: string) => void;
  batchMarkAttendance: (records: { userId: string; status: AttendanceStatus }[], eventTitle: string, markedByName: string) => void;

  // Event management
  addEvent: (event: Omit<ClubEvent, 'id' | 'participantsCount'>) => ClubEvent;
  updateEvent: (id: string, updates: Partial<ClubEvent>) => void;
  deleteEvent: (id: string) => void;
  rsvpEvent: (eventId: string) => void;

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Announcement;
  deleteAnnouncement: (id: string) => void;

  // Tasks
  addTask: (task: Omit<ClubTask, 'id' | 'createdAt'>) => ClubTask;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // Settings
  updateSettings: (updates: Partial<ClubSettings>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // ID Cards & Verification
  getIDCardForUser: (userId: string) => DigitalIDCard | undefined;
  getCardByToken: (token: string) => { card: DigitalIDCard; user: User } | null;
  regenerateToken: (userId: string) => string;

  // Helpers
  getAttendanceStats: (userId?: string) => { total: number; present: number; absent: number; percentage: number };
  getCaptainDevMates: (captainId: string) => User[];
  resetAllData: () => void;
}

const ClubDataContext = createContext<ClubDataContextType | undefined>(undefined);

export const ClubDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const s = localStorage.getItem('devstudio_users_v2');
    return s ? JSON.parse(s) : INITIAL_USERS;
  });

  const [idCards, setIdCards] = useState<DigitalIDCard[]>(() => {
    const s = localStorage.getItem('devstudio_id_cards_v2');
    return s ? JSON.parse(s) : INITIAL_ID_CARDS;
  });

  const [events, setEvents] = useState<ClubEvent[]>(() => {
    const s = localStorage.getItem('devstudio_events_v2');
    return s ? JSON.parse(s) : INITIAL_EVENTS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const s = localStorage.getItem('devstudio_announcements_v2');
    return s ? JSON.parse(s) : INITIAL_ANNOUNCEMENTS;
  });

  const [tasks, setTasks] = useState<ClubTask[]>(() => {
    const s = localStorage.getItem('devstudio_tasks_v2');
    return s ? JSON.parse(s) : INITIAL_TASKS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const s = localStorage.getItem('devstudio_attendance_v2');
    return s ? JSON.parse(s) : INITIAL_ATTENDANCE;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const s = localStorage.getItem('devstudio_achievements_v2');
    return s ? JSON.parse(s) : INITIAL_ACHIEVEMENTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const s = localStorage.getItem('devstudio_activity_logs_v2');
    return s ? JSON.parse(s) : INITIAL_ACTIVITY_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const s = localStorage.getItem('devstudio_notifications_v2');
    return s ? JSON.parse(s) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<ClubSettings>(() => {
    const s = localStorage.getItem('devstudio_settings_v2');
    return s ? JSON.parse(s) : INITIAL_SETTINGS;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('devstudio_users_v2', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('devstudio_id_cards_v2', JSON.stringify(idCards));
  }, [idCards]);
  useEffect(() => {
    localStorage.setItem('devstudio_events_v2', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('devstudio_announcements_v2', JSON.stringify(announcements));
  }, [announcements]);
  useEffect(() => {
    localStorage.setItem('devstudio_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('devstudio_attendance_v2', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('devstudio_achievements_v2', JSON.stringify(achievements));
  }, [achievements]);
  useEffect(() => {
    localStorage.setItem('devstudio_activity_logs_v2', JSON.stringify(activityLogs));
  }, [activityLogs]);
  useEffect(() => {
    localStorage.setItem('devstudio_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('devstudio_settings_v2', JSON.stringify(settings));
  }, [settings]);

  // Log activity helper
  const logActivity = (
    title: string,
    description: string,
    actorName: string,
    actorRole: User['role'],
    type: ActivityLog['type']
  ) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      title,
      description,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Member management
  const addMember = (data: Omit<User, 'id' | 'memberId' | 'joinedAt'>): User => {
    const prefix = data.role === 'ADMIN' ? 'DS-DIR' : data.role === 'CAPTAIN' ? 'DS-CAPT' : 'DS-MATE';
    const nextNum = users.filter((u) => u.role === data.role).length + 1;
    const memberId = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const id = `usr-${Date.now().toString(36)}`;
    const newMember: User = {
      ...data,
      id,
      memberId,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newMember]);

    // Automatically generate Digital ID Card
    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newCard: DigitalIDCard = {
      id: `idc-${Date.now().toString(36)}`,
      userId: id,
      memberId,
      role: data.role,
      verificationToken: token,
      issuedAt: new Date().toISOString().split('T')[0],
      expiresAt: '2027-06-30',
      status: 'ACTIVE',
      bloodGroup: 'O+ve',
      emergencyContact: '+91 98800 00000',
    };
    setIdCards((prev) => [...prev, newCard]);

    logActivity(
      'New Member Joined',
      `${newMember.name} enrolled as ${data.role} (${memberId}).`,
      'System Admin',
      'ADMIN',
      'MEMBER'
    );

    return newMember;
  };

  const updateMember = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteMember = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setIdCards((prev) => prev.filter((c) => c.userId !== id));
  };

  const assignCaptainToMate = (mateId: string, captainId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === mateId ? { ...u, captainId } : u)));
    const mate = users.find((u) => u.id === mateId);
    const capt = users.find((u) => u.id === captainId);
    if (mate && capt) {
      logActivity(
        'Captain Assigned',
        `${mate.name} assigned under Captain ${capt.name}.`,
        'Director',
        'ADMIN',
        'MEMBER'
      );
    }
  };

  // Attendance management
  const markAttendance = (
    userId: string,
    status: AttendanceStatus,
    eventTitle: string = 'DevStudio Club Session',
    note?: string,
    markedByName: string = 'DevStudio Lead'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      eventTitle,
      date: today,
      status,
      markedBy: markedByName,
      markedAt: new Date().toISOString(),
      note,
    };
    setAttendance((prev) => [newRecord, ...prev]);

    const targetUser = users.find((u) => u.id === userId);
    logActivity(
      'Attendance Marked',
      `Marked ${status} for ${targetUser?.name || 'Member'}.`,
      markedByName,
      'CAPTAIN',
      'ATTENDANCE'
    );
  };

  const batchMarkAttendance = (
    records: { userId: string; status: AttendanceStatus }[],
    eventTitle: string,
    markedByName: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      id: `att-${Date.now()}-${i}`,
      userId: r.userId,
      eventTitle,
      date: today,
      status: r.status,
      markedBy: markedByName,
      markedAt: new Date().toISOString(),
    }));

    setAttendance((prev) => [...newRecords, ...prev]);
    logActivity(
      'Batch Attendance Marked',
      `Marked attendance for ${records.length} Dev Mates in "${eventTitle}".`,
      markedByName,
      'CAPTAIN',
      'ATTENDANCE'
    );
  };

  // Events management
  const addEvent = (eventData: Omit<ClubEvent, 'id' | 'participantsCount'>): ClubEvent => {
    const newEvent: ClubEvent = {
      ...eventData,
      id: `evt-${Date.now().toString(36)}`,
      participantsCount: 0,
    };
    setEvents((prev) => [newEvent, ...prev]);
    logActivity('New Event Scheduled', `"${newEvent.title}" scheduled for ${newEvent.date}.`, 'Director', 'ADMIN', 'EVENT');
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<ClubEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const rsvpEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, participantsCount: (e.participantsCount || 0) + 1 } : e))
    );
  };

  // Announcements
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    logActivity('Announcement Published', `"${newAnn.title}" published with ${newAnn.priority} priority.`, data.authorName, data.authorRole, 'ANNOUNCEMENT');
    return newAnn;
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Tasks
  const addTask = (data: Omit<ClubTask, 'id' | 'createdAt'>): ClubTask => {
    const newTask: ClubTask = {
      ...data,
      id: `tsk-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity('Task Assigned', `Assigned "${newTask.title}" to ${newTask.assignedToName}.`, 'Club Captain', 'CAPTAIN', 'TASK');
    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Settings
  const updateSettings = (updates: Partial<ClubSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Digital ID Card operations
  const getIDCardForUser = (userId: string): DigitalIDCard | undefined => {
    return idCards.find((c) => c.userId === userId);
  };

  const getCardByToken = (token: string): { card: DigitalIDCard; user: User } | null => {
    const cleanToken = token.trim();
    const card = idCards.find((c) => c.verificationToken === cleanToken);
    if (!card) return null;
    const user = users.find((u) => u.id === card.userId);
    if (!user) return null;
    return { card, user };
  };

  const regenerateToken = (userId: string): string => {
    const newToken = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setIdCards((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, verificationToken: newToken } : c))
    );
    return newToken;
  };

  // Stats helpers
  const getAttendanceStats = (userId?: string) => {
    const relevant = userId ? attendance.filter((a) => a.userId === userId) : attendance;
    const total = relevant.length;
    const present = relevant.filter((a) => a.status === 'PRESENT').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const getCaptainDevMates = (captainId: string) => {
    return users.filter((u) => u.role === 'DEV_MATE' && u.captainId === captainId);
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setIdCards(INITIAL_ID_CARDS);
    setEvents(INITIAL_EVENTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setTasks(INITIAL_TASKS);
    setAttendance(INITIAL_ATTENDANCE);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
  };

  return (
    <ClubDataContext.Provider
      value={{
        users,
        idCards,
        events,
        announcements,
        tasks,
        attendance,
        achievements,
        activityLogs,
        notifications,
        settings,
        addMember,
        updateMember,
        deleteMember,
        assignCaptainToMate,
        markAttendance,
        batchMarkAttendance,
        addEvent,
        updateEvent,
        deleteEvent,
        rsvpEvent,
        addAnnouncement,
        deleteAnnouncement,
        addTask,
        updateTaskStatus,
        deleteTask,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        getIDCardForUser,
        getCardByToken,
        regenerateToken,
        getAttendanceStats,
        getCaptainDevMates,
        resetAllData,
      }}
    >
      {children}
    </ClubDataContext.Provider>
  );
};

export const useClubData = () => {
  const context = useContext(ClubDataContext);
  if (!context) throw new Error('useClubData must be used within ClubDataProvider');
  return context;
};
