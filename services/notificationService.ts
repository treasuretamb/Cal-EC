import { supabase } from './supabase';

interface ReminderData {
  time: string;
  notified: boolean;
}

interface LocalReminders {
  [eventId: string]: ReminderData;
}

const REMINDERS_KEY = 'cal_reminders_v2';
const PERMISSION_KEY = 'cal_notification_permission';

export const notificationService = {
  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(PERMISSION_KEY, permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  /**
   * Send a browser notification
   */
  sendNotification(title: string, options?: NotificationOptions): void {
    if (this.getPermissionStatus() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        icon: '/icon-192.png', // You'll add this for PWA
        badge: '/icon-192.png',
        ...options
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  },

  /**
   * Add a reminder for an event - syncs to Supabase
   */
  async addReminder(eventId: string, eventTime: string, userId?: string): Promise<void> {
    // Add to local storage for immediate access
    const reminders = this.getLocalReminders();
    reminders[eventId] = {
      time: eventTime,
      notified: false
    };
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

    // Sync to Supabase if user is logged in
    if (userId) {
      try {
        await supabase
          .from('reminders')
          .upsert({
            user_id: userId,
            event_id: eventId,
            event_time: eventTime,
            notified: false
          }, {
            onConflict: 'user_id,event_id'
          });
      } catch (error) {
        console.error('Error syncing reminder to Supabase:', error);
      }
    }
  },

  /**
   * Remove a reminder - syncs to Supabase
   */
  async removeReminder(eventId: string, userId?: string): Promise<void> {
    // Remove from local storage
    const reminders = this.getLocalReminders();
    delete reminders[eventId];
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

    // Remove from Supabase if user is logged in
    if (userId) {
      try {
        await supabase
          .from('reminders')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId);
      } catch (error) {
        console.error('Error removing reminder from Supabase:', error);
      }
    }
  },

  /**
   * Mark a reminder as notified - syncs to Supabase
   */
  async markAsNotified(eventId: string, userId?: string): Promise<void> {
    // Update local storage
    const reminders = this.getLocalReminders();
    if (reminders[eventId]) {
      reminders[eventId].notified = true;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    }

    // Update Supabase if user is logged in
    if (userId) {
      try {
        await supabase
          .from('reminders')
          .update({ notified: true })
          .eq('user_id', userId)
          .eq('event_id', eventId);
      } catch (error) {
        console.error('Error updating reminder in Supabase:', error);
      }
    }
  },

  /**
   * Get all local reminders
   */
  getLocalReminders(): LocalReminders {
    try {
      const stored = localStorage.getItem(REMINDERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /**
   * Get all reminders (alias for getLocalReminders for backward compatibility)
   */
  getReminders(): LocalReminders {
    return this.getLocalReminders();
  },

  /**
   * Sync reminders from Supabase to local storage
   * Call this when user logs in or app loads
   */
  async syncWithServer(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching reminders from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const reminders: LocalReminders = {};
        data.forEach(reminder => {
          reminders[reminder.event_id] = {
            time: reminder.event_time,
            notified: reminder.notified
          };
        });
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
      }
    } catch (error) {
      console.error('Error syncing reminders:', error);
    }
  },

  /**
   * Clean up old reminders (past events that were notified)
   */
  async cleanupOldReminders(userId?: string): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Remove reminders older than 7 days

    // Clean local storage
    const reminders = this.getLocalReminders();
    let changed = false;
    Object.entries(reminders).forEach(([eventId, data]: [string, ReminderData]) => {
      const eventTime = new Date(data.time);
      if (eventTime < cutoffDate && data.notified) {
        delete reminders[eventId];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    }

    // Clean Supabase
    if (userId) {
      try {
        await supabase
          .from('reminders')
          .delete()
          .eq('user_id', userId)
          .eq('notified', true)
          .lt('event_time', cutoffDate.toISOString());
      } catch (error) {
        console.error('Error cleaning up old reminders:', error);
      }
    }
  }
};