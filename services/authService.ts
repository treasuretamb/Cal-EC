
import { User, AdminRecord, AuditLog } from '../types';
import { supabase } from './supabase';
import { UserStats } from '../types';

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

  getSavedUserProfile(): User | null {
  const savedGuest = localStorage.getItem('cal_saved_guest_identity');
  if (savedGuest) {
    try { return JSON.parse(savedGuest) as User; } catch {}
  }
  return null;
},

  async initMasterPassword() {
  // Master password is set manually in Supabase.
  },

  async verifyMasterPassword(password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'master_password_hash').maybeSingle();
    if (error || !data) {
      console.warn('No master password found in Supabase. Please set one manually.');
      return false;
    }
    const inputHash = await hashPassword(password);
    return data.value === inputHash;
  } catch { return false; }
  },

  async getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      role: 'user',
      name: data.name,
      username: data.name?.split(' ')[0]?.toLowerCase() || '',
      email: data.email,
      phone: data.phone || '',
      residence: data.residence || '',
      isByuPathway: data.is_byu_pathway || false,
    };
  } catch { return null; }
},

  async syncUser(user: User) {
  if (user.role !== 'user') return;
  try {
    const deviceId = this.getOrCreateDeviceId();
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      residence: user.residence || null,
      is_byu_pathway: user.isByuPathway || false,
      device_id: deviceId,
      last_seen: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch {}
},

  async getUserStats(): Promise<UserStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');
    if (error || !data) return null;
    return {
      total: data.total || 0,
      today: data.today || 0,
      thisWeek: data.thisWeek || 0,
      thisMonth: data.thisMonth || 0,
      thisYear: data.thisYear || 0,
      byuPathwayCount: data.byuPathwayCount || 0,
      daily30: data.daily30 || [],
    };
  } catch { return null; }
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
  const { data, error } = await supabase.rpc('register_admin', {
    p_name: `${name} ${lastName}`,
    p_username: name.toLowerCase(),
    p_email: `${name.toLowerCase()}@cal.admin`,
    p_hashed_password: hashedPassword
  });
  if (error) throw error;
  const d = data[0];
  const admin: AdminRecord = {
    id: d.id, role: d.role, name: d.name, username: d.username,
    email: d.email, hashedPassword: d.hashed_password, createdAt: d.created_at
  };
  await this.logAction(admin, 'Admin Registered', `Account created for ${admin.name}`);
  return admin;
  },

  async verifyPersonalAdmin(adminId: string, password: string): Promise<AdminRecord | null> {
  try {
    const { data, error } = await supabase.rpc('get_admin_by_id', { p_id: adminId });
    if (error || !data || data.length === 0) return null;
    const d = data[0];
    const inputHash = await hashPassword(password);
    if (d.hashed_password !== inputHash) return null;
    return {
      id: d.id, role: d.role, name: d.name, username: d.username,
      email: d.email, hashedPassword: d.hashed_password, createdAt: d.created_at
    };
  } catch { return null; }
  },

  async getAllAdmins(): Promise<AdminRecord[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_admins');
    if (error) return [];
    return data.map((a: any) => ({
      id: a.id, role: a.role, name: a.name, username: a.username,
      email: a.email, hashedPassword: '', createdAt: a.created_at
    }));
  } catch { return []; }
  },

  async logAction(admin: User, action: string, details: string) {
  try {
    await supabase.rpc('insert_audit_log', {
      p_admin_id: admin.id,
      p_admin_name: admin.name,
      p_action: action,
      p_details: details
    });
  } catch {}
  },

  async getAuditLogs(): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase.rpc('get_audit_logs');
    if (error) return [];
    return data.map((l: any) => ({
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

  async verifySession(user: User): Promise<User | null> {
  try {
    if (user.role === 'admin') {
      const { data, error } = await supabase.rpc('verify_admin_session', { p_id: user.id });
      if (error || !data || data.length === 0) {
        console.warn('Session verification failed: admin not found.');
        this.logout();
        return null;
      }
      const d = data[0];
      return { id: d.id, role: 'admin', name: d.name, username: d.username, email: d.email };
    }
    return user;
  } catch { return user; }
},

  logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('cal-active-user');
  }
};
