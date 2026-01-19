
import { supabase } from './supabase';

export const notificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  sendNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
          silent: false,
          requireInteraction: true,
          ...options
        });

        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        notification.onclick = function() {
          window.focus();
          this.close();
        };

        return true;
      } catch (e) {
        console.error("Failed to fire notification", e);
      }
    }
    return false;
  },

  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async syncWithServer(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId);
      
      if (error) return;

      const localReminders = this.getReminders();
      data.forEach(rem => {
        localReminders[rem.event_id] = { 
          time: rem.event_time, 
          notified: rem.notified 
        };
      });
      localStorage.setItem('cal-event-reminders', JSON.stringify(localReminders));
    } catch (e) {}
  },

  async saveReminder(eventId: string, eventTime: string, userId?: string) {
    const reminders = this.getReminders();
    reminders[eventId] = { time: eventTime, notified: false };
    localStorage.setItem('cal-event-reminders', JSON.stringify(reminders));

    if (userId) {
      try {
        await supabase.from('reminders').upsert({
          user_id: userId,
          event_id: eventId,
          event_time: eventTime,
          notified: false
        }, { onConflict: 'user_id,event_id' });
      } catch (e) {}
    }
  },

  getReminders(): Record<string, { time: string, notified: boolean }> {
    const stored = localStorage.getItem('cal-event-reminders');
    try {
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
  },

  hasReminder(eventId: string) {
    return !!this.getReminders()[eventId];
  },

  async removeReminder(eventId: string, userId?: string) {
    const reminders = this.getReminders();
    delete reminders[eventId];
    localStorage.setItem('cal-event-reminders', JSON.stringify(reminders));

    if (userId) {
      try {
        await supabase.from('reminders').delete().match({ user_id: userId, event_id: eventId });
      } catch (e) {}
    }
  },

  async markAsNotified(eventId: string, userId?: string) {
    const reminders = this.getReminders();
    if (reminders[eventId]) {
      reminders[eventId].notified = true;
      localStorage.setItem('cal-event-reminders', JSON.stringify(reminders));

      if (userId) {
        try {
          await supabase.from('reminders').update({ notified: true }).match({ user_id: userId, event_id: eventId });
        } catch (e) {}
      }
    }
  }
};
