export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  posterUrl: string;
  rsvpLink?: string;
  location?: string;
  category: 'Intellectual' | 'Physical' | 'Service' | 'Social' | 'Spiritual' | 'Other';
  color: string;
  visibility?: 'public' | 'admin_only';
  // Recurrence
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: number[];
  recurrenceEnd?: string;
  recurrenceCount?: number;
  recurrenceCustomDates?: string[];
  recurrenceGroupId?: string;
}

export interface User {
  id: string;
  role: 'admin' | 'user';
  name: string;
  username: string;
  email: string;
  phone?: string;
  residence?: string;
  isByuPathway?: boolean;
  picture?: string;
}

export interface AdminRecord extends User {
  hashedPassword: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Reminder {
  id?: string;
  userId: string;
  eventId: string;
  eventTime: string;
  notified: boolean;
}

export interface UserRecord extends User {
  hashedPassword?: string;
  resetToken?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface UserStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  byuPathwayCount: number;
  daily30: { day: string; count: number }[];
}