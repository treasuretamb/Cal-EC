
import { User, AdminRecord, AuditLog } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'cal_session_token';
const DEVICE_ID_KEY = 'cal_device_id';
const SAVED_GUEST_KEY = 'cal_saved_guest_identity';

export const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const isTableMissingError = (error: any) => {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  return msg.includes('schema cache') || msg.includes('not found') || error.code === '42P01';
};

export const authService = {
  getOrCreateDeviceId(): string {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  async initMasterPassword() {
    try {
      const { data, error } = await supabase.from('app_config').select('value').eq('key', 'master_password_hash').maybeSingle();
      if (error && !isTableMissingError(error)) throw error;
      if (!data && !error) {
        const hashed = await hashPassword('admin@1');
        await supabase.from('app_config').insert({ key: 'master_password_hash', value: hashed });
      }
    } catch (e) {}
  },

  async verifyMasterPassword(password: string): Promise<boolean> {
    await this.initMasterPassword();
    try {
      const { data, error } = await supabase.from('app_config').select('value').eq('key', 'master_password_hash').maybeSingle();
      if (error || !data) return false;
      const inputHash = await hashPassword(password);
      return data.value === inputHash;
    } catch { return false; }
  },

  async syncUser(user: User) {
    if (user.role !== 'user') return;
    try {
      const deviceId = this.getOrCreateDeviceId();
      await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        device_id: deviceId,
        last_seen: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch {}
  },

  async getGlobalUserCount(): Promise<number> {
    try {
      const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (error && isTableMissingError(error)) return 0;
      return count || 0;
    } catch { return 0; }
  },

  async registerPersonalAdmin(name: string, lastName: string, password: string): Promise<AdminRecord> {
    const hashedPassword = await hashPassword(password);
    const newAdminData = {
      role: 'admin',
      name: `${name} ${lastName}`,
      username: name.toLowerCase(),
      email: `${name.toLowerCase()}@cal.admin`,
      hashed_password: hashedPassword,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('admins').insert(newAdminData).select().single();
    if (error) throw error;
    const admin: AdminRecord = {
      id: data.id, role: data.role, name: data.name, username: data.username, 
      email: data.email, hashedPassword: data.hashed_password, createdAt: data.created_at
    };
    await this.logAction(admin, 'Admin Registered', `Account created for ${admin.name}`);
    return admin;
  },

  async verifyPersonalAdmin(adminId: string, password: string): Promise<AdminRecord | null> {
    try {
      const { data, error } = await supabase.from('admins').select('*').eq('id', adminId).maybeSingle();
      if (error || !data) return null;
      const inputHash = await hashPassword(password);
      if (data.hashed_password !== inputHash) return null;
      return {
        id: data.id, role: data.role, name: data.name, username: data.username, 
        email: data.email, hashedPassword: data.hashed_password, createdAt: data.created_at
      };
    } catch { return null; }
  },

  async getAllAdmins(): Promise<AdminRecord[]> {
    try {
      const { data, error } = await supabase.from('admins').select('*').order('name');
      if (error) return [];
      return data.map(a => ({
        id: a.id, role: a.role, name: a.name, username: a.username, 
        email: a.email, hashedPassword: a.hashed_password, createdAt: a.created_at
      }));
    } catch { return []; }
  },

  async logAction(admin: User, action: string, details: string) {
    try {
      await supabase.from('audit_logs').insert({
        admin_id: admin.id, admin_name: admin.name, action, details, timestamp: new Date().toISOString()
      });
    } catch {}
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (error) return [];
      return data.map(l => ({
        id: l.id, adminId: l.admin_id, adminName: l.admin_name, 
        action: l.action, details: l.details, timestamp: l.timestamp
      }));
    } catch { return []; }
  },

  createSession(user: User): void {
    const sessionToken = btoa(`${user.id}:${user.role}:${Date.now()}`);
    localStorage.setItem(SESSION_KEY, sessionToken);
    localStorage.setItem('cal-active-user', JSON.stringify(user));
    if (user.role === 'user') localStorage.setItem(SAVED_GUEST_KEY, JSON.stringify(user));
    this.syncUser(user);
  },

  getCurrentSession(): User | null {
    const token = localStorage.getItem(SESSION_KEY);
    const userJson = localStorage.getItem('cal-active-user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        const [id, role] = atob(token).split(':');
        if (user.id === id && user.role === role) return user;
      } catch {}
    }
    const savedGuest = localStorage.getItem(SAVED_GUEST_KEY);
    if (savedGuest) {
      try { return JSON.parse(savedGuest) as User; } catch {}
    }
    return null;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('cal-active-user');
  }
};
