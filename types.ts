
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string for the day
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
  posterUrl: string;
  rsvpLink?: string;
  location?: string;
  category: 'Intellectual' | 'Physical' | 'Service' | 'Social' | 'Spiritual' | 'Other';
  color: string;
}

export interface User {
  id: string;
  role: 'admin' | 'user';
  name: string; // Display name
  username: string;
  email: string;
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

// Internal database record structure for general users
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
